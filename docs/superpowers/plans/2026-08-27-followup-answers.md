# 题库追问答案补全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 14 个题库中的全部追问补充标准参考答案，并建立可自动阻止漏答、错位和空答案的发布门禁。

**Architecture:** 先扩展题库校验器，使其能够按单文件增量检查追问答案；再按模块逐文件补齐内容，每个文件独立进行规格审查和技术审查；最后启用全量追问门禁，更新 CI 并部署 GitHub Pages。追问答案统一放在主问题后的单个 `::: details 追问参考答案` 折叠区中。

**Tech Stack:** Node.js ESM、Markdown、VitePress、pnpm、GitHub Actions。

---

## 文件与职责

- `scripts/validate-question-bank.mjs`：解析追问、校验问答数量和输出追问统计。
- `scripts/validate-question-bank.test.mjs`：覆盖追问解析、折叠区、错位、占位和代码块边界。
- `package.json`：增加追问专项校验命令。
- `.github/workflows/deploy-docs.yml`：在发布前执行全量追问门禁。
- `docs/interview/questions/01-js-ts.md`～`14-frontend-architecture.md`：逐模块补充追问答案。
- `README.md`：记录追问专项校验命令。

当前追问标记共 302 处：

- `01-js-ts.md`：18 处
- `02-vue3.md`：31 处
- `03-engineering.md`：20 处
- `04-admin-antdv.md`：14 处
- `05-h5-vant.md`：12 处
- `06-uniapp-miniprogram.md`：17 处
- `07-java-fullstack.md`：20 处
- `08-architecture-lead.md`：26 处
- `09-ai-vibe-coding.md`：15 处
- `10-handwriting.md`：16 处
- `11-frontend-system-design.md`：13 处
- `12-microfrontend.md`：34 处
- `13-nestjs.md`：36 处
- `14-frontend-architecture.md`：30 处

---

### Task 1：建立追问答案自动校验

**Files:**
- Modify: `scripts/validate-question-bank.mjs`
- Modify: `scripts/validate-question-bank.test.mjs`
- Modify: `package.json`

- [ ] **Step 1：为追问解析编写失败测试**

在 `scripts/validate-question-bank.test.mjs` 中导入即将新增的函数：

```js
import {
  extractFollowupAnswerDetails,
  findFollowupSection,
  validateFollowupSection,
} from './validate-question-bank.mjs'
```

新增测试夹具，覆盖：

```js
const singleFollowup = `### Q1. 示例

::: details 参考答案
主答案
:::

**追问：** 单个追问如何回答？

::: details 追问参考答案

单个追问的完整答案，包含结论、依据和适用边界。

:::
`

const followupChain = `### D1. 示例

::: details 参考答案
主答案
:::

**追问链：**
1. 第一个追问？
2. 第二个追问？

::: details 追问参考答案

**1. 第一个追问？**

第一个追问的完整答案。

**2. 第二个追问？**

第二个追问的完整答案。

:::
`
```

断言以下行为：

```js
assert.equal(findFollowupSection(singleFollowup).questions.length, 1)
assert.equal(validateFollowupSection(singleFollowup).failures.length, 0)
assert.equal(findFollowupSection(followupChain).questions.length, 2)
assert.equal(validateFollowupSection(followupChain).failures.length, 0)
```

再增加缺少折叠区、未闭合、问答数量不一致、编号错位、文本错位、空答案、占位文案、少于 40 个有效字符、代码块伪追问等失败用例。

- [ ] **Step 2：运行测试并确认失败**

Run:

```bash
pnpm docs:validate:test
```

Expected：FAIL，提示新增函数未导出或不存在。

- [ ] **Step 3：实现追问解析和校验**

在 `scripts/validate-question-bank.mjs` 中增加：

