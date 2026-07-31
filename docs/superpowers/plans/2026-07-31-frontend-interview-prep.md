# 前端面试站（VitePress）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建可本地预览的 VitePress 面试准备站，包含侧重点矩阵、14/7/30 天冲刺计划、全量带答案题库（含 Java 全栈偏前）、项目故事与模拟面试脚本。

**Architecture:** 双层内容——`docs/interview/questions/` 为底层题库，`plans/` / `stories/` / `mocks/` 为上层作战手册；VitePress 以 `docs/` 为根，忽略 `docs/superpowers/`；计划页用客户端脚本把 checklist 进度写入 `localStorage`；答案用 Markdown `::: details` 默认折叠。

**Tech Stack:** pnpm、VitePress（最新稳定版）、TypeScript 配置、Vue 主题默认能力、localStorage。

**Spec:** `docs/superpowers/specs/2026-07-31-frontend-interview-prep-design.md`

---

## 文件结构锁定

| 路径                                                 | 职责                                            |
| ---------------------------------------------------- | ----------------------------------------------- |
| `package.json`                                       | 脚本 `docs:dev` / `docs:build` / `docs:preview` |
| `README.md`                                          | 启动说明、定位、如何按公司类型复习              |
| `docs/.vitepress/config.ts`                          | 站点标题、中文、搜索、侧边栏、忽略 superpowers  |
| `docs/.vitepress/theme/index.ts`                     | 引入默认主题 + 计划页进度样式（如需）           |
| `docs/.vitepress/theme/components/PlanChecklist.vue` | 计划页可勾选进度（localStorage）                |
| `docs/index.md`                                      | 首页入口                                        |
| `docs/interview/00-overview.md`                      | 总览与侧重点矩阵                                |
| `docs/interview/plans/{14,7,30}-day.md`              | 冲刺计划                                        |
| `docs/interview/questions/01`–`11-*.md`              | 题库（题题有答案）                              |
| `docs/interview/stories/*`                           | 故事模板与示例                                  |
| `docs/interview/mocks/*`                             | 模拟面、评分表、反问                            |

---

### Task 1: 初始化包与 VitePress 骨架

**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `docs/.vitepress/config.ts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/index.md`
- Create: `docs/interview/00-overview.md`（先放占位标题，Task 3 写满）

- [ ] **Step 1: 写入 `package.json`**

```json
{
  "name": "mianshi",
  "private": true,
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.3",
    "vue": "^3.5.13"
  }
}
```

- [ ] **Step 2: 写入 `.gitignore`**

```
node_modules
docs/.vitepress/dist
docs/.vitepress/cache
.DS_Store
```

- [ ] **Step 3: 写入最小 `docs/.vitepress/config.ts`**

```ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '前端面试作战手册',
  description: 'Vue3 / Lead / Java 全栈偏前 · 面试方案与题库',
  lang: 'zh-CN',
  ignoreDeadLinks: true,
  // 不把设计/计划元文档挂进站点
  srcExclude: ['**/superpowers/**'],
  themeConfig: {
    logo: undefined,
    nav: [
      { text: '总览', link: '/interview/00-overview' },
      { text: '冲刺计划', link: '/interview/plans/14-day' },
      { text: '题库', link: '/interview/questions/02-vue3' },
      { text: '故事', link: '/interview/stories/template' },
      { text: '模拟面', link: '/interview/mocks/scripts' },
    ],
    sidebar: {
      '/interview/': [
        {
          text: '开始',
          items: [
            { text: '首页', link: '/' },
            { text: '总览与侧重点矩阵', link: '/interview/00-overview' },
          ],
        },
        {
          text: '冲刺计划',
          items: [
            { text: '14 天主线', link: '/interview/plans/14-day' },
            { text: '7 天压缩版', link: '/interview/plans/7-day' },
            { text: '30 天加练版', link: '/interview/plans/30-day' },
          ],
        },
        {
          text: '题库',
          items: [
            { text: 'JS / TS', link: '/interview/questions/01-js-ts' },
            { text: 'Vue3', link: '/interview/questions/02-vue3' },
            { text: '工程化', link: '/interview/questions/03-engineering' },
            {
              text: 'Ant Design Vue',
              link: '/interview/questions/04-admin-antdv',
            },
            { text: 'Vant H5', link: '/interview/questions/05-h5-vant' },
            {
              text: 'uni-app / 小程序',
              link: '/interview/questions/06-uniapp-miniprogram',
            },
            {
              text: 'Java 全栈偏前',
              link: '/interview/questions/07-java-fullstack',
            },
            {
              text: '架构 / Lead',
              link: '/interview/questions/08-architecture-lead',
            },
            {
              text: 'AI / vibe coding',
              link: '/interview/questions/09-ai-vibe-coding',
            },
            { text: '手写题', link: '/interview/questions/10-handwriting' },
            {
              text: '前端系统设计',
              link: '/interview/questions/11-frontend-system-design',
            },
          ],
        },
        {
          text: '故事与模拟',
          items: [
            { text: '故事模板', link: '/interview/stories/template' },
            { text: '故事示例', link: '/interview/stories/examples' },
            { text: '模拟脚本', link: '/interview/mocks/scripts' },
            { text: '评分表', link: '/interview/mocks/scorecard' },
            { text: '反问清单', link: '/interview/mocks/reverse-questions' },
          ],
        },
      ],
    },
    search: { provider: 'local' },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
  },
});
```

