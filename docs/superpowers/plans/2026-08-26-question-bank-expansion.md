# 面试题库深度扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 201 题扩展为 380–410 题，新增微前端、NestJS、前端架构题库，补充 Cursor 前端 AI 编程实践和资深前端简历套件，并统一升级内容深度。

**Architecture:** 继续使用 VitePress Markdown 作为内容源，新增 3 个独立题库文件，并重构侧边栏的能力域分组。新增 Node.js 内容校验脚本，自动核对题目、答案、深层题结构、占位文本和总题量；冲刺计划和模拟面试通过站内链接引用题库，不复制大段答案。

**Tech Stack:** VitePress 1.x、Vue 3、TypeScript、Node.js ESM、pnpm、GitHub Actions / GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-08-26-question-bank-expansion-design.md`

---

## 文件结构

### 新建

- `docs/interview/questions/12-microfrontend.md`：qiankun、Garfish、Module Federation、Wujie。
- `docs/interview/questions/13-nestjs.md`：NestJS 基础、工程实践、高级主题。
- `docs/interview/questions/14-frontend-architecture.md`：前端技术架构与治理。
- `docs/interview/guides/ai-coding/cursor-workflow.md`：Cursor 前端开发工作流。
- `docs/interview/guides/ai-coding/rules.md`：Vue 前端 Rules 设计与示例。
- `docs/interview/guides/ai-coding/skills.md`：前端 Skills 设计与示例。
- `docs/interview/guides/ai-coding/hooks-mcp.md`：Hooks、MCP 与安全边界。
- `docs/interview/guides/ai-coding/vue-project-example.md`：完整 Vue 项目实践。
- `docs/interview/resume/senior-frontend-guide.md`：资深前端简历写作指南。
- `docs/interview/resume/senior-frontend-template.md`：可复制 Markdown 模板。
- `docs/interview/resume/senior-frontend-example.md`：可替换数据的完整示例。
- `docs/interview/resume/project-rewrite-checklist.md`：项目经历改写清单。
- `docs/interview/resume/ats-checklist.md`：ATS 和投递前检查。
- `scripts/validate-question-bank.mjs`：题量与内容结构校验。

### 修改

- `docs/.vitepress/config.ts`：题库按能力域分组，并加入新题库、AI 实践和简历入口。
- `package.json`：新增 `docs:validate` 与组合校验脚本。
- `docs/index.md`、`docs/interview/00-overview.md`：更新题量、模块和阅读路径。
- `docs/interview/questions/01-js-ts.md` 至 `11-frontend-system-design.md`：扩容和深度升级。
- `docs/interview/plans/7-day.md`、`14-day.md`、`30-day.md`：加入新增模块。
- `docs/interview/mocks/scripts.md`、`scorecard.md`：加入 3 套专项面试与架构评分维度。
- `README.md`：更新模块目录和校验命令。

---

### Task 1：建立题库自动校验

**Files:**
- Create: `scripts/validate-question-bank.mjs`
- Modify: `package.json`

- [ ] **Step 1：写入校验脚本**

脚本必须：

1. 扫描 `docs/interview/questions/*.md`。
2. 使用 `^### ([QD]\\d+)\\.` 统计普通题与深层题。
3. 按下一个三级标题切分题目区块。
4. 每个题目区块必须包含 `::: details 参考答案`。
5. `D` 题必须包含：`基础结论`、`原理深挖`、`工程场景`、`反例 / 踩坑`、`资深回答模板`、`追问链`。
6. 检查空答案与占位文案。
7. 支持环境变量：
   - `MIN_TOTAL_QUESTIONS`：默认 `201`，最终验收设为 `380`。
   - `MAX_TOTAL_QUESTIONS`：默认 `410`。
8. 输出每个文件的 Q / D / 合计和全站总量。
9. 任一校验失败时设置 `process.exitCode = 1`。

核心结构：

```js
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const QUESTION_DIR = path.resolve('docs/interview/questions')
const MIN_TOTAL = Number(process.env.MIN_TOTAL_QUESTIONS ?? 201)
const MAX_TOTAL = Number(process.env.MAX_TOTAL_QUESTIONS ?? 410)
const DEEP_SECTIONS = [
  '基础结论',
  '原理深挖',
  '工程场景',
  '反例 / 踩坑',
  '资深回答模板',
  '追问链',
]

const files = (await readdir(QUESTION_DIR))
  .filter((file) => /^\d{2}-.+\.md$/.test(file))
  .sort()

const failures = []
let total = 0

for (const file of files) {
  const content = await readFile(path.join(QUESTION_DIR, file), 'utf8')
  const matches = [...content.matchAll(/^### ([QD]\d+)\.\s+.+$/gm)]
  let normal = 0
  let deep = 0

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const start = match.index
    const end = matches[index + 1]?.index ?? content.length
    const block = content.slice(start, end)
    const id = match[1]

    if (!block.includes('::: details 参考答案')) {
      failures.push(`${file} ${id} 缺少参考答案`)
    }

    if (id.startsWith('D')) {
      deep += 1
      for (const section of DEEP_SECTIONS) {
        if (!block.includes(section)) {
          failures.push(`${file} ${id} 缺少「${section}」`)
        }
      }
    } else {
      normal += 1
    }
  }

  total += normal + deep
  console.log(`${file}: Q=${normal} D=${deep} total=${normal + deep}`)
}

if (total < MIN_TOTAL || total > MAX_TOTAL) {
  failures.push(`总题量 ${total} 不在 ${MIN_TOTAL}–${MAX_TOTAL} 范围`)
}

console.log(`题库总量：${total}`)

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
}
```

- [ ] **Step 2：在 `package.json` 注册脚本**

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "docs:validate": "node scripts/validate-question-bank.mjs",
    "docs:check": "pnpm docs:validate && pnpm docs:build"
  }
}
```

- [ ] **Step 3：验证当前基线**

Run:

```bash
pnpm docs:validate
```

Expected：输出 11 个题库和总量 `201`，exit 0。

- [ ] **Step 4：提交**

```bash
git add package.json scripts/validate-question-bank.mjs
git commit -m "test: 添加题库内容结构校验"
```

---

### Task 2：扩展导航并建立新题库骨架

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Create: `docs/interview/questions/12-microfrontend.md`
- Create: `docs/interview/questions/13-nestjs.md`
- Create: `docs/interview/questions/14-frontend-architecture.md`

- [ ] **Step 1：重构侧边栏题库分组**

将当前单一「题库」组替换为：

```ts
{
  text: '前端基础',
  items: [
    { text: 'JS / TS', link: '/interview/questions/01-js-ts' },
    { text: 'Vue3', link: '/interview/questions/02-vue3' },
    { text: '手写题', link: '/interview/questions/10-handwriting' },
  ],
},
{
  text: '工程与架构',
  items: [
    { text: '工程化', link: '/interview/questions/03-engineering' },
    { text: '前端架构', link: '/interview/questions/14-frontend-architecture' },
    { text: '前端系统设计', link: '/interview/questions/11-frontend-system-design' },
    { text: '微前端', link: '/interview/questions/12-microfrontend' },
  ],
},
{
  text: '业务与多端',
  items: [
    { text: 'Ant Design Vue', link: '/interview/questions/04-admin-antdv' },
    { text: 'Vant H5', link: '/interview/questions/05-h5-vant' },
    { text: 'uni-app / 小程序', link: '/interview/questions/06-uniapp-miniprogram' },
  ],
},
{
  text: '全栈与 AI',
  items: [
    { text: 'Java 全栈偏前', link: '/interview/questions/07-java-fullstack' },
    { text: 'NestJS', link: '/interview/questions/13-nestjs' },
    { text: 'AI / vibe coding', link: '/interview/questions/09-ai-vibe-coding' },
  ],
},
{
  text: 'Lead',
  items: [
    { text: '架构 / Lead', link: '/interview/questions/08-architecture-lead' },
  ],
},
```

- [ ] **Step 2：建立 3 个题库标题、定位和目录**

每个文件先只写：

- 一级标题。
- 适合岗位和使用方法。
- 普通题 / 深层题数量目标。
- 章节目录。

此步骤不写空题目，确保校验脚本不会把骨架误判为题目。

- [ ] **Step 3：构建验证**

Run:

```bash
pnpm docs:build
```

Expected：新增路由构建成功，exit 0。

- [ ] **Step 4：提交**

```bash
git add docs/.vitepress/config.ts docs/interview/questions/12-microfrontend.md docs/interview/questions/13-nestjs.md docs/interview/questions/14-frontend-architecture.md
git commit -m "docs: 建立新增题库与能力域导航"
```

---

### Task 3：完成微前端题库

**Files:**
- Modify: `docs/interview/questions/12-microfrontend.md`

- [ ] **Step 1：核对官方资料**

撰写前核对 qiankun、Garfish、Wujie 和 Module Federation 官方文档。Module Federation 必须区分 MF 2.0 与 Webpack 5 内置版本，并覆盖：

- `exposes`、`remotes`、`shared`、`singleton`。
- 运行时加载、版本协商、类型提示、加载失败。
- Vue 应用集成与跨框架边界。

- [ ] **Step 2：编写 18–21 道普通题**

题目矩阵：

- 微前端定义、收益、成本、适用 / 不适用场景。
- 业务、团队、领域、路由、发布边界如何决定拆分。
- qiankun 生命周期、沙箱、样式隔离、通信、路由、预加载。
- Garfish 加载、沙箱、预加载、子应用管理及与 qiankun 的差异。
- Module Federation host / remote、依赖共享、版本和部署。
- Wujie 隔离、保活、通信、iframe 限制。
- 四种方案选型。
- 跨应用通信、状态治理、权限、监控、灰度和回滚。

- [ ] **Step 3：编写 14–16 道深层题**

深层主题：

- Proxy / 快照沙箱原理与逃逸风险。
- CSS 隔离策略及 Shadow DOM / scoped / 约定式命名取舍。
- 路由冲突、URL 同步和浏览器前进后退。
- shared 版本协商、singleton 风险和重复依赖。
- remoteEntry / manifest 加载失败与降级。
- 微前端首屏瀑布、预加载和缓存。
- 子应用内存泄漏与销毁不彻底。
- 跨应用可观测性和 traceId。
- 多团队发布契约与兼容性。
- 从巨石前端渐进迁移。
- 四方案在大型 Vue 管理后台中的选型答辩。

- [ ] **Step 4：校验**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

Expected：`12-microfrontend.md` 为 32–35 题，其中 D 为 14–16；构建成功。

- [ ] **Step 5：提交**

```bash
git add docs/interview/questions/12-microfrontend.md
git commit -m "docs: 新增微前端深度面试题库"
```

---

### Task 4：完成 NestJS 题库

**Files:**
- Modify: `docs/interview/questions/13-nestjs.md`

- [ ] **Step 1：编写 20–23 道普通题**

覆盖：

- Module、Controller、Provider、DI、模块可见性。
- Middleware、Pipe、Guard、Interceptor、Filter 执行链。
- DTO、Validation、序列化、Swagger、API 版本。
- JWT、刷新令牌、RBAC / ABAC。
- TypeORM / Prisma、分页、事务、N+1。
- Redis、队列、定时任务、文件上传。
- 配置、日志、测试、部署和优雅停机。
- Vue 与 NestJS 的接口契约、鉴权和联调。

- [ ] **Step 2：编写 15–18 道深层题**

覆盖：

- Decorator、Metadata、Reflector。
- Nest 容器扫描、Provider 实例化和 Scope。
- 请求生命周期和各增强器顺序。
- 动态模块、异步配置和循环依赖。
- 数据库事务边界、并发和幂等。
- Guard 与业务授权的边界。
- Interceptor 的 RxJS 流和异常传播。
- E2E 测试隔离、数据库清理和外部依赖替身。
- 高并发、事件循环阻塞、Worker / Queue 选择。
- CQRS、事件驱动、模块化单体与微服务取舍。
- OpenTelemetry、结构化日志、健康检查。
- 安全：注入、越权、限流、文件上传。
- AI 生成 NestJS 代码的审查清单。

- [ ] **Step 3：校验**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

Expected：`13-nestjs.md` 为 35–38 题，其中 D 为 15–18；构建成功。

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/13-nestjs.md
git commit -m "docs: 新增 NestJS 深度面试题库"
```

---

### Task 5：新增前端架构并重构架构边界

**Files:**
- Modify: `docs/interview/questions/14-frontend-architecture.md`
- Modify: `docs/interview/questions/08-architecture-lead.md`
- Modify: `docs/interview/questions/11-frontend-system-design.md`

- [ ] **Step 1：完成前端架构普通题 14–16 道**

覆盖质量属性、分层、领域边界、依赖方向、状态与数据流、接口层、错误模型、权限、多端、组件体系、Monorepo、发布和技术债。

- [ ] **Step 2：完成前端架构深层题 14–16 道**

覆盖：

- 从业务约束推导架构。
- 领域拆分与依赖倒置。
- 大型管理后台渐进演进。
- 状态一致性与缓存。
- 权限系统纵深防御。
- 可观测性、稳定性和降级。
- 构建 / 发布 / 环境治理。
- 平台化与过度抽象。
- 架构决策记录和技术债偿还。
- 多团队协作边界。

- [ ] **Step 3：将 `08-architecture-lead.md` 扩至 24–26 题**

保留团队与决策题，补充招聘、绩效反馈、跨团队冲突、架构推动、事故指挥、技术债预算和技术路线沟通。将纯技术架构题移到 `14-frontend-architecture.md`，并增加站内链接。

- [ ] **Step 4：将 `11-frontend-system-design.md` 扩至 12–14 题**

新增具体案例：微前端平台、统一权限中心、前端监控平台、配置化运营平台、跨端工程体系、BFF / API 聚合层。每题维持「目标 / 约束 / 方案 / 权衡 / 演进」结构。

- [ ] **Step 5：校验并提交**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

Expected：三文件题量分别落入设计范围；构建成功。

```bash
git add docs/interview/questions/08-architecture-lead.md docs/interview/questions/11-frontend-system-design.md docs/interview/questions/14-frontend-architecture.md
git commit -m "docs: 重构前端架构与 Lead 系统设计题库"
```

---

### Task 6：深化 JS / TS、Vue3、工程化

**Files:**
- Modify: `docs/interview/questions/01-js-ts.md`
- Modify: `docs/interview/questions/02-vue3.md`
- Modify: `docs/interview/questions/03-engineering.md`

- [ ] **Step 1：JS / TS 扩至 38–40 题**

新增深层主题：

- V8 隐藏类、内联缓存和对象形状。
- Event Loop、渲染时机和长任务。
- Promise / async 调度与错误传播。
- TypeScript 条件类型、分布式条件类型、infer、协变 / 逆变。
- 类型体操的工程边界。
- ESM 循环依赖、live binding、Tree-shaking 失效。
- 内存泄漏、WeakRef / FinalizationRegistry 使用边界。
- 大数据处理与 Web Worker。

- [ ] **Step 2：Vue3 扩至 45–47 题**

新增深层主题：

- track / trigger、effect 栈、调度器和批处理。
- computed 脏检查与缓存失效。
- watch flush 时机与 DOM 更新顺序。
- 编译器 block tree、patch flag、静态提升。
- keyed diff 的核心路径。
- effectScope 和复杂 composable 生命周期。
- 大表单、大表格、虚拟列表和响应式降级。
- SSR 水合不一致、异步边界和错误恢复。
- Pinia 跨请求状态与 SSR。
- Vue 应用在微前端中的挂载 / 卸载。

- [ ] **Step 3：工程化扩至 34–36 题**

新增深层主题：

- Vite 开发态依赖预构建与生产 Rollup。
- 插件钩子顺序、虚拟模块和 HMR。
- Chunk 策略、缓存失效与长期缓存。
- Source Map 安全和错误还原。
- CI 并行、增量构建、远程缓存。
- 制品、环境、配置和发布一致性。
- 前端可观测性、SLO、告警降噪。
- 供应链安全、锁文件、依赖审计。

- [ ] **Step 4：校验并提交**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

```bash
git add docs/interview/questions/01-js-ts.md docs/interview/questions/02-vue3.md docs/interview/questions/03-engineering.md
git commit -m "docs: 深化 JS TS Vue3 与工程化题库"
```

---

### Task 7：深化业务端与跨端题库

**Files:**
- Modify: `docs/interview/questions/04-admin-antdv.md`
- Modify: `docs/interview/questions/05-h5-vant.md`
- Modify: `docs/interview/questions/06-uniapp-miniprogram.md`

- [ ] **Step 1：Ant Design Vue 扩至 20–22 题**

新增 schema 表单架构、复杂表格状态、虚拟滚动、权限闭环、字典缓存、导入导出、主题定制和二次封装边界。

- [ ] **Step 2：Vant H5 扩至 18–20 题**

新增 WebView 通信协议、弱网恢复、离线缓存、手势冲突、长列表、图片策略、埋点质量和移动端性能指标。

- [ ] **Step 3：uni-app / 小程序扩至 25–27 题**

新增双线程模型、setData 成本、分包和预下载、原生组件边界、隐私合规、登录态、支付链路、性能分析和多端差异治理。

- [ ] **Step 4：校验并提交**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

```bash
git add docs/interview/questions/04-admin-antdv.md docs/interview/questions/05-h5-vant.md docs/interview/questions/06-uniapp-miniprogram.md
git commit -m "docs: 深化后台 H5 与小程序题库"
```

---

### Task 8：深化全栈、AI 与手写题

**Files:**
- Modify: `docs/interview/questions/07-java-fullstack.md`
- Modify: `docs/interview/questions/09-ai-vibe-coding.md`
- Modify: `docs/interview/questions/10-handwriting.md`

- [ ] **Step 1：Java 扩至 28–30 题**

补充事务传播、锁与并发、索引和执行计划、缓存一致性、消息幂等、接口安全、链路追踪和 Vue 联调故障。保持「全栈偏前」边界，不扩写 JVM 源码专题。

- [ ] **Step 2：AI / vibe coding 扩至 26–28 题**

补充上下文工程、规格驱动、任务分解、模型选择、代码审查、测试可信度、安全与隐私、幻觉 API、回滚策略、团队规范和 AI 交付指标。

新增至少 6 道 Cursor 前端实践题：

- Rules 的 `globs`、`alwaysApply` 与单一职责。
- 项目 Rule 和通用 Rule 的边界。
- Skill 的触发描述、`SKILL.md` 和渐进式披露。
- Rules、Skills、Hooks、MCP 的职责区别。
- Vue 项目如何组织 AI 上下文与验证关卡。
- AI 生成组件、状态管理和接口代码时的审查方法。

- [ ] **Step 3：手写题扩至 18–20 题**

新增：

- 支持取消的并发池。
- 带过期时间的 LRU。
- EventEmitter 的 once / off。
- JSON diff / patch 简化版。
- 树转列表 / 列表转树。
- 可重试请求与指数退避。
- 简化响应式 scheduler。

每题包含复杂度、边界和可运行 TypeScript 示例。

- [ ] **Step 4：校验并提交**

Run:

```bash
pnpm docs:validate
pnpm docs:build
```

```bash
git add docs/interview/questions/07-java-fullstack.md docs/interview/questions/09-ai-vibe-coding.md docs/interview/questions/10-handwriting.md
git commit -m "docs: 深化全栈 AI 与手写题库"
```

---

### Task 9：新增 Cursor 前端 AI 编程实践指南

**Files:**
- Create: `docs/interview/guides/ai-coding/cursor-workflow.md`
- Create: `docs/interview/guides/ai-coding/rules.md`
- Create: `docs/interview/guides/ai-coding/skills.md`
- Create: `docs/interview/guides/ai-coding/hooks-mcp.md`
- Create: `docs/interview/guides/ai-coding/vue-project-example.md`
- Modify: `docs/.vitepress/config.ts`

- [ ] **Step 1：编写 Cursor 工作流**

`cursor-workflow.md` 必须覆盖：

- 需求澄清 → 方案设计 → 实现计划 → 分步实现 → 测试 → 审查 → 提交。
- 如何引用文件、限制改动范围、保持上下文最小充分。
- 何时使用单代理、并行代理和独立审查。
- AI 输出不可信时的验证、回滚和重新切分。
- Vue3、TypeScript、Ant Design Vue、uni-app 项目的具体提示词示例。

- [ ] **Step 2：编写前端 Rules 指南**

`rules.md` 必须准确说明：

- 项目规则目录为 `.cursor/rules/`，规则文件为 `.mdc`。
- frontmatter 使用 `description`、`globs`、`alwaysApply`。
- Rule 保持单一职责、简短、可执行；优先低于 50 行。
- `alwaysApply: true` 只用于项目级通用约束。
- 文件类型规则使用明确 glob。

提供至少 5 个完整可复制示例：

1. Vue3 + TypeScript SFC。
2. Pinia / Vue Router。
3. Ant Design Vue 管理后台。
4. Vant / uni-app 多端。
5. 测试、安全、性能或可访问性。

每个示例必须包含完整 frontmatter 和正文，不得只给片段。

- [ ] **Step 3：编写前端 Skills 指南**

`skills.md` 必须准确说明：

- 个人 Skill：`~/.cursor/skills/<skill-name>/SKILL.md`。
- 项目 Skill：`.cursor/skills/<skill-name>/SKILL.md`。
- 不得写入 Cursor 内部保留目录。
- `name` 使用小写字母、数字和连字符，最长 64 字符。
- `description` 同时说明做什么、何时触发。
- `SKILL.md` 保持精简，详细内容放一层引用文件。
- `disable-model-invocation: true` 适用于仅显式调用的 Skill。

提供至少 5 个完整 Skill 结构：

1. Vue 组件开发。
2. 前端代码审查。
3. Web 性能排查。
4. 管理后台 CRUD 页面。
5. 小程序发布检查。

- [ ] **Step 4：编写 Hooks 与 MCP 指南**

`hooks-mcp.md` 必须说明：

- Rules：持续上下文与约束。
- Skills：可复用的专业工作流。
- Hooks：确定性的事件触发检查。
- MCP：连接外部工具和数据。

覆盖安全边界、密钥、最小权限、输出可信度、超时与降级。给出前端场景：浏览器调试、API 文档、错误监控、设计稿和部署平台。

- [ ] **Step 5：编写 Vue 项目完整示例**

`vue-project-example.md` 使用 Vue3 + TypeScript + Pinia + Vue Router + Ant Design Vue，提供：

- `.cursor/rules/` 文件清单和职责。
- `.cursor/skills/` 文件清单和触发场景。
- 从新增复杂列表页到验证构建的完整提示词链。
- API 类型、权限、表格、表单、错误处理和测试检查项。
- 常见失败示例：臆造组件 API、破坏响应式、跳过类型检查、修改无关文件。

- [ ] **Step 6：加入导航**

在「全栈与 AI」下增加：

```ts
{
  text: 'AI 编程实践',
  collapsed: true,
  items: [
    { text: 'Cursor 工作流', link: '/interview/guides/ai-coding/cursor-workflow' },
    { text: '前端 Rules', link: '/interview/guides/ai-coding/rules' },
    { text: '前端 Skills', link: '/interview/guides/ai-coding/skills' },
    { text: 'Hooks 与 MCP', link: '/interview/guides/ai-coding/hooks-mcp' },
    { text: 'Vue 项目示例', link: '/interview/guides/ai-coding/vue-project-example' },
  ],
}
```

- [ ] **Step 7：构建并提交**

Run:

```bash
pnpm docs:build
```

```bash
git add docs/.vitepress/config.ts docs/interview/guides/ai-coding
git commit -m "docs: 新增 Cursor 前端 AI 编程实践"
```

---

### Task 10：新增资深前端简历套件

**Files:**
- Create: `docs/interview/resume/senior-frontend-guide.md`
- Create: `docs/interview/resume/senior-frontend-template.md`
- Create: `docs/interview/resume/senior-frontend-example.md`
- Create: `docs/interview/resume/project-rewrite-checklist.md`
- Create: `docs/interview/resume/ats-checklist.md`
- Modify: `docs/.vitepress/config.ts`

- [ ] **Step 1：编写资深前端简历指南**

`senior-frontend-guide.md` 必须覆盖：

- 高级 / 资深前端、Tech Lead、全栈偏前的定位差异。
- 一句话定位、核心优势、技术能力、工作经历和项目经历。
- 如何证明复杂度、结果、技术取舍、团队影响和业务理解。
- 两页以内的信息优先级。
- 不应出现的空泛表达、职责流水账、敏感数据和无法证明的指标。

- [ ] **Step 2：编写可复制 Markdown 模板**

`senior-frontend-template.md` 提供完整模板，字段使用明确占位符：

```md
# [姓名]｜资深前端工程师 / 前端 Tech Lead

[城市]｜[手机号]｜[邮箱]｜[GitHub / 个人站]

## 职业定位

[用 2–3 句话说明年限、主栈、业务方向和核心价值]

## 核心优势

- [优势 + 场景 + 结果证据]

## 技术能力

- 前端：[…]
- 工程与架构：[…]
- 多端：[…]
- 全栈与 AI：[…]

## 工作经历

### [公司]｜[职位]｜[开始时间]–[结束时间]

- [背景 + 行动 + 结果]

## 代表项目

### [项目名称]｜[角色]

- 背景：[…]
- 难点：[…]
- 决策：[…]
- 行动：[…]
- 结果：[…]
- 复盘：[…]
```

- [ ] **Step 3：编写完整示例简历**

`senior-frontend-example.md` 顶部必须明确写：

> 以下公司、项目、规模和指标均为可替换示例，不代表用户真实经历；使用前必须替换并确保可验证。

示例覆盖：

- 10 年前端经验。
- Vue3 + TypeScript。
- Ant Design Vue 管理后台。
- Vant H5、uni-app / 微信小程序。
- 工程化、微前端、性能和稳定性。
- AI 编程、Cursor Rules / Skills。
- Java Spring Boot / NestJS 全栈协作。
- Tech Lead 的团队与架构影响力。

- [ ] **Step 4：编写项目改写清单**

`project-rewrite-checklist.md` 使用「背景 / 难点 / 决策 / 行动 / 指标 / 复盘」，至少提供 8 组前后对照，覆盖管理后台、性能、多端、工程化、微前端、AI 编程、全栈协作和团队治理。

- [ ] **Step 5：编写 ATS 检查清单**

`ats-checklist.md` 覆盖：

- 单栏、标准标题、纯文本可读。
- JD 关键词映射。
- 日期和名称一致。
- 技术名词规范。
- 页数与信息密度。
- 保密、真实性、错别字和链接。
- 针对高级前端 / Lead / 全栈偏前的投递前版本检查。

- [ ] **Step 6：加入导航**

新增「求职材料」分组：

```ts
{
  text: '求职材料',
  items: [
    { text: '资深前端简历指南', link: '/interview/resume/senior-frontend-guide' },
    { text: 'Markdown 模板', link: '/interview/resume/senior-frontend-template' },
    { text: '完整示例', link: '/interview/resume/senior-frontend-example' },
    { text: '项目改写清单', link: '/interview/resume/project-rewrite-checklist' },
    { text: 'ATS 检查', link: '/interview/resume/ats-checklist' },
  ],
}
```

- [ ] **Step 7：检查示例真实性标识**

Run:

```bash
rg -n '可替换示例|不代表用户真实经历' docs/interview/resume/senior-frontend-example.md
```

Expected：两项均有命中。

- [ ] **Step 8：构建并提交**

Run:

```bash
pnpm docs:build
```

```bash
git add docs/.vitepress/config.ts docs/interview/resume
git commit -m "docs: 新增资深前端简历完整套件"
```

---

### Task 11：更新总览、学习计划和模拟面试

**Files:**
- Modify: `docs/index.md`
- Modify: `docs/interview/00-overview.md`
- Modify: `docs/interview/plans/7-day.md`
- Modify: `docs/interview/plans/14-day.md`
- Modify: `docs/interview/plans/30-day.md`
- Modify: `docs/interview/mocks/scripts.md`
- Modify: `docs/interview/mocks/scorecard.md`
- Modify: `README.md`

- [ ] **Step 1：更新首页与总览**

首页增加微前端、NestJS、前端架构、AI 编程实践和资深前端简历入口；总览改为 14 个题库模块和约 400 题，并说明 `Q` / `D` 分层。

- [ ] **Step 2：更新 7 天计划**

增加 1 个「架构与 AI 专项」组合日：微前端高频 2 题、NestJS 高频 2 题、前端架构深层 2 题、Cursor Rules / Skills 实践 1 项；保持原 planId 和 checklist id 稳定，新增 id 使用 `d6-architecture-*`。

- [ ] **Step 3：更新 14 天计划**

将 D9 调整为 NestJS / Java 全栈对比，将 D10 调整为前端架构 + Lead，将 D11 加入微前端 + Cursor Rules / Skills 实践；D14 增加简历终检，保留 D12–D14 模拟和收敛。

- [ ] **Step 4：更新 30 天计划**

增加独立专题日：

- 微前端原理与选型。
- NestJS 基础与生产实践。
- NestJS 高级机制。
- 前端架构。
- Cursor Rules / Skills 与 Vue 项目实践。
- 资深前端简历改写和 ATS 检查。
- 综合架构模拟。

保持 30 天总长度，通过合并原有弱项回炉日实现。

- [ ] **Step 5：新增 3 套模拟脚本**

在 `scripts.md` 追加：

- 微前端架构专项（60 分钟）。
- 全栈偏前 NestJS 专项（60 分钟）。
- 高级前端架构专项（75 分钟）。

每套包含开场、项目深挖、题库链接、系统设计、追问和反问。

- [ ] **Step 6：扩展评分表**

增加架构约束识别、原理深度、故障治理和演进能力 4 个评分点，同时保留原有五维评分。

- [ ] **Step 7：更新 README**

增加 14 个题库目录、AI 编程实践、简历专区、`pnpm docs:validate` / `pnpm docs:check` 命令和线上阅读路径。

- [ ] **Step 8：构建并提交**

Run:

```bash
pnpm docs:check
```

```bash
git add docs/index.md docs/interview/00-overview.md docs/interview/plans docs/interview/mocks README.md
git commit -m "docs: 更新扩展题库的学习与模拟路径"
```

---

### Task 12：最终内容审查与发布

**Files:**
- Modify: `scripts/validate-question-bank.mjs`（仅在验收规则确有缺口时）
- Modify: 所有被审查发现问题的题库文件

- [ ] **Step 1：执行最终题量门禁**

Run:

```bash
MIN_TOTAL_QUESTIONS=380 MAX_TOTAL_QUESTIONS=410 pnpm docs:validate
```

Expected：

- 总题量 380–410。
- 14 个题库全部输出统计。
- 无答案或深层题结构错误为 0。

- [ ] **Step 2：检查占位和重复标题**

Run:

```bash
rg -n '内容建设中|稍后补充|待完善' docs/interview README.md
```

Expected：无输出。

使用 Node.js 脚本或 `awk` 提取同一文件内的三级标题，确认没有重复 `Qn` / `Dn` 编号。

- [ ] **Step 3：人工抽检**

每个模块抽检至少 20%，重点检查：

- 答案是否直接回应问题。
- 原理与框架版本是否准确。
- 工程场景是否包含约束、选择和结果。
- 深层题是否不是普通答案的简单扩写。
- 微前端四方案是否明确区分机制。
- NestJS 是否保持 Node.js / TypeScript 语境。
- 三个架构模块是否边界清晰。
- Cursor Rules / Skills 示例是否符合目录、frontmatter 和触发规则。
- 简历示例是否明确标记为可替换内容，并且没有暗示为用户真实经历。

- [ ] **Step 4：完整构建**

Run:

```bash
pnpm docs:check
```

Expected：内容校验和 VitePress 构建均 exit 0。

- [ ] **Step 5：提交审查修正**

```bash
git add docs scripts package.json README.md
git commit -m "docs: 完成题库扩容与深度验收"
```

若无修正内容，不创建空提交。

- [ ] **Step 6：推送并观察部署**

```bash
git push origin master
gh run list --repo julytian/mianshi --limit 3
```

等待最新 `Deploy docs to GitHub Pages` 成功后验证：

- `https://julytian.github.io/mianshi/`
- 新增题库导航可访问。
- 本地搜索能检索 qiankun、Garfish、Module Federation、Wujie、NestJS。
- 本地搜索能检索 Cursor Rules、Skills、Hooks、MCP 和资深前端简历。
- 深层题折叠答案正常。

---

## 自检

### Spec 覆盖

- 3 个新增题库：Task 2–5。
- 11 个旧题库扩容：Task 5–8。
- 深层题统一格式：Task 1 校验，Task 3–8 落地。
- 三个架构模块边界：Task 5。
- Cursor AI 编程实践：Task 8–9。
- 资深前端简历套件：Task 10。
- 导航、计划、模拟：Task 2、9–11。
- 380–410 题与构建：Task 12。
- GitHub Pages 发布：Task 12。

### 命名一致性

- 深层题编号统一为 `D1.`。
- 普通题编号统一为 `Q1.`。
- 新增文件固定为 `12-microfrontend.md`、`13-nestjs.md`、`14-frontend-architecture.md`。
- 校验命令固定为 `pnpm docs:validate`，组合命令固定为 `pnpm docs:check`。
