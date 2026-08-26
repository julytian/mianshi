# Cursor Rules：把项目约定放进上下文

> 版本说明：以下格式以 **2026-08** 为基线；实施前请核对 [Cursor Rules 官方文档](https://cursor.com/docs/rules.md)。

Rules 是随代码库版本管理的持续指令，适合表达「在什么文件中，应遵循哪些项目约定」。项目 Rule 位于 `.cursor/rules/*.mdc`，不是普通 `.md`。常用 frontmatter：

- `description`：说明规则内容和适用场景；
- `globs`：匹配文件时应用的路径模式；
- `alwaysApply`：是否在所有 Agent Chat 会话中始终应用；`true` 仅用于真正项目级、与文件类型无关的通用约束，文件专属规范应使用 `globs` 并设为 `false`。

Rules 不影响 Cursor Tab 或其他 AI 功能，User Rules 也不应用于 Inline Edit。Rule 应短、可执行、单一职责；官方建议低于 500 行，本指南把「每条不超过 50 行」作为便于团队维护的更严格建议，而非 Cursor 限制。

## 边界与选择

完整职责矩阵和统一质量基线见 [Cursor 前端 AI 编程工作流](./cursor-workflow#职责矩阵与统一质量基线)。本篇只补充 Rule 特有选择：稳定编码约定和目录规范用 Rule；简单、可读、按目录继承的说明可用 `AGENTS.md`。

不要把令牌、口令写进 Rule，也不要用 Rule 假装「禁止」危险命令。模型指令不是强制安全边界。

## 示例 1：Vue SFC

保存为 `.cursor/rules/vue-sfc.mdc`：

```mdc
---
description: Vue 3 单文件组件的结构、响应式与组件契约
globs: "**/*.vue"
alwaysApply: false
---

# Vue SFC

- 默认使用 `<script setup lang="ts">`，顺序为 script、template、style。
- 组件保持单一职责；页面只负责组合，复杂状态提取到 composable。
- Props 只读，使用类型化 Props/Emits；默认 Props Down、Events Up。
- 源状态保持最少，派生值使用纯 `computed`，`watch` 只处理副作用。
- 列表必须使用稳定 key；不要在同一元素组合 `v-if` 与 `v-for`。
- 不对不可信内容使用 `v-html`。
- 组件样式默认 `scoped`，全局 token 放入统一样式入口。
- 修改后运行相关测试和项目的 `vue-tsc`/typecheck 命令。
```

## 示例 2：Pinia 与 Router

保存为 `.cursor/rules/pinia-router.mdc`：

```mdc
---
description: Pinia 状态与 Vue Router 4 导航约定
globs: "src/{stores,router,views}/**/*.{ts,vue}"
alwaysApply: false
---

# Pinia 与 Router

- Pinia 只保存跨组件、跨页面或需追踪的共享源状态。
- 从 Store 解构响应式状态时使用 `storeToRefs`；Action 直接从 Store 调用。
- 页面筛选、分页等可分享状态优先同步到 URL 查询参数。
- 路由 meta 权限必须有明确类型；前端守卫不替代服务端鉴权。
- 守卫返回导航结果，避免混用 `next`；异步守卫必须等待必要检查。
- 监听路由参数变化，不能假设同一路由参数变化会重新挂载组件。
- 退出登录时清理用户态，并避免守卫重定向循环。
- 为权限拒绝、深链刷新和参数切换补测试。
```

## 示例 3：Ant Design Vue 后台

保存为 `.cursor/rules/antdv-admin.mdc`：

```mdc
---
description: Ant Design Vue 后台列表、表单和权限交互规范
globs: "src/{views,components}/admin/**/*.{vue,ts}"
alwaysApply: false
---

# Ant Design Vue 后台

- 复用项目封装的 Table、Form、Modal、权限指令和设计 token。
- 列表查询参数必须有类型；分页、排序、筛选与后端契约一致。
- 表格 rowKey 使用稳定业务 ID，不使用数组下标。
- 表单提交前校验；提交期间禁用重复操作，关闭弹窗前处理未保存内容。
- 删除、发布等不可逆操作必须二次确认，并显示对象名称与影响。
- 加载、空态、无权限和请求失败均提供明确反馈与恢复动作。
- 按钮隐藏不是鉴权；服务端仍需校验资源权限。
- 不猜测 API 字段，从现有类型或经确认的 OpenAPI 获取契约。
```

## 示例 4：Vant 与 uni-app

保存为 `.cursor/rules/mobile-multiplatform.mdc`：

```mdc
---
description: Vant H5 与 uni-app 多端页面的兼容和交互约定
globs: "src/{pages,views,components}/**/*.{vue,ts,scss}"
alwaysApply: false
---

# 移动端与多端

- 先确认目标端、框架版本和项目已有跨端封装。
- Vant H5 处理安全区、软键盘、滚动锁定和至少 44px 触控目标。
- uni-app 不直接使用 DOM、window 或仅单平台 API；必要时显式条件编译。
- 页面卸载时取消请求、定时器和监听，防止异步结果回写失效页面。
- 分页请求防重复、去重并正确处理无更多数据和失败重试。
- 不在客户端保存长期密钥；日志和埋点不得包含敏感数据。
- 验证窄屏、横屏、弱网、重复点击及至少一个目标小程序环境。
```

## 示例 5：测试、安全、性能与可访问性

关注点较多时可进一步拆为 `testing.mdc`、`security.mdc`、`performance.mdc` 和 `a11y.mdc`。先从下面的统一基线开始，避免多个 Rule 重复或冲突。

保存为 `.cursor/rules/quality-gates.mdc`：

```mdc
---
description: 前端变更的测试、安全、性能与可访问性基线
globs: "src/**/*.{ts,tsx,vue,js,jsx}"
alwaysApply: false
---

# 质量门禁

- 先写能因目标缺陷而失败的测试，再做最小实现。
- 覆盖成功、空数据、失败、取消、无权限和重复操作路径。
- 不使用 `any`、跳过类型检查或删除断言来让检查通过。
- 不渲染未净化 HTML，不记录令牌；所有输入在可信边界重新校验。
- 性能优化先测量；大列表再评估虚拟化，副作用必须清理。
- 使用语义 HTML；交互支持键盘、可见焦点、可访问名称和错误关联。
- 仅修改任务文件；运行相关测试、typecheck、lint 与生产构建。
- 输出实际命令、退出码和未验证项，不声称未执行的检查已通过。
```

## `AGENTS.md` 与嵌套规则

截至 2026-08，Cursor 支持项目根目录及子目录中的 `AGENTS.md`。子目录说明会与父目录说明组合，更具体的指令优先。它适合不需要 frontmatter 的简单说明，例如：

```markdown
# 前端约定

- 使用 pnpm。
- 提交前运行 `pnpm test` 和 `pnpm typecheck`。
- `src/generated/` 由工具生成，不手工修改。
```

当需要按 glob 精确作用、智能匹配或始终应用时，优先使用 `.cursor/rules/*.mdc`。

## 从 `.cursorrules` 迁移

`.cursorrules` 是旧格式，不应继续作为新项目方案。迁移步骤：

1. 读取旧文件，把内容按单一职责分组；
2. 删除重复、过时和无法验证的泛化指令；
3. 每组建立 `.cursor/rules/<name>.mdc`；
4. 配置 `description`、`globs`、`alwaysApply`；
5. 通用且简单的目录说明可迁到嵌套 `AGENTS.md`；
6. 用真实任务确认 Rule 被加载且没有互相冲突；
7. 团队完成迁移后再删除 `.cursorrules`。

注意：把旧内容改名为 `.md` 放进 `.cursor/rules/` 不会成为有效 Project Rule。

## 维护检查

- 每条 Rule 是否只有一个清晰目标；
- 是否能从路径判断作用范围；
- 是否包含无法由模型强制执行的安全承诺；
- 是否与代码、测试、CI 或其他 Rule 冲突；
- 是否记录了已过期的版本事实；
- 是否可以删减到 50 行以内。

## 官方资料

- [Cursor Rules](https://cursor.com/docs/rules.md)
- [Cursor Skills](https://cursor.com/docs/skills.md)
- [Cursor Hooks](https://cursor.com/docs/hooks.md)