- [ ] **Step 4: 写入主题入口**

```ts
// docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import './custom.css';

export default DefaultTheme;
```

```css
/* docs/.vitepress/theme/custom.css */
:root {
  --vp-c-brand-1: #0f766e;
  --vp-c-brand-2: #0d9488;
  --vp-c-brand-3: #14b8a6;
}
```

- [ ] **Step 5: 写入首页与 README 骨架**

`docs/index.md` 使用 VitePress home layout，包含定位一句话与四个链接按钮：总览、14 天计划、Vue3 题库、模拟面。

`README.md` 写明：

```bash
pnpm install
pnpm docs:dev
```

以及技术画像（Vue3 主栈 + Java vibe coding）与「按公司类型看侧重点矩阵」。

- [ ] **Step 6: 安装依赖并验证能启动**

Run: `cd /Users/julytian/Desktop/mianshi && pnpm install && pnpm docs:dev`

Expected: 本地可打开，首页与侧边栏可见（缺失的 md 稍后补齐前可先建空文件避免死链；`ignoreDeadLinks: true` 已开）。

- [ ] **Step 7: 批量创建空内容文件（标题 + 一句话），保证路由可点**

对 `plans/`、`questions/`、`stories/`、`mocks/` 下每个文件写入：

```md
# 标题

> 内容建设中（下一任务填充）
```

---

### Task 2: 计划页 Checklist 组件（localStorage）

**Files:**

- Create: `docs/.vitepress/theme/components/PlanChecklist.vue`
- Modify: `docs/.vitepress/theme/index.ts`
- Modify: `docs/.vitepress/config.ts`（如需注册）

- [ ] **Step 1: 实现 `PlanChecklist.vue`**

行为约定：

- Props：`planId: string`（如 `14-day`）、`items: { id: string; label: string }[]`
- 勾选状态 key：`mianshi-plan:${planId}`
- 值：`Record<itemId, boolean>` JSON
- 提供「清除本计划进度」按钮
- 无后端、无登录

组件模板使用原生 checkbox + 列表；样式简洁，跟 VitePress 文档页协调。

- [ ] **Step 2: 在 theme 中注册全局组件**

```ts
import DefaultTheme from 'vitepress/theme';
import PlanChecklist from './components/PlanChecklist.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlanChecklist', PlanChecklist);
  },
};
```

- [ ] **Step 3: 在任意临时 md 中插入组件做冒烟**

```md
<PlanChecklist planId="smoke" :items='[{"id":"a","label":"测试项 A"}]' />
```

Run: `pnpm docs:dev` → 勾选后刷新仍保留 → 清除后重置。

- [ ] **Step 4: 删除临时冒烟片段（正式计划页在 Task 4 接入）**

---

### Task 3: 总览与侧重点矩阵（写满）

**Files:**

- Modify: `docs/interview/00-overview.md`

- [ ] **Step 1: 写入完整总览**，必须包含：

