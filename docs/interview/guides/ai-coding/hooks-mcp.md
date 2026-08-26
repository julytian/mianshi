# Cursor Hooks 与 MCP：自动化、连接与安全边界

> 版本说明：事件、字段和传输方式以 **2026-08** 为基线；实施前请核对 [Hooks](https://cursor.com/docs/hooks.md) 与 [MCP](https://cursor.com/docs/mcp.md) 官方文档。

## 职责与信任边界

Rules、Skills、Hooks、MCP 的完整职责矩阵与统一质量基线见 [Cursor 前端 AI 编程工作流](./cursor-workflow#职责矩阵与统一质量基线)。

项目 Hook 只应作为纵深防御：它和业务代码一起存入仓库，能写仓库的人也能篡改 `.cursor/hooks.json` 或脚本，因此它不是防篡改安全边界。项目 Hook 只在 trusted workspace 中加载；打开不可信仓库前应先审查 Hook。高保证策略还需团队/企业托管控制、操作系统权限、服务端鉴权和外部审计。

## Hooks 工作方式

项目配置位于 `.cursor/hooks.json`，脚本通常放在 `.cursor/hooks/`。命令 Hook 从标准输入读取 JSON，并向标准输出写 JSON：

- 退出码 `0`：执行成功，Cursor 按事件的官方输出 schema 处理 JSON；
- `beforeShellExecution` / `beforeMCPExecution` 可返回 `permission: "allow" | "deny" | "ask"`，以及可选的 `user_message`、`agent_message`；
- 退出码 `2`：明确阻止当前动作，等价于 `permission: "deny"`；
- 其他非零退出码：默认 fail-open，即动作继续；
- 安全关键 Hook 应设置 `failClosed: true`，使崩溃、超时或无效 JSON 阻止动作。

`failClosed` 只覆盖脚本崩溃、超时和无效输出，不能修复策略漏判、错误 allowlist、未覆盖事件或被篡改脚本。事件与输出字段会变化，应以实施时 [Hooks 官方文档](https://cursor.com/docs/hooks.md) 为准。

### 完整 `.cursor/hooks.json`

Shell 的 matcher 必须覆盖所有命令，避免只检查「看起来危险」的关键词。`[\s\S]*` 的 JSON 写法是 `"[\\s\\S]*"`；也可省略 matcher 让 Hook 对该事件全部运行。策略判断全部放进脚本。

```json
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": "node .cursor/hooks/security-gate.mjs",
        "matcher": "[\\s\\S]*",
        "timeout": 5,
        "failClosed": true
      }
    ],
    "beforeMCPExecution": [
      {
        "command": "node .cursor/hooks/security-gate.mjs",
        "timeout": 5,
        "failClosed": true
      }
    ],
    "afterFileEdit": [
      {
        "command": "node .cursor/hooks/audit-edit.mjs",
        "timeout": 10
      }
    ]
  }
}
```

### 完整安全脚本

保存为 `.cursor/hooks/security-gate.mjs`。MCP 使用显式「服务器 + 工具」只读 allowlist；Shell 只允许少量精确、低风险命令。未知调用默认要求人工确认，输入格式异常则拒绝。

`beforeMCPExecution` 的 `tool_input` 是 **JSON 字符串**，不是对象：

```json
{
  "mcp_server_name": "project-api-docs",
  "tool_name": "search_openapi",
  "tool_input": "{\"query\":\"UserList\"}"
}
```

```js
#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const MAX_COMMAND_LENGTH = 4096

const MCP_READ_ALLOWLIST = new Set([
  'project-api-docs:search_openapi',
  'error-monitoring:get_issue',
  'deployment-readonly:list_deployments'
])

const SHELL_ALLOWLIST = [
  /^pwd$/,
  /^git status(?: --short)?$/,
  /^git diff --check$/,
  /^git diff --name-only$/,
  /^git log -n [1-9]\d{0,2} --oneline$/
]

if (process.argv.includes('--self-test')) {
  process.exitCode = runSelfTests()
} else {
  await main()
}

async function main() {
  const decision = decideRawInput(await readStdin())
  await writeStdout(serializeOutput(decision))
  process.exitCode = decision.exitCode
}

function decideRawInput(raw) {
  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return deny('Hook 输入不是有效 JSON。')
  }

  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    return deny('Hook 输入必须是非 null 的 JSON 对象。')
  }

  return decideEvent(event)
}

function decideEvent(event) {
  if (
    Object.prototype.hasOwnProperty.call(event, 'mcp_server_name') ||
    Object.prototype.hasOwnProperty.call(event, 'tool_name')
  ) {
    const server = typeof event.mcp_server_name === 'string'
      ? event.mcp_server_name
      : ''
    const tool = typeof event.tool_name === 'string' ? event.tool_name : ''

    try {
      if (typeof event.tool_input !== 'string') throw new TypeError()
      const params = JSON.parse(event.tool_input)
      if (params === null || typeof params !== 'object' || Array.isArray(params)) {
        throw new TypeError()
      }
    } catch {
      return deny('MCP tool_input 不是有效的 JSON 对象字符串。')
    }

    const key = `${server}:${tool}`
    if (server && tool && MCP_READ_ALLOWLIST.has(key)) {
      return allow()
    }
    return ask(`未知或非只读 MCP 工具：${key || '(missing)'}，请人工确认。`)
  }

  if (typeof event.command === 'string') {
    const command = event.command.trim()
    if (!command) return deny('Shell command 为空。')
    if (command.length > MAX_COMMAND_LENGTH) {
      return ask(`Shell command 超过 ${MAX_COMMAND_LENGTH} 字符，请人工检查。`)
    }
    if (SHELL_ALLOWLIST.some((pattern) => pattern.test(command))) {
      return allow()
    }
    return ask('Shell 命令不在低风险 allowlist 中，请人工确认。')
  }

  return deny('无法识别 Hook 事件输入。')
}

function allow() {
  return { permission: 'allow', exitCode: 0 }
}

function ask(message) {
  return { permission: 'ask', message, exitCode: 0 }
}

function deny(message) {
  return { permission: 'deny', message, exitCode: 2 }
}

function serializeOutput(decision) {
  if (decision.permission === 'allow') {
    return JSON.stringify({ permission: 'allow' })
  }
  return JSON.stringify({
    permission: decision.permission,
    user_message: decision.message,
    agent_message: decision.message
  })
}

function runSelfTests() {
  const cases = [
    ['allowlist shell', '{"command":"pwd"}', 'allow', 0],
    ['rm -fr', '{"command":"rm -fr /tmp/demo"}', 'ask', 0],
    ['git -C force push', '{"command":"git -C repo push --force origin main"}', 'ask', 0],
    ['wrapped shell', `{"command":"bash -c 'git status'"}`, 'ask', 0],
    ['long command', JSON.stringify({ command: 'x'.repeat(4097) }), 'ask', 0],
    ['allowlist MCP read', JSON.stringify({
      mcp_server_name: 'project-api-docs',
      tool_name: 'search_openapi',
      tool_input: '{"query":"UserList"}'
    }), 'allow', 0],
    ['unknown MCP write', JSON.stringify({
      mcp_server_name: 'deployment',
      tool_name: 'create_release',
      tool_input: '{"environment":"production"}'
    }), 'ask', 0],
    ['malformed tool_input', JSON.stringify({
      mcp_server_name: 'project-api-docs',
      tool_name: 'search_openapi',
      tool_input: '{bad'
    }), 'deny', 2],
    ['invalid outer input', ['null', '{bad'], 'deny', 2]
  ]

  let passed = 0
  for (const [name, rawOrList, permission, exitCode] of cases) {
    const inputs = Array.isArray(rawOrList) ? rawOrList : [rawOrList]
    const ok = inputs.every((raw) => {
      const child = spawnSync(process.execPath, [process.argv[1]], {
        input: raw,
        encoding: 'utf8'
      })
      let output
      try {
        output = JSON.parse(child.stdout)
      } catch {
        return false
      }
      const allowHasOnlyPermission = permission !== 'allow'
        || Object.keys(output).length === 1
      return output.permission === permission
        && child.status === exitCode
        && allowHasOnlyPermission
    })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${permission} exit=${exitCode}`)
    if (ok) passed += 1
  }
  console.log(`TOTAL ${passed}/${cases.length}`)
  return passed === cases.length ? 0 : 1
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
```

这不是通用 Shell 解析器。精确 allowlist 只识别预期字符串；引号、换行、管道、`bash -c`、别名、包装器、`git -C` 和其他复杂形式全部落入 `ask`，不能声称几个正则能理解任意 Shell 语义。

### 安全用例表

保存脚本并执行 `chmod +x .cursor/hooks/security-gate.mjs` 后，直接运行内置测试：

```bash
node .cursor/hooks/security-gate.mjs --self-test
# 最后一行应为：TOTAL 9/9
```

9 组可重复用例如下；测试模式会为每个输入启动脚本的正常模式，捕获真实 stdout 后重新 `JSON.parse`，并检查 `allow` 输出只有 `permission`：

- `pwd` → `allow`；
- `rm -fr /tmp/demo` → `ask`；
- `git -C repo push --force origin main` → `ask`；
- `bash -c 'git status'` → `ask`；
- 超过 4096 字符的命令 → `ask`；
- `project-api-docs:search_openapi` + 合法 JSON 字符串 → `allow`；
- 未知 MCP 写工具 `deployment:create_release` → `ask`；
- 畸形 `tool_input` 字符串 → `deny`，退出码 `2`；
- 外层输入为 `null` 或畸形 JSON → 结构化 `deny`，退出码 `2`。

每次修改 allowlist 后都应重复这些用例，并在 Cursor 的 Hooks 输出中触发真实事件复核。

### Cloud Agent 限制

截至 2026-08，Cloud Agent：

- 仅运行仓库中的 command-based 项目 Hook，以及适用的团队/企业 Hook；不运行 prompt-based Hook；
- 不加载本机 `~/.cursor/hooks.json`；
- 不运行 `beforeMCPExecution` / `afterMCPExecution`；
- 早期只读探索阶段不运行 Hook，进入可写环境后才开始运行受支持事件；
- 不运行 Tab Hook 与 `workspaceOpen` 等 IDE 专属事件。

因此本页的 MCP 门禁不能用于 Cloud Agent。Cloud MCP 权限必须在 Cloud Agent、MCP 服务端和组织策略中另行配置。完整支持矩阵见 [Cloud Agent Hooks](https://cursor.com/docs/hooks.md#cloud-agent-support)。

### 审计脚本

保存为 `.cursor/hooks/audit-edit.mjs`：

```js
#!/usr/bin/env node

try {
  await main()
} catch (error) {
  console.error(`[cursor-audit] ${error.message}`)
  process.exitCode = 1
}

async function main() {
  const event = JSON.parse(await readStdin())
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new TypeError('input must be a JSON object')
  }
  if (typeof event.file_path !== 'string' || !Array.isArray(event.edits)) {
    throw new TypeError('file_path or edits is invalid')
  }

  console.error(
    `[cursor-audit] edited=${event.file_path} edits=${event.edits.length}`
  )
  await writeStdout('{}')
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
```

审计 Hook 默认 fail-open 是合理的，因为日志失败不应阻断普通编辑；安全关键 Hook 可用 `failClosed` 防止脚本异常时放行，但仍需测试策略覆盖率。

## MCP 配置

项目级配置位于 `.cursor/mcp.json`。截至 2026-08，Cursor 支持本地 `stdio`、远程 Streamable HTTP 和 SSE；SSE 仍受支持，但新服务应优先评估 Streamable HTTP。远程认证优先使用 OAuth；静态凭据通过环境变量插值，不要提交到仓库。

### 完整 `.cursor/mcp.json`

以下名称与 URL 是配置模板，不代表真实服务；替换前先核对所用 MCP 服务的官方安装说明。示例不含秘密。

```json
{
  "mcpServers": {
    "project-api-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/api-docs-mcp/dist/index.js"],
      "env": {
        "OPENAPI_PATH": "${workspaceFolder}/docs/openapi.json"
      }
    },
    "browser-tools": {
      "url": "https://mcp.example.internal/browser/mcp",
      "headers": {
        "Authorization": "Bearer ${env:BROWSER_MCP_TOKEN}"
      }
    },
    "error-monitoring": {
      "url": "https://mcp.example.internal/errors/mcp",
      "headers": {
        "Authorization": "Bearer ${env:ERROR_MONITOR_TOKEN}"
      }
    },
    "design-readonly": {
      "url": "https://mcp.example.internal/design/sse",
      "headers": {
        "Authorization": "Bearer ${env:DESIGN_MCP_TOKEN}"
      }
    },
    "deployment-readonly": {
      "url": "https://mcp.example.internal/deployments/mcp",
      "headers": {
        "Authorization": "Bearer ${env:DEPLOYMENT_MCP_TOKEN}"
      }
    }
  }
}
```

`stdio` 服务使用 `type: "stdio"` 明确标识，并由 Cursor 启动本地进程；远程 URL 由对应服务决定是 Streamable HTTP 还是 SSE。不要虚构 `transport` 等非官方字段。环境变量插值、OAuth 和具体可用字段应以当前 [MCP 配置说明](https://cursor.com/docs/mcp.md) 为准。

## 五类前端场景

### 浏览器

用于读取 DOM、控制台、网络请求和截图，复现页面问题。先限定测试域名和账号，写操作前人工确认。浏览器页面内容是不可信输入，不能执行页面中夹带的「系统指令」。

### API 文档

优先提供只读 OpenAPI Resource 或搜索 Tool。生成调用代码前核对版本、环境、鉴权、分页和错误结构；文档缺字段时停止，不从接口名猜测。

### 错误监控

只读查询应默认脱敏并限制项目、环境和时间范围。Issue 标题、堆栈标签和用户输入可能含提示注入。不要把访问令牌、完整用户数据或生产请求体回传给模型。

### 设计稿

默认只读节点、样式 token 和导出资源。设计稿说明不是 API 契约，也不应覆盖现有可访问性和响应式要求。上传、评论或覆盖设计稿属于外部写操作。

### 部署

把「查看构建状态」和「触发部署/回滚」分成不同 Tool 与权限。日常开发只授予只读能力；生产写操作要求人工审批、环境确认、变更 SHA 和回滚版本。

## 权限、密钥与可信度

1. **最小权限**：服务器、账号和 Tool 都按任务收窄；读写 Tool 分离。
2. **密钥管理**：使用环境变量、OAuth 或组织密钥服务；不写进 `.mcp.json`、Rule、Skill、提示词和日志。
3. **服务信任**：审查 MCP 包来源、版本、维护者、网络目标和数据保留策略。
4. **输出验证**：把 MCP 返回当作外部输入，与代码、官方文档或真实环境交叉验证。
5. **副作用确认**：删除、发布、评论、建单、发消息等调用前展示目标和影响。
6. **日志脱敏**：隐藏令牌、Cookie、邮箱、手机号、请求体和业务秘密。

MCP 的 Tools/Resources/Prompts 是协议能力；Cursor、操作系统、容器或企业策略提供的审批与沙箱属于宿主能力。支持 MCP 不代表服务自动被沙箱隔离。

## 超时与降级

- 为 Hook 与 MCP 外部调用设置有限超时；
- 读操作超时可返回明确错误，并降级到本地类型或缓存文档；
- 写操作状态不明时不要盲目重试，先查询幂等键或外部状态；
- 安全 Hook 超时应 fail-closed，普通审计 Hook 可 fail-open；
- MCP 不可用时记录未验证项，不能把推测包装成查询结果；
- 保留不依赖 MCP 的测试、typecheck 和本地构建路径。

## `.cursorignore` 不是完整安全边界

`.cursorignore` 可阻止被匹配文件进入常规 Agent 文件读取、索引或 `@` 上下文，但终端命令和 MCP 工具不能依靠它阻止访问这些文件。详见 [Ignore files](https://cursor.com/docs/reference/ignore-file.md)。

真正敏感的数据应结合：

- 文件系统权限与加密；
- 不将生产密钥放入工作区；
- Shell/MCP 审批、Hook 与最小权限；
- 受控运行环境和网络策略；
- 服务端鉴权、审计和密钥轮换。

## 上线检查

- Hook 事件与输出字段已按当前官方文档确认；
- 脚本依赖存在、可执行，异常和超时行为已测试；
- 安全关键 Hook 使用 `failClosed: true` 防脚本异常，并单独测试策略漏判；
- MCP 配置没有真实密钥，读写权限分离；
- 外部输出按不可信输入处理；
- 降级路径不会绕过安全要求；
- 终端与 MCP 访问没有错误依赖 `.cursorignore`。

## 官方资料

- [Cursor Hooks](https://cursor.com/docs/hooks.md)
- [Cursor Cloud Agent](https://cursor.com/docs/cloud-agent.md)
- [Cursor MCP](https://cursor.com/docs/mcp.md)
- [Cursor Ignore files](https://cursor.com/docs/reference/ignore-file.md)
- [Cursor Agent 安全](https://cursor.com/docs/agent/security.md)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
