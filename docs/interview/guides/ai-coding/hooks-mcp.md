# Cursor Hooks 与 MCP：自动化、连接与安全边界

> 版本说明：事件、字段和传输方式以 **2026-08** 为基线；实施前请核对 [Hooks](https://cursor.com/docs/hooks) 与 [MCP](https://cursor.com/docs/mcp) 官方文档。

## Rules、Skills、Hooks、MCP 的职责

- **Rules**：持续提供项目约定，回答「在这些文件里应遵循什么」。
- **Skills**：封装按需加载的专业流程、引用和脚本，回答「这类任务怎么做」。
- **Hooks**：在 Agent 事件前后执行确定性检查、阻止、审计或补充上下文。
- **MCP**：让 Agent 连接外部工具和数据源，提供 Tools、Resources 或 Prompts。

四者可以组合，但不能互相冒充。Rule 和 Skill 不是强制策略；MCP 是能力通道，不是权限边界；Hook 只有在选对事件、正确处理失败并经过真实测试后，才可能成为可靠门禁。

## Hooks 工作方式

项目配置位于 `.cursor/hooks.json`，脚本通常放在 `.cursor/hooks/`。命令 Hook 从标准输入读取 JSON，并向标准输出写 JSON：

- 退出码 `0`：执行成功，Cursor 处理其 JSON 输出；
- 退出码 `2`：明确阻止当前动作；
- 其他非零退出码：默认 fail-open，即动作继续；
- 安全关键 Hook 应设置 `failClosed: true`，使崩溃、超时或无效 JSON 阻止动作。

事件会变化。常见事件包括 `beforeShellExecution`、`beforeMCPExecution`、`afterFileEdit`、`beforeSubmitPrompt`、`preToolUse`、`postToolUse`、`sessionStart` 和 `stop`，应以实施时官方事件列表为准。

### 完整 `.cursor/hooks.json`

下面示例在 Shell 和 MCP 写操作前运行同一安全脚本，并在文件编辑后执行轻量审计。`matcher` 使用 JavaScript 风格正则表达式；复杂筛选放到脚本内部更易测试。

```json
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": "node .cursor/hooks/security-gate.mjs",
        "matcher": "rm|git push|curl|wget|deploy|publish",
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

保存为 `.cursor/hooks/security-gate.mjs`。它只展示可复制的最小策略，字段兼容逻辑集中在取值处；上线前必须用 Hooks 输出检查实际事件输入。

`beforeMCPExecution` 的输入使用顶层官方字段 `mcp_server_name`、`tool_name` 和 `tool_input`。例如：

```json
{
  "mcp_server_name": "deployment",
  "tool_name": "create_release",
  "tool_input": {
    "environment": "production"
  }
}
```

```js
#!/usr/bin/env node

let input
try {
  input = JSON.parse(await readStdin())
} catch {
  console.error('Hook 输入不是有效 JSON')
  process.exit(2)
}

const command = String(input.command ?? input.tool_input?.command ?? '')
const server = String(input.mcp_server_name ?? '')
const tool = String(input.tool_name ?? '')
const target = `${server}:${tool}`

const deniedShell = [
  /\brm\s+-rf\s+(?:\/|~|\$HOME)(?:\s|$)/i,
  /\bgit\s+push\b.*\s--force(?:-with-lease)?\b/i,
  /\b(?:curl|wget)\b.*(?:\.env|credentials|private[_-]?key)/i
]

const writeLikeMcp = /(?:delete|deploy|publish|release|write|create|update)/i

if (deniedShell.some((pattern) => pattern.test(command))) {
  process.stdout.write(JSON.stringify({
    permission: 'deny',
    user_message: '安全 Hook 阻止了高风险命令，请拆分操作并人工复核。',
    agent_message: '不要绕过 Hook；提出更小、可回滚的方案。'
  }))
  process.exit(2)
}

if (target !== ':' && writeLikeMcp.test(target)) {
  process.stdout.write(JSON.stringify({
    permission: 'ask',
    user_message: `MCP 操作 ${target} 可能写入外部系统，请确认目标与影响。`,
    agent_message: '等待用户确认，不要改用其他工具绕过审批。'
  }))
  process.exit(0)
}

process.stdout.write(JSON.stringify({ permission: 'allow' }))

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}
```

保存脚本后执行 `chmod +x .cursor/hooks/security-gate.mjs`。还应确认 `node` 在 Hook 环境的 `PATH` 中，并分别测试 allow、ask、deny、无效 JSON、超时和脚本崩溃。不要只看配置文件是否能解析。

### 审计脚本

保存为 `.cursor/hooks/audit-edit.mjs`：

```js
#!/usr/bin/env node

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => { input += chunk })
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input)
    const path = event.file_path ?? event.tool_input?.path ?? 'unknown'
    console.error(`[cursor-audit] edited=${path}`)
    process.stdout.write('{}')
  } catch {
    console.error('[cursor-audit] invalid JSON')
    process.stdout.write('{}')
  }
})
```

审计 Hook 默认 fail-open 是合理的，因为日志失败不应阻断普通编辑；真正的安全门禁则应 `failClosed`。

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

`stdio` 服务使用 `type: "stdio"` 明确标识，并由 Cursor 启动本地进程；远程 URL 由对应服务决定是 Streamable HTTP 还是 SSE。不要虚构 `transport` 等非官方字段。环境变量插值、OAuth 和具体可用字段应以当前 [MCP 配置说明](https://cursor.com/docs/mcp) 为准。

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

`.cursorignore` 可阻止被匹配文件进入常规 Agent 文件读取、索引或 `@` 上下文，但终端命令和 MCP 工具不能依靠它阻止访问这些文件。详见 [Ignore files](https://cursor.com/docs/reference/ignore-file)。

真正敏感的数据应结合：

- 文件系统权限与加密；
- 不将生产密钥放入工作区；
- Shell/MCP 审批、Hook 与最小权限；
- 受控运行环境和网络策略；
- 服务端鉴权、审计和密钥轮换。

## 上线检查

- Hook 事件与输出字段已按当前官方文档确认；
- 脚本依赖存在、可执行，异常和超时行为已测试；
- 安全门禁使用 `failClosed: true`，明确拒绝返回退出码 `2`；
- MCP 配置没有真实密钥，读写权限分离；
- 外部输出按不可信输入处理；
- 降级路径不会绕过安全要求；
- 终端与 MCP 访问没有错误依赖 `.cursorignore`。

## 官方资料

- [Cursor Hooks](https://cursor.com/docs/hooks)
- [Cursor MCP](https://cursor.com/docs/mcp)
- [Cursor Ignore files](https://cursor.com/docs/reference/ignore-file)
- [Cursor Agent 安全](https://cursor.com/docs/agent/security)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)