1. 一句话定位（10 年前端 / Vue3+TS / 多端 / AntDV+Vant / AI+Java vibe coding）
2. 目标岗位 A/B/C 说明
3. 完整侧重点矩阵表（与 spec §5.3 一致）
4. Java 叙事边界（单体为主、微服务点到为止、不拼 JVM）
5. 如何使用本站：先选公司类型 → 看矩阵 → 进 14 天计划 → 题库对答案 → 故事与模拟
6. 题型说明：题目 / 考察点 / 参考答案（折叠）/ 追问链 / 踩坑

- [ ] **Step 2: 浏览器打开该页，确认表格与目录正常**

---

### Task 4: 三份冲刺计划（写满并接入 Checklist）

**Files:**

- Create/Modify: `docs/interview/plans/14-day.md`
- Create/Modify: `docs/interview/plans/7-day.md`
- Create/Modify: `docs/interview/plans/30-day.md`

- [ ] **Step 1: 写 `14-day.md`**

按 D1–D14 每日一节，每日包含：

- 学习目标（2–4 条）
- 题库链接（具体文件锚点，如 `/interview/questions/02-vue3#q3`——锚点在写题库时用 `### Q3. xxx` 生成）
- 口述任务（故事或模拟）
- `<PlanChecklist planId="14-day" :items="[...]">`，items 覆盖每日 3–5 个可勾选项

阶段划分必须与 spec 一致：D1–3 底座、D4–6 多端、D7–9 工程化+Java、D10–11 Lead+AI、D12–14 模拟收敛。

- [ ] **Step 2: 写 `7-day.md`**（从 14 天裁剪，保留 Vue3 / 工程化 / 主故事 / AI+Java / 1 场模拟）

- [ ] **Step 3: 写 `30-day.md`**（14 天 + 手写隔日 + 系统设计周更 + 每周模拟 + 可选最小 Spring Boot CRUD 口述闭环）

- [ ] **Step 4: 本地验证 checklist 在三份计划中读写互不干扰（不同 `planId`）**

---

### Task 5: 题库公共写法约定 + JS/TS 模块

**Files:**

- Create: `docs/interview/questions/_template-snippet.md`（仅作者备忘，可不进侧边栏）
- Create/Modify: `docs/interview/questions/01-js-ts.md`

每题固定结构：

```md
### Q1. 题目标题

**考察点：** ...

::: details 参考答案
...
:::

**追问：**

1. ...
2. ...

**踩坑：** ...
```

- [ ] **Step 1: 写满 `01-js-ts.md`，不少于 25 题**，覆盖：

类型与类型体操基础、`unknown` vs `any`、泛型约束、工具类型、闭包与作用域、事件循环与微任务、`this`、深拷贝边界、防抖节流、Promise 并发控制、`async` 错误处理、模块化、Tree-shaking 直觉、TS 在 Vue 中的实战类型、接口设计与前端类型同步等。

每题必须有折叠参考答案；至少 8 题带追问。

- [ ] **Step 2: `pnpm docs:build` 确认该页无构建错误**

---

### Task 6: Vue3 题库（写透）

**Files:**

- Create/Modify: `docs/interview/questions/02-vue3.md`

- [ ] **Step 1: 写满不少于 30 题**，必须覆盖：

响应式（reactive/ref/proxy）、依赖收集直觉、`computed`/`watch`/`watchEffect`、组件通信、`provide/inject`、生命周期、`script setup`、Pinia、路由守卫与懒加载、`keep-alive`、异步组件、自定义指令、composables 设计、性能（`v-once`/`v-memo`/列表 key）、SSR/水合认知（点到为止）、与 Vue2 差异、编译优化直觉、Suspense、Teleport、错误边界实践、大型表单/表格实践结合点。

每题有完整参考答案；**每题尽量带追问链**（本模块为写透）。

- [ ] **Step 2: 构建验证**

Run: `pnpm docs:build`

---

### Task 7: 工程化题库（写透）

**Files:**

- Create/Modify: `docs/interview/questions/03-engineering.md`

- [ ] **Step 1: 写满不少于 20 题**，覆盖：