```js
const FOLLOWUP_MARKER_PATTERN = /^\*\*追问(链)?[：:]\*\*(.*)$/
const FOLLOWUP_DETAILS_MARKER = '::: details 追问参考答案'
const MIN_FOLLOWUP_ANSWER_LENGTH = 40

export function findFollowupSection(block) {
  const lines = block.split('\n')
  let inFence = false
  let fenceChar = ''
  let fenceLen = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fenceMatch = line.match(/^(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1]
      if (!inFence) {
        inFence = true
        fenceChar = marker[0]
        fenceLen = marker.length
      } else if (marker[0] === fenceChar && marker.length >= fenceLen) {
        inFence = false
      }
      continue
    }
    if (inFence) continue

    const markerMatch = line.match(FOLLOWUP_MARKER_PATTERN)
    if (!markerMatch) continue

    const isChain = Boolean(markerMatch[1])
    const questions = []
    if (!isChain) {
      let text = markerMatch[2].trim()
      if (!text) {
        const next = lines
          .slice(index + 1)
          .find((candidate) => candidate.trim() && !candidate.trim().startsWith(':::'))
        text = next?.trim() ?? ''
      }
      if (text) questions.push({ number: 1, text })
    } else {
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const candidate = lines[cursor].trim()
        if (candidate === FOLLOWUP_DETAILS_MARKER) break
        if (!candidate) continue
        const questionMatch = candidate.match(/^(\d+)\.\s+(.+)$/)
        if (!questionMatch) break
        questions.push({
          number: Number(questionMatch[1]),
          text: questionMatch[2].trim(),
        })
      }
    }

    return {
      found: true,
      kind: isChain ? 'chain' : 'single',
      questions,
      markerLine: index + 1,
    }
  }

  return { found: false, kind: null, questions: [], markerLine: -1 }
}

export function extractFollowupAnswerDetails(block) {
  return extractNamedDetails(block, FOLLOWUP_DETAILS_MARKER)
}

export function validateFollowupSection(block) {
  const section = findFollowupSection(block)
  if (!section.found) {
    return { failures: [], questionCount: 0, answerCount: 0 }
  }

  const failures = []
  if (section.questions.length === 0) {
    failures.push('追问标记后没有有效问题')
  }

  const details = extractFollowupAnswerDetails(block)
  if (!details.found) {
    failures.push('缺少追问参考答案')
    return {
      failures,
      questionCount: section.questions.length,
      answerCount: 0,
    }
  }
  if (!details.closed) {
    failures.push('追问参考答案容器未闭合')
    return {
      failures,
      questionCount: section.questions.length,
      answerCount: 0,
    }
  }

  const content = details.content ?? ''
  if (findPlaceholders(content).length > 0) {
    failures.push('追问参考答案含占位文案')
  }

  const answers = []
  if (section.kind === 'single') {
    answers.push({
      number: 1,
      text: section.questions[0]?.text ?? '',
      content,
    })
  } else {
    const headingPattern = /^\*\*(\d+)\.\s+(.+?)\*\*\s*$/gm
    const headings = [...content.matchAll(headingPattern)]
    for (let index = 0; index < headings.length; index += 1) {
      const start = headings[index].index + headings[index][0].length
      const end = headings[index + 1]?.index ?? content.length
      answers.push({
        number: Number(headings[index][1]),
        text: headings[index][2].trim(),
        content: content.slice(start, end).trim(),
      })
    }
  }

  if (answers.length !== section.questions.length) {
    failures.push(
      `追问数量 ${section.questions.length} 与答案数量 ${answers.length} 不一致`,
    )
  }

  for (let index = 0; index < Math.min(answers.length, section.questions.length); index += 1) {
    const question = section.questions[index]
    const answer = answers[index]
    if (question.number !== answer.number) {
      failures.push(`第 ${index + 1} 个追问编号与答案编号不一致`)
    }
    if (question.text !== answer.text) {
      failures.push(`第 ${index + 1} 个追问文本与答案标题不一致`)
    }
    const effectiveLength = answer.content
      .replace(/[#>*`\-|\s]/g, '')
      .length
    if (effectiveLength < MIN_FOLLOWUP_ANSWER_LENGTH) {
      failures.push(`第 ${index + 1} 个追问答案少于 ${MIN_FOLLOWUP_ANSWER_LENGTH} 个有效字符`)
    }
  }

  return {
    failures,
    questionCount: section.questions.length,
    answerCount: answers.length,
  }
}
```

将 details 解析公共逻辑抽成接收 marker 的函数，现有 `extractAnswerDetails()` 保持兼容：

```js
export function extractNamedDetails(block, marker) {
  const lines = block.split('\n')
  const startLine = lines.findIndex((line) => line.trim() === marker)
  if (startLine === -1) return { found: false }

  const contentLines = []
  let depth = 1
  for (let index = startLine + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()
    if (trimmed.startsWith(':::')) {
      const info = trimmed.slice(3).trim()
      if (!info) {
        depth -= 1
        if (depth === 0) {
          return {
            found: true,
            closed: true,
            content: contentLines.join('\n').trim(),
          }
        }
        continue
      }
      depth += 1
    }
    contentLines.push(line)
  }

  return {
    found: true,
    closed: false,
    content: contentLines.join('\n').trim(),
  }
}

