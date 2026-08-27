# 资深前端复习模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立复习层：9 篇域速记册、12 篇高频专题讲义、面试前 3 / 7 / 14 天回炉计划，并以题库为唯一真源。

**Architecture:** 复习内容放在 `docs/interview/review/`，不进入 630 题校验集合。导航在「学习路线」后新增「复习」。分五批交付：骨架 → 样板 → 速记补齐 → 专题补齐 → 日程填满与发布。

**Tech Stack:** VitePress、Markdown、现有题库真源、GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-08-27-senior-frontend-review-module-design.md`

---

## 文件结构

| 路径 | 职责 |
| --- | --- |
| `docs/.vitepress/config.ts` | 顶部导航与侧栏「复习」分组 |
| `docs/index.md` / `docs/interview/00-overview.md` / `README.md` | 复习入口与三层分工说明 |
| `docs/interview/review/00-overview.md` | 复习总览 |
| `docs/interview/review/plans/{3,7,14}-day.md` | 临场回炉日程 |
| `docs/interview/review/sheets/01-09-*.md` | 九域速记册 |
| `docs/interview/review/topics/01-12-*.md` | 十二专题讲义 |

**不做：** 不改 `EXPECTED_QUESTION_FILES`；不把复习文计入 630 题；不复用 60 天任务 ID。

---

## 统一模板

### 速记册模板

每个 `sheets/*.md` 必须按此结构写满，禁止占位：

```md
# {域名}速记

> **真源：** 本域题库为唯一真源；冲突时以题库为准。
>
> **用法：** 面试前遮住口述稿先自讲，再对结论卡与追问速答。

## 一句话定位

…

## 核心结论卡

1. **结论：** …
   **边界：** …
   **证据坑位：** （填你自己的项目指标 / 事故，不要抄示例）
2. …（共 12～20 条）

## 高频追问速答

### 1. {追问}
约 80～150 字直接回答。

…（共 6～10 条）

## 反例 / 红线

- …

## 必链题库

- [模块](/interview/questions/…)：Q… / D…
- …

## 5 分钟口述稿

可直接录音的连贯口述（结论先行，含 1 个边界和 1 个证据坑位提示）。
```

篇幅：约 2500～4500 字中文。

### 专题讲义模板

每个 `topics/*.md` 必须按此结构写满：

```md
# {专题名}

> **真源：** 下列题库；版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。

## 战场是什么 / 面试官想听什么

…

## 知识地图

机制链路（可用有序列表或简图文字）。

## 完整讲解

### 1. …
### 2. …
…

## 工程取舍与故障案例模板

约束 → 方案 → 取舍 → 验证 → 复发防护。

## 追问树

1. 主问
   1.1 追问
   1.2 追问
   **收口：** …

## 题库深挖入口

- Q… / D… —— 为什么要回看

## 15 分钟口述验收清单

- [ ] …
```

篇幅：约 4000～8000 字中文。

### 回炉计划日结构

```md
### D{n} — {主题}

任务 ID：`r{3|7|14}-d{n}-{slug}`

#### 学习目标
#### 材料
#### 必做输出
#### 验收标准
```

---

### Task 1：Batch 0 — 导航与骨架页面

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Create: `docs/interview/review/00-overview.md`
- Create: `docs/interview/review/plans/3-day.md`
- Create: `docs/interview/review/plans/7-day.md`
- Create: `docs/interview/review/plans/14-day.md`
- Create: 全部 `sheets/*.md` 与 `topics/*.md` 的骨架页（标题 + 结构标题 + 「正文见后续批次」仅允许在 Batch 0，且必须在 Batch 2/3 删除该句）
- Modify: `docs/index.md`、`docs/interview/00-overview.md`、`README.md`

- [ ] **Step 1：更新顶部导航**

在 `nav` 中于「60 天路线」后插入：

```ts
{ text: '复习', link: '/interview/review/00-overview' },
```

- [ ] **Step 2：在「学习路线」后插入侧栏「复习」分组**

侧栏 items 必须覆盖规格第 4.1 节全部链接（总览、3/7/14 天、9 速记、12 专题）。速记与专题可用 `collapsed: true` 子组。

- [ ] **Step 3：写复习总览**

`00-overview.md` 必须写清：

- 三层分工（学习路线 / 题库 / 复习）；
- 真源规则；
- 9 速记与 12 专题索引表（全部链到真实路径）；
- 何时用 3 / 7 / 14 天；
- 与 60 天路线的关系。

- [ ] **Step 4：写 3 / 7 / 14 天计划骨架**

每份包含：适合场景、每日时长 90～150 分钟、完成标准、阶段总览表、D1… 日标题与任务 ID 前缀约定。Batch 0 允许「材料」列先写将要链接的速记/专题路径；具体题号与口述任务在 Task 5 填满。

任务 ID 示例（必须使用新前缀）：

- 3 天：`r3-d1-sheet-scan`、`r3-d2-story-mock`、`r3-d3-final`
- 7 天：`r7-d1-…` … `r7-d7-…`
- 14 天：`r14-d1-…` … `r14-d14-…`

- [ ] **Step 5：创建全部 sheets / topics 骨架文件**

文件名必须与规格一致：

```text
sheets/01-web-fundamentals.md
sheets/02-framework-data.md
sheets/03-engineering-quality.md
sheets/04-admin-business.md
sheets/05-mobile-cross.md
sheets/06-architecture.md
sheets/07-devops.md
sheets/08-fullstack-ai.md
sheets/09-leadership.md
topics/01-js-runtime.md
topics/02-ts-types.md
topics/03-browser-rendering.md
topics/04-network-security.md
topics/05-vue-reactivity.md
topics/06-nuxt-ssr.md
topics/07-vite-webpack.md
topics/08-perf-testing.md
topics/09-microfrontend-architecture.md
topics/10-fullstack-data.md
topics/11-hybrid-miniapp-h5.md
topics/12-lead-behavioral.md
```

Batch 0 骨架页只需 H1 + 模板二级标题 + 一句「本页正文在后续批次写满」。不得使用 `TODO` / `待补充` 字样（避免与题库占位扫描混淆）；可用「正文待本批次后的扩写任务完成」。

- [ ] **Step 6：更新首页、总览、README 入口**

三处增加：

- 临场回炉 → `/interview/review/00-overview`
- 明确「长期备战走 60 天，临场走复习模块」

不改 630 题统计数字。

- [ ] **Step 7：构建验证**

```bash
pnpm docs:build
```

Expected：exit 0，无死链。

- [ ] **Step 8：提交**

```bash
git add docs/.vitepress/config.ts docs/index.md docs/interview/00-overview.md README.md docs/interview/review
git commit -m "docs: 新增复习模块导航与骨架"
```

---

### Task 2：Batch 1 — 样板速记与样板专题

**Files:**
- Modify: `docs/interview/review/sheets/02-framework-data.md`
- Modify: `docs/interview/review/topics/05-vue-reactivity.md`

- [ ] **Step 1：写满框架与数据速记**

真源：`02-vue3`、`23-nuxt`、`24-vite`、`25-webpack`。

必须覆盖：Vue3 响应式边界、Nuxt 渲染模式与 hydration、Vite 8 / Rolldown 口径、Webpack 5 选型边界。删除骨架占位句。满足速记模板全部章节，12～20 条结论卡，6～10 条追问速答，5 分钟口述稿。

- [ ] **Step 2：写满 Vue3 响应式与渲染专题**

真源：以 `02-vue3` 为主。

必须覆盖：proxy / ref、调度与 flush、编译与 patch、keyed diff、KeepAlive / Suspense 边界、SSR 水合。删除骨架占位句。满足专题模板全部章节，含追问树与 15 分钟验收清单。

- [ ] **Step 3：口径核对**

对照题库确认：

- 不把 Vite 8 写成「生产一定是 Rollup」；
- Suspense / KeepAlive / SSR 表述不与 `02-vue3` 冲突。

- [ ] **Step 4：构建**

```bash
pnpm docs:build
```

- [ ] **Step 5：提交**

```bash
git add docs/interview/review/sheets/02-framework-data.md docs/interview/review/topics/05-vue-reactivity.md
git commit -m "docs: 完成复习模块样板速记与专题"
```

---

### Task 3：Batch 2 — 补齐其余 8 篇速记

**Files:**
- Modify: `docs/interview/review/sheets/01-web-fundamentals.md`
- Modify: `docs/interview/review/sheets/03-engineering-quality.md`
- Modify: `docs/interview/review/sheets/04-admin-business.md`
- Modify: `docs/interview/review/sheets/05-mobile-cross.md`
- Modify: `docs/interview/review/sheets/06-architecture.md`
- Modify: `docs/interview/review/sheets/07-devops.md`
- Modify: `docs/interview/review/sheets/08-fullstack-ai.md`
- Modify: `docs/interview/review/sheets/09-leadership.md`

每篇按速记模板写满，真源映射：

| 文件 | 真源 |
| --- | --- |
| 01 | 01 / 16 / 17 / 18 / 10 |
| 03 | 03 / 20 / 21 + AI 指南 |
| 04 | 04 / 05 |
| 05 | 06 / 19 |
| 06 | 14 / 11 / 12 |
| 07 | 26 + devops 教程 |
| 08 | 07 / 13 / 15 / 09 |
| 09 | 08 / 22 + 简历 / 模拟 |

- [ ] **Step 1：写 01、03、04**
- [ ] **Step 2：构建一次** `pnpm docs:build`
- [ ] **Step 3：写 05、06、07**
- [ ] **Step 4：写 08、09**
- [ ] **Step 5：确认 9 篇均无扩写占位句**

```bash
rg -n "正文待|待本批次|TODO|待补充|内容建设中" docs/interview/review/sheets
```

Expected：无匹配。

- [ ] **Step 6：构建并提交**

```bash
pnpm docs:build
git add docs/interview/review/sheets
git commit -m "docs: 补齐九大能力域速记册"
```

---

### Task 4：Batch 3 — 补齐其余 11 篇专题

**Files:**
- Modify: `topics/01-js-runtime.md` … `12-lead-behavioral.md`（除已完成的 `05-vue-reactivity.md`）

真源映射按规格第 5.2 节。每篇满足专题模板，4000～8000 字量级，含追问树与验收清单。

建议执行顺序（降低依赖）：

1. `01-js-runtime`、`02-ts-types`
2. `03-browser-rendering`、`04-network-security`
3. `06-nuxt-ssr`、`07-vite-webpack`
4. `08-perf-testing`、`09-microfrontend-architecture`
5. `10-fullstack-data`、`11-hybrid-miniapp-h5`、`12-lead-behavioral`

- [ ] **Step 1：完成顺序 1～2 的四篇**
- [ ] **Step 2：`pnpm docs:build`**
- [ ] **Step 3：完成顺序 3～4 的四篇**
- [ ] **Step 4：完成顺序 5 的三篇**
- [ ] **Step 5：扫描占位**

```bash
rg -n "正文待|待本批次|TODO|待补充|内容建设中" docs/interview/review/topics
```

Expected：无匹配。

- [ ] **Step 6：版本口径抽查**

至少人工确认文中：

- Vite 8 + Rolldown / Oxc；
- Nuxt 4.5 / Nitro；
- Prisma 7 / NestJS 11（若出现）；
- MF 内置 vs 独立 2.0 区分（若出现）。

- [ ] **Step 7：构建并提交**

```bash
pnpm docs:build
git add docs/interview/review/topics
git commit -m "docs: 补齐十二高频专题讲义"
```

---

### Task 5：Batch 4 — 填满回炉计划并发布

**Files:**
- Modify: `docs/interview/review/plans/3-day.md`
- Modify: `docs/interview/review/plans/7-day.md`
- Modify: `docs/interview/review/plans/14-day.md`
- Modify: `docs/interview/review/00-overview.md`（若索引需更新）
- Modify: `README.md`（可选：目录说明增加 `review/`）

- [ ] **Step 1：填满 3 天**

每天含目标 / 材料（真实速记与专题链接）/ 必做输出 / 验收。覆盖：速记扫读、主故事、至少 1 场模拟脚本链接。

- [ ] **Step 2：填满 7 天**

覆盖：薄弱域速记、至少 2 个专题、1～2 场模拟、卡点回炉。

- [ ] **Step 3：填满 14 天**

覆盖：九域速记各至少一次、高频专题轮转、终场模拟（脚本十一或等价）。

- [ ] **Step 4：任务 ID 冲突检查**

```bash
rg -o "r(3|7|14)-d[0-9]+-[a-z0-9-]+" docs/interview/review/plans | sort | uniq -d
```

Expected：无重复 `r*` ID。

- [ ] **Step 5：全站构建与题库门禁回归**

```bash
pnpm docs:validate:test
pnpm docs:validate:followups
MIN_TOTAL_QUESTIONS=620 MAX_TOTAL_QUESTIONS=640 EXPECTED_TOTAL_QUESTIONS=630 pnpm docs:check:followups
git diff --check
```

Expected：题量仍为 630；复习页构建成功。

- [ ] **Step 6：提交**

```bash
git add docs/interview/review README.md
git commit -m "docs: 填满面试前复习回炉计划"
```

- [ ] **Step 7：合并推送并验证 Pages**

```bash
git push origin HEAD
gh run list --workflow="Deploy docs to GitHub Pages" --limit 1
```

线上抽检：

- https://julytian.github.io/mianshi/interview/review/00-overview
- 任一篇 sheet、任一篇 topic、任一日程

---

### Task 6：内容一致性抽检

**Files:** 仅修正发现问题的复习文

- [ ] **Step 1：抽检真源一致性**

每域至少抽 2 条结论卡对照题库；每专题至少抽 1 个版本敏感陈述。

- [ ] **Step 2：抽检链接与构建**

```bash
pnpm docs:build
```

- [ ] **Step 3：若有修正则提交**

```bash
git add docs/interview/review
git commit -m "docs: 完成复习模块内容审查"
```

无修正则不空提交。

---

## 规格覆盖自检

| 规格项 | 任务 |
| --- | --- |
| 导航与文件布局 | Task 1 |
| 三层分工与真源 | Task 1 总览 + Task 2/3/4 写作约束 |
| 9 速记结构 | Task 2 + Task 3 |
| 12 专题结构 | Task 2 + Task 4 |
| 3 / 7 / 14 天 | Task 1 骨架 + Task 5 填满 |
| 不进 630 门禁 | Task 1 / 5 验证命令 |
| 发布验收 | Task 5 Step 7 + Task 6 |