Vite 原理直觉与插件、环境变量、包体积分析、代码分割、CI 质量门禁、ESLint/Stylelint/Prettier、Husky/lint-staged、单测策略（组件测什么不测什么）、Monorepo 认知、版本发布、灰度与监控、性能指标（LCP/INP/CLS）、首屏优化、缓存策略、Source Map 与生产排障、微前端「何时上何时不上」、组件库建设节奏、CR 规范。

- [ ] **Step 2: 构建验证**

---

### Task 8: 业务多端题库（AntDV / Vant / uni-app）

**Files:**

- Create/Modify: `docs/interview/questions/04-admin-antdv.md`（≥12 题）
- Create/Modify: `docs/interview/questions/05-h5-vant.md`（≥10 题）
- Create/Modify: `docs/interview/questions/06-uniapp-miniprogram.md`（≥15 题）

- [ ] **Step 1: AntDV** — 权限模型、动态路由、ProTable 类封装、大数据表格、表单schema、上传/下载、按钮级权限、菜单与缓存页、主题与布局、与后端字典/枚举同步等。

- [ ] **Step 2: Vant H5** — 适配方案、安全区、滚动穿透、弱网、输入框与键盘、路由返回栈、埋点、首屏、与 App WebView 交互等。

- [ ] **Step 3: uni-app / 小程序** — 条件编译、生命周期差异、包体积与分包、登录与 session、授权、rpx、原生组件限制、发布链路、性能、插件/npm、与 Vue3 组合式 API 差异坑。

- [ ] **Step 4: 构建验证**

---

### Task 9: Java 全栈偏前题库

**Files:**

- Create/Modify: `docs/interview/questions/07-java-fullstack.md`

- [ ] **Step 1: 写满不少于 18 题**，严格遵守 spec 边界，覆盖：

Spring Boot 分层、统一响应与错误码、REST 设计、MyBatis-Plus CRUD 与分页、复杂查询与前端筛选联动、JWT/登录态与前端存储、权限码对齐、Redis 使用场景、缓存一致性口语解释、幂等与防重复提交、事务边界、文件上传、导出 Excel、参数校验（Validation）、N+1 / 慢 SQL 排查协作、AI 生成代码审查清单、微服务点到为止（网关对前端影响）、前后端联调排障方法论。

语气：前端主身份能落地的后端表达，不写 JVM 调优长文。

- [ ] **Step 2: 构建验证**

---

### Task 10: Lead + AI vibe coding 题库（AI 写透）

**Files:**

- Create/Modify: `docs/interview/questions/08-architecture-lead.md`（≥15 题）
- Create/Modify: `docs/interview/questions/09-ai-vibe-coding.md`（≥12 题，写透）

- [ ] **Step 1: Lead** — 技术选型、债务治理、估期与砍刀、Code Review、质量门禁、带新人、跨端资源分配、事故复盘、前后端分工、组件库推进、与产品博弈。

- [ ] **Step 2: AI** — 如何拆任务给 AI、提示词结构、Vue+Java 同会话协作、审查清单（安全/越权/幻觉 API）、何时不信任 AI、提升迭代速度的工作流、如何在面试中讲而不贬低专业性、失败案例、与团队规范结合、对交付质量负责的叙事。

- [ ] **Step 3: 构建验证**

---

### Task 11: 手写题 + 前端系统设计

**Files:**

- Create/Modify: `docs/interview/questions/10-handwriting.md`（≥10 题，含可运行级短代码 + 讲解）
- Create/Modify: `docs/interview/questions/11-frontend-system-design.md`（≥6 题）

- [ ] **Step 1: 手写** — 防抖、节流、深拷贝（边界说明）、Promise.all、并发池、发布订阅、`instanceof`、compose/pipe、简易 `reactive`、LRU（可选）、数组扁平、`call/apply/bind` 选编。

- [ ] **Step 2: 系统设计** — 管理后台框架、前端监控、组件库、低代码表单、权限体系、跨端项目治理、配置化列表页等；每题给目标/约束/方案权衡/演进。

- [ ] **Step 3: 构建验证**

---

### Task 12: 项目故事与模拟面试

**Files:**

