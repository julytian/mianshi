# Cursor Skills：封装可复用工作流

> 版本说明：以下字段与目录以 **2026-08** 为基线；实施前请核对 [Cursor Skills 官方文档](https://cursor.com/docs/skills)。

Skill 用于教 Agent 完成一类可复用任务。每个 Skill 是一个包含 `SKILL.md` 的目录：

```text
.cursor/skills/<skill-name>/       # 项目 Skill，随仓库共享
~/.cursor/skills/<skill-name>/     # 个人 Skill，跨项目使用
├── SKILL.md                       # 必需
├── references/                    # 可选，详细资料
├── scripts/                       # 可选，确定性工具
└── assets/                        # 可选，模板或静态资源
```

不要把个人 Skill 写入 `~/.cursor/skills-cursor/`，该目录由 Cursor 管理。

## frontmatter 字段

- `name`：必填，最长 64 个字符，只能使用小写字母、数字和连字符；应与父目录名一致；
- `description`：必填，明确「做什么」和「何时使用」；
- `paths`：可选，用 glob 限定相关文件，可写逗号分隔字符串或列表；
- `disable-model-invocation`：可选，设为 `true` 后只在显式 `/skill-name` 调用时加载。

`SKILL.md` 应只保留完成任务必需的流程。详细标准放在一层引用中，由 `SKILL.md` 直接链接，例如 `references/checklist.md`，不要构造多层引用链。

## 示例 1：Vue 组件

目录：

```text
.cursor/skills/build-vue-component/
├── SKILL.md
├── references/component-checklist.md
└── assets/component-test.template.ts
```

完整 `SKILL.md`：

```markdown
---
name: build-vue-component
description: 设计并实现类型安全、可测试的 Vue 3 组件。新增或重构 .vue 组件、composable 或组件契约时使用。
paths:
  - "src/**/*.vue"
  - "src/composables/**/*.ts"
---

# 构建 Vue 组件

1. 阅读相邻组件、测试、样式 token 和项目命令。
2. 复述行为、Props、Emits、插槽、状态与可访问性要求。
3. 规划组件边界；页面负责组合，复杂副作用提取到 composable。
4. 先补能失败的交互测试，再做最小实现。
5. 使用 `<script setup lang="ts">`；Props 只读，事件类型化。
6. 保持源状态最少；派生值用 `computed`，副作用用 `watch` 并清理。
7. 验证键盘操作、焦点、加载、空态和错误态。
8. 运行相关测试、typecheck 和 build，报告实际结果。

详细验收见 [references/component-checklist.md](references/component-checklist.md)。
```

一层引用 `references/component-checklist.md`：

```markdown
# Vue 组件验收清单

## 契约

- Props、Emits、插槽和公开方法均有 TypeScript 类型。
- 子组件不修改 Props；双向绑定仅用于真实的双向契约。
- 列表使用稳定业务 key，没有在同一元素混用 `v-if` 与 `v-for`。

## 响应式

- 可替换对象使用 `ref`，不直接解构 `reactive` 或 Pinia 状态。
- `computed` 无请求、写存储、emit 等副作用。
- 请求、监听、定时器在失效或卸载时清理。

## 交互与质量

- 使用语义元素、可见焦点和可访问名称。
- 覆盖成功、失败、空态、禁用和重复操作。
- 没有 `any`、不可信 `v-html`、硬编码密钥或无关改动。
```

## 示例 2：代码审查

目录：

```text
~/.cursor/skills/review-frontend-change/
├── SKILL.md
└── references/severity.md
```

完整 `SKILL.md`：

```markdown
---
name: review-frontend-change
description: 基于需求和 diff 审查前端变更的正确性、安全、性能、可访问性与测试。审查 PR、提交或工作区改动时使用。
disable-model-invocation: true
---

# 审查前端变更

1. 获取需求、变更范围、完整 diff 和验证结果；不修改代码。
2. 检查调用方与被调用方，不只阅读新增行。
3. 验证边界、并发、响应式、资源清理、权限和错误路径。
4. 判断测试是否会在实现错误时失败，识别被跳过的质量门禁。
5. 只报告有证据、可复现且由本次变更引入的问题。
6. 每项包含严重级别、文件位置、触发条件、影响与最小修复建议。
7. 若无阻塞问题，明确说明残余风险和未验证项。

严重级别定义见 [references/severity.md](references/severity.md)。
```

## 示例 3：前端性能诊断

目录：

```text
.cursor/skills/diagnose-frontend-performance/
├── SKILL.md
├── references/budgets.md
└── scripts/compare-metrics.mjs
```

完整 `SKILL.md`：

```markdown
---
name: diagnose-frontend-performance
description: 用可复现实验定位前端加载或交互性能问题并验证优化收益。出现卡顿、长任务、包体增长或 Core Web Vitals 回归时使用。
paths:
  - "src/**/*.{vue,ts,tsx,js}"
  - "vite.config.*"
disable-model-invocation: true
---

# 诊断前端性能

1. 明确设备、网络、页面、操作路径、样本数与性能预算。
2. 在相同环境记录优化前指标和 trace；不要凭代码外观猜瓶颈。
3. 区分网络、JavaScript、渲染、内存和第三方脚本成本。
4. 提出最小假设，一次只改一个变量。
5. 优先修复算法、请求瀑布和大列表，再评估缓存、懒加载或虚拟化。
6. 重复采样，比较中位数与异常值，检查功能和可访问性回归。
7. 记录原始数据、结论、适用范围和仍未解决的问题。

如存在 `scripts/compare-metrics.mjs`，执行它比较两份已脱敏指标文件；
不要把脚本内容当成结论。
```

## 示例 4：后台 CRUD

目录：

```text
.cursor/skills/build-admin-crud/
├── SKILL.md
├── references/api-contract.md
└── assets/crud-acceptance.md
```

完整 `SKILL.md`：

```markdown
---
name: build-admin-crud
description: 基于已确认 API 契约实现 Ant Design Vue 后台 CRUD 列表、表单和权限交互。新增后台管理页面时使用。
paths: "src/{views,features,api}/admin/**/*.{vue,ts}"
---

# 构建后台 CRUD

1. 读取同类页面、请求封装、权限指令、路由和 API 类型。
2. 若契约缺失，停止并请求 OpenAPI 或真实样例；不得臆造字段。
3. 定义 DTO、查询参数、分页结果和表单模型之间的转换。
4. 拆分页面容器、筛选表单、数据表格和编辑弹窗。
5. 先覆盖查询、创建、编辑、删除失败和无权限场景。
6. 实现服务端分页排序、重复提交保护、二次确认和可恢复错误。
7. 验证 URL 状态、刷新、深链、键盘操作和权限边界。
8. 运行相关测试、typecheck、lint 与生产构建。

契约核对见 [references/api-contract.md](references/api-contract.md)。
```

## 示例 5：小程序发布

目录：

```text
.cursor/skills/release-mini-program/
├── SKILL.md
├── references/release-checklist.md
└── scripts/check-release-env.mjs
```

完整 `SKILL.md`：

```markdown
---
name: release-mini-program
description: 检查并组织 uni-app 小程序发布，覆盖环境、构建、隐私、权限和回滚证据。准备微信等小程序提审或发布时使用。
paths:
  - "src/pages/**"
  - "manifest.json"
  - "pages.json"
disable-model-invocation: true
---

# 发布小程序

1. 确认目标平台、版本号、环境、审核范围和负责人。
2. 检查工作区、分支、依赖锁、配置来源和密钥注入方式。
3. 运行 `scripts/check-release-env.mjs`（若存在），失败时停止。
4. 按项目脚本执行测试、typecheck 和目标平台生产构建。
5. 核对权限声明、隐私协议、分包大小、条件编译和平台 API。
6. 在目标开发者工具验证登录、支付、分享、弱网与升级路径。
7. 输出构建 SHA、产物来源、验证证据、已知风险与回滚版本。
8. 上传、提审、发布等外部写操作必须取得人工确认。

完整人工检查见 [references/release-checklist.md](references/release-checklist.md)。
```

## Skill 不是安全策略

Skill 仍是提供给模型的指导，不能保证每次自动调用，也不能强制阻止命令。以下场景需要其他机制：

- 编码规范：Rule 与 lint/typecheck；
- 危险命令拦截：Hook、审批、文件系统权限或沙箱；
- 外部服务权限：MCP 端最小权限和服务端鉴权；
- 发布质量：CI、受保护分支和发布平台审批；
- 密钥管理：环境变量、密钥服务和日志脱敏。

## 设计检查

- 名称是否具体并与目录一致；
- 描述是否同时写明能力和触发场景；
- `paths` 是否足够窄且不会漏掉关键文件；
- 自动调用是否安全，是否应设 `disable-model-invocation: true`；
- `SKILL.md` 是否简洁，引用是否只有一层；
- 脚本是否可执行、依赖明确、失败信息可操作；
- 是否错误承诺了「强制安全」或自动完成外部写操作。

## 官方资料

- [Cursor Skills](https://cursor.com/docs/skills)
- [Cursor Rules](https://cursor.com/docs/rules)
- [Cursor Agent 安全](https://cursor.com/docs/agent/security)