export function extractAnswerDetails(block) {
  return extractNamedDetails(block, DETAILS_MARKER)
}
```

为 `validateQuestionBank()` 增加选项：

```js
{
  requireFollowups?: boolean,
  followupFiles?: string[] | null,
}
```

规则：

- `requireFollowups: false` 时保持原校验行为。
- `requireFollowups: true` 时校验全部预期题库。
- 同时提供 `followupFiles` 时只校验指定文件，文件名必须属于 `EXPECTED_QUESTION_FILES`。
- `fileStats` 追加 `followups=<问题数> answered=<已回答数>`。

- [ ] **Step 4：增加跨平台 CLI 参数**

支持：

```bash
node scripts/validate-question-bank.mjs --require-followups
node scripts/validate-question-bank.mjs --require-followups --followup-files=01-js-ts.md,02-vue3.md
```

使用以下解析函数，并将结果传入 `validateQuestionBank()`：

```js
export function parseFollowupArgs(argv = process.argv.slice(2)) {
  const requireFollowups = argv.includes('--require-followups')
  const fileArg = argv.find((arg) => arg.startsWith('--followup-files='))
  const followupFiles = fileArg
    ? fileArg
        .slice('--followup-files='.length)
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean)
    : null

  if (followupFiles && !requireFollowups) {
    throw new Error('--followup-files 必须与 --require-followups 同时使用')
  }
  const invalidFiles = (followupFiles ?? []).filter(
    (file) => !EXPECTED_QUESTION_FILES.includes(file),
  )
  if (invalidFiles.length > 0) {
    throw new Error(`未知题库文件：${invalidFiles.join('、')}`)
  }

  return { requireFollowups, followupFiles }
}
```

在 `main()` 中读取：

```js
const { requireFollowups, followupFiles } = parseFollowupArgs()
const result = await validateQuestionBank({
  min,
  max,
  expected,
  requireFollowups,
  followupFiles,
})
```

- [ ] **Step 5：增加 package scripts**

在 `package.json` 中加入：

```json
{
  "docs:validate:followups": "node scripts/validate-question-bank.mjs --require-followups",
  "docs:check:followups": "pnpm docs:validate:followups && pnpm docs:build"
}
```

- [ ] **Step 6：运行边界测试**

Run:

```bash
pnpm docs:validate:test
```

Expected：全部测试通过。

- [ ] **Step 7：确认当前题库被专项门禁拒绝**

Run:

```bash
pnpm docs:validate:followups
```

Expected：exit 1，输出 14 个文件的缺失追问答案；主问题总量仍为 382。

- [ ] **Step 8：提交**

```bash
git add scripts/validate-question-bank.mjs scripts/validate-question-bank.test.mjs package.json
git commit -m "test: 添加题库追问答案校验"
```

---

### Task 2：补齐 JavaScript / TypeScript 追问答案

**Files:**
- Modify: `docs/interview/questions/01-js-ts.md`

- [ ] **Step 1：补齐 18 处追问标记**

每道题在原追问后增加一个 `::: details 追问参考答案`。重点核对：

- V8 隐藏类和内联缓存属于实现细节，不写成 ECMAScript 规范。
- Event Loop 区分浏览器任务、微任务、渲染机会和 Node.js 阶段。
- Promise / async 错误传播、取消语义和结构化并发边界。
- TypeScript 方差、条件类型和不健全性。
- ESM live binding、循环依赖和 Tree-shaking。
- WeakRef、FinalizationRegistry、Worker 和大数据内存成本。

每个追问答案约 100～200 字，首句直接结论，后续给依据和工程边界。

- [ ] **Step 2：执行单文件追问校验**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=01-js-ts.md
```

Expected：`01-js-ts.md` 的 `followups` 与 `answered` 相等，exit 0。

- [ ] **Step 3：构建并提交**

```bash
pnpm docs:build
git add docs/interview/questions/01-js-ts.md
git commit -m "docs: 补充 JS TS 题库追问答案"
```

---

### Task 3：补齐 Vue3 追问答案