- Create/Modify: `docs/interview/stories/template.md`
- Create/Modify: `docs/interview/stories/examples.md`
- Create/Modify: `docs/interview/mocks/scripts.md`
- Create/Modify: `docs/interview/mocks/scorecard.md`
- Create/Modify: `docs/interview/mocks/reverse-questions.md`

- [ ] **Step 1: `template.md`** — 完整 STAR-L 模板 + 30 秒 / 2 分钟 / 5 分钟结构说明 + 预埋追问表。

- [ ] **Step 2: `examples.md`** — 三条可替换占位示例：

1. Ant Design Vue 管理后台
2. uni-app / 小程序跨端
3. AI + Java Spring Boot + Vue 全栈快速交付

每条含三时长版本 + ≥3 追问与参考答法。

- [ ] **Step 3: `scripts.md`** — 三套完整模拟流程（业务型 / 创业AI / Lead），含建议耗时与抽题指引（链到题库）。

- [ ] **Step 4: `scorecard.md`** — 评分维度：技术深度、表达结构、决策取舍、AI 协作成熟度、前后端闭环；每项 1–5 分描述。

- [ ] **Step 5: `reverse-questions.md`** — 分类反问（团队现状、工程化、业务、AI 使用、成长空间），标注「慎问」。

- [ ] **Step 6: 构建验证**

---

### Task 13: 首页打磨、README 收尾、全站构建与自检

**Files:**

- Modify: `docs/index.md`
- Modify: `README.md`
- Delete: `docs/interview/questions/_template-snippet.md`（若不想进仓库可删；或移出 docs）
- Modify: 任意仍含「内容建设中」的文件（必须清零）

- [ ] **Step 1: 全文搜索「内容建设中」「TBD」「TODO」「自行组织」并清零**

Run: `rg -n '内容建设中|TBD|TODO|自行组织' docs/interview README.md || true`

Expected: 无业务内容命中（本 plan/spec 目录除外）。

- [ ] **Step 2: 确认每道题都有 `::: details 参考答案`**

Run: 抽样或脚本检查 `docs/interview/questions/*.md` 中 `### Q` 数量与 `::: details 参考答案` 数量大致匹配。

- [ ] **Step 3: 全量构建**

Run: `pnpm docs:build`

Expected: exit 0。

- [ ] **Step 4: `pnpm docs:preview` 手点导航：总览 → 14 天勾选 → Vue3 展开答案 → Java → AI 故事 → 模拟脚本**

- [ ] **Step 5: 更新 README**（徽章可选；必须有启动命令、目录说明、Java 深度边界、建议学习路径）

---

### Task 14:（可选）初始化 git 首提

仅当用户明确要求时执行。

- [ ] **Step 1: `git init`（若尚未初始化）**
- [ ] **Step 2: 按中文 conventional commit 提交**，例如：

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: 初始化前端面试 VitePress 站点与题库

EOF
)"
```

---

## 自检对照 Spec

| Spec 要求                             | 对应 Task    |
| ------------------------------------- | ------------ |
| VitePress 站点 + 忽略 superpowers     | Task 1       |
| 侧重点矩阵 / 总览                     | Task 3       |
| 14/7/30 计划 + localStorage checklist | Task 2、4    |
| 全题有答案；Vue3/工程化/AI 写透       | Task 5–11    |
| Java 全栈偏前模块与边界               | Task 9       |
| 三条故事线 + 模拟/评分/反问           | Task 12      |
| 不做账号后端/算法题海/React 深挖      | 全任务不引入 |
| README 与构建验证                     | Task 13      |

**Placeholder 扫描：** 计划中业务文件不允许残留「内容建设中」——Task 13 强制清零。
**类型/命名一致性：** 计划 `planId` 使用 `14-day` / `7-day` / `30-day`；题号统一 `Q1.` 前缀；路由与 sidebar 使用上表文件名。

---

## 执行方式选择

Plan complete and saved to `docs/superpowers/plans/2026-07-31-frontend-interview-prep.md`. Two execution options:

**1. Subagent-Driven（推荐）** — 每个 Task 开新子代理，Task 间复查，迭代快

**2. Inline Execution** — 本会话按 executing-plans 连续执行，设检查点

你选哪一种？