**Files:**
- Modify: `docs/interview/questions/02-vue3.md`

- [ ] **Step 1：补齐 31 处追问标记**

开始前读取 Vue 官方文档和 Vue 技能 references。重点核对：

- `track` / `trigger`、effect 调度、computed 和 watch flush。
- block tree、patch flag、静态提升和 keyed diff。
- Suspense 的实验性状态、错误处理和 async component 边界。
- SSR 水合、Pinia 跨请求隔离和组合式函数生命周期。
- 微前端 mount / unmount 状态机和组件树外副作用。

- [ ] **Step 2：执行单文件校验和构建**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=02-vue3.md
pnpm docs:build
```

Expected：追问全部回答，构建 exit 0。

- [ ] **Step 3：提交**

```bash
git add docs/interview/questions/02-vue3.md
git commit -m "docs: 补充 Vue3 题库追问答案"
```

---

### Task 4：补齐工程化追问答案

**Files:**
- Modify: `docs/interview/questions/03-engineering.md`

- [ ] **Step 1：补齐 20 处追问标记**

重点核对：

- Vite 2–7 与 Vite 8 的 esbuild、Rollup、Rolldown、Oxc 版本矩阵。
- Vite 8 `codeSplitting`，不重新引入已弃用的 `advancedChunks`。
- HMR、虚拟模块、长期缓存和 Source Map 安全。
- CI 任务图、远程缓存投毒、供应链和发布回滚。
- 控制面切换时间与客户端恢复分位数。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=03-engineering.md
pnpm docs:build
git add docs/interview/questions/03-engineering.md
git commit -m "docs: 补充工程化题库追问答案"
```

---

### Task 5：补齐 Ant Design Vue 后台追问答案

**Files:**
- Modify: `docs/interview/questions/04-admin-antdv.md`

- [ ] **Step 1：补齐 14 处追问标记**

重点核对：

- 标准 `a-table` 滚动与第三方 / 自研虚拟表格的差异。
- Ant Design Vue 4.x Design Token、`ConfigProvider`、`<a-app>` 和 hooks 上下文。
- Schema 表单的安全边界和动态联动。
- 前端能力快照与服务端权威授权。
- 导入导出、审计、字典缓存和可访问性降级。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=04-admin-antdv.md
pnpm docs:build
git add docs/interview/questions/04-admin-antdv.md
git commit -m "docs: 补充后台题库追问答案"
```

---

### Task 6：补齐 Vant H5 追问答案

**Files:**
- Modify: `docs/interview/questions/05-h5-vant.md`

- [ ] **Step 1：补齐 12 处追问标记**

重点核对：

- viewport、安全区、软键盘、滚动锁定和焦点管理。
- WebView Bridge 的来源校验、版本协商、超时和降级。
- 弱网、离线队列、敏感数据和退出登录清理。
- LCP、INP、CLS 的 P75 口径。
- EventSource 原生重连与自定义 Fetch 流式重试。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=05-h5-vant.md
pnpm docs:build
git add docs/interview/questions/05-h5-vant.md
git commit -m "docs: 补充 H5 题库追问答案"
```

---

### Task 7：补齐 uni-app / 微信小程序追问答案

**Files:**
- Modify: `docs/interview/questions/06-uniapp-miniprogram.md`

- [ ] **Step 1：补齐 17 处追问标记**

重点核对：

- 逻辑层 / 渲染层通信和 `setData` 成本。
- 主包、分包、独立分包、预下载和基础库版本。
- uni-app 编译目标与微信原生机制不能互相泛化。
- 登录态、手机号动态令牌、隐私授权、支付通知和查单。
- `web-view` 的 `postMessage` 不是实时 RPC。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=06-uniapp-miniprogram.md
pnpm docs:build
git add docs/interview/questions/06-uniapp-miniprogram.md
git commit -m "docs: 补充小程序题库追问答案"
```

---

### Task 8：补齐 Java 全栈偏前追问答案

**Files:**
- Modify: `docs/interview/questions/07-java-fullstack.md`

- [ ] **Step 1：补齐 20 处追问标记**

重点核对：

- Spring 默认代理事务、自调用、回滚规则和 AspectJ 例外。
- MyBatis-Plus 分页拦截器及 3.5.9+ 依赖边界。
- JWT issuer / audience、刷新轮换和服务端授权。
- Redis 缓存一致性、`SET NX EX <seconds>` 和限流差异。
- MQ 至少一次假设、幂等、Outbox 和最终一致性。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=07-java-fullstack.md
pnpm docs:build
git add docs/interview/questions/07-java-fullstack.md
git commit -m "docs: 补充 Java 全栈题库追问答案"
```

---

### Task 9：补齐 AI / vibe coding 追问答案

**Files:**
- Modify: `docs/interview/questions/09-ai-vibe-coding.md`

- [ ] **Step 1：补齐 15 处追问标记**

重点核对：

- 上下文工程、任务拆解、模型选择和独立审查。
- Rules、Skills、Hooks、MCP 的职责边界。
- MCP OAuth 与宿主沙箱能力不能混淆。
- Prompt Injection、敏感信息、供应链和最小权限。
- AI 生成 Vue / Java 代码的验证和失败恢复。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=09-ai-vibe-coding.md
pnpm docs:build
git add docs/interview/questions/09-ai-vibe-coding.md
git commit -m "docs: 补充 AI 编程题库追问答案"
```

---

### Task 10：补齐手写题追问答案

**Files:**
- Modify: `docs/interview/questions/10-handwriting.md`

- [ ] **Step 1：补齐 16 处追问标记**

每个答案必须说明实现策略、时间 / 空间复杂度、异常边界和测试方法。重点复核：

- throttle 尾调用参数与引用释放。
- `call` / `bind` / `instanceof` 的教学近似和规范边界。
- 虚拟列表 overscroll、数据骤减和非法参数。
- 并发池 fail-fast、取消、重试和假值异常。
- 权限树、请求去重缓存和 TypeScript 类型工具。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=10-handwriting.md
pnpm docs:build
git add docs/interview/questions/10-handwriting.md
git commit -m "docs: 补充手写题追问答案"
```

---

### Task 11：补齐 NestJS 追问答案

**Files:**
- Modify: `docs/interview/questions/13-nestjs.md`

- [ ] **Step 1：补齐 36 处追问标记**

核对 NestJS 11.x 和 Node.js 20+ 基线。重点覆盖：

- Module / Provider / token / scope 和动态模块。
- Middleware → Guard → Interceptor 入站 → Pipe → Controller / Provider → Interceptor 出站 → Filter。
- RxJS timeout 不保证取消底层副作用。
- JWT、Cookie refresh、CSRF、RBAC / ABAC。
- TypeORM / Prisma、连接池、事务、N+1。
- `send()` cold Observable、`emit()` hot Observable 和传输层差异。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=13-nestjs.md
pnpm docs:build
git add docs/interview/questions/13-nestjs.md
git commit -m "docs: 补充 NestJS 题库追问答案"
```

---

### Task 12：补齐架构 / Lead 追问答案

**Files:**
- Modify: `docs/interview/questions/08-architecture-lead.md`

- [ ] **Step 1：补齐 26 处追问标记**

答案聚焦负责人如何组织决策和承担结果，不退化成纯技术方案。重点覆盖：

- 招聘、培养、反馈和团队扩张。
- 技术债预算、路线沟通和跨团队冲突。
- 事故指挥、止损、复盘和机制改进。
- BFF 生产 Owner、SLO、容量和 on-call。
- 指标基线、观察窗口、归因和不利影响。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=08-architecture-lead.md
pnpm docs:build
git add docs/interview/questions/08-architecture-lead.md
git commit -m "docs: 补充 Lead 题库追问答案"
```

---

### Task 13：补齐前端系统设计追问答案

**Files:**
- Modify: `docs/interview/questions/11-frontend-system-design.md`

- [ ] **Step 1：补齐 13 处追问标记**

每个答案应落到具体系统的数据流、容量、安全、故障、发布、观测和 Owner。重点覆盖：

- 应用壳、微前端平台和签名清单。
- 统一权限中心的资源—动作语义。
- 前端监控的数据最小化、HMAC 和体验 SLI。
- 配置化平台、跨端体系和 BFF。
- 多租户身份传播、缓存隔离、限流与高可用。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=11-frontend-system-design.md
pnpm docs:build
git add docs/interview/questions/11-frontend-system-design.md
git commit -m "docs: 补充系统设计题库追问答案"
```

---

### Task 14：补齐微前端追问答案

**Files:**
- Modify: `docs/interview/questions/12-microfrontend.md`

- [ ] **Step 1：补齐 34 处追问标记**

开始前核对 qiankun、Garfish、Module Federation 和 Wujie 官方文档。重点覆盖：

- qiankun 生命周期、沙箱、样式、路由和卸载泄漏。
- Garfish `hide` / `unmount`、执行上下文和预加载。
- MF 2.0、remote alias、share scope、manifest、类型和失败降级。
- Wujie iframe + Web Component、保活、通信和同域安全边界。
- CSP、首屏瀑布、缓存、灰度、旧资产保留和四方案选型。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=12-microfrontend.md
pnpm docs:build
git add docs/interview/questions/12-microfrontend.md
git commit -m "docs: 补充微前端题库追问答案"
```

---

### Task 15：补齐前端架构追问答案

**Files:**
- Modify: `docs/interview/questions/14-frontend-architecture.md`

- [ ] **Step 1：补齐 30 处追问标记**

保持模块边界：

- 本文件回答架构原则、依赖方向、质量属性和治理机制。
- `08` 回答负责人如何推动和承担结果。
- `11` 回答具体系统的端到端设计。

重点覆盖质量属性、领域边界、数据流、错误模型、权限、设计系统、可观测性、安全、Monorepo、发布治理、ADR 和技术债。

- [ ] **Step 2：验证并提交**

```bash
node scripts/validate-question-bank.mjs --require-followups --followup-files=14-frontend-architecture.md
pnpm docs:build
git add docs/interview/questions/14-frontend-architecture.md
git commit -m "docs: 补充前端架构题库追问答案"
```

---

### Task 16：启用全量门禁、终审并发布

**Files:**
- Modify: `.github/workflows/deploy-docs.yml`
- Modify: `README.md`
- Modify: 所有终审发现问题的题库文件

- [ ] **Step 1：执行全量追问门禁**

```bash
pnpm docs:validate:followups
```

Expected：

- 14 个文件全部输出追问统计。
- 每个文件 `followups` 与 `answered` 相等。
- 主问题仍为 382。
- failures 为 0。

- [ ] **Step 2：抽检答案长度和重复度**

每个模块至少抽检 20%，检查：

- 直接回应追问；
- 约 100～200 字；
- 未复制主答案；
- 技术事实和版本准确；
- 有工程场景或边界；
- 相邻答案没有同质化套话。

- [ ] **Step 3：更新 CI 发布门禁**

在 `.github/workflows/deploy-docs.yml` 的 Build 步骤使用：

```yaml
- name: Test question bank validator
  run: pnpm docs:validate:test

- name: Build
  run: >
    MIN_TOTAL_QUESTIONS=380
    MAX_TOTAL_QUESTIONS=410
    EXPECTED_TOTAL_QUESTIONS=382
    pnpm docs:check:followups
```

- [ ] **Step 4：更新 README**

增加：

```bash
pnpm docs:validate:followups
pnpm docs:check:followups
```

说明两个命令分别用于追问完整性检查和发布前全量检查。

- [ ] **Step 5：执行最终验证**

```bash
pnpm docs:validate:test
MIN_TOTAL_QUESTIONS=380 MAX_TOTAL_QUESTIONS=410 EXPECTED_TOTAL_QUESTIONS=382 pnpm docs:check:followups
git diff --check master...HEAD
```

Expected：全部 exit 0，无死链、空答案、占位文案或格式错误。

- [ ] **Step 6：全分支独立审查**

审查 `master...HEAD`，重点检查：

- 302 处追问标记是否全部有答案折叠区；
- 追问链问题和答案是否逐项对应；
- 14 个模块的技术口径是否一致；
- 页面体积和搜索索引是否仍可接受；
- CI 是否真正阻止漏答。

修复所有 Critical 和 Important 后重新执行 Step 5。

- [ ] **Step 7：提交终审修正**

若有修正：

```bash
git add .github/workflows/deploy-docs.yml README.md docs/interview/questions scripts package.json
git commit -m "docs: 完成题库追问答案全量验收"
```

若没有修正，不创建空提交。

- [ ] **Step 8：合并、推送和线上抽查**

```bash
git merge --ff-only feature/followup-answers
git push origin master
```

等待 GitHub Pages 工作流成功后，抽查：

- 首页；
- Vue3；
- 微前端；
- NestJS；
- 前端架构；
- 手写题。

确认折叠区可展开、追问和答案顺序正确。

