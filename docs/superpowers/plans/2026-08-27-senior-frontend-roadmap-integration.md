# 资深前端完整路线与站点整合实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 22 个题库、550 道主问题及全部追问答案整合为八大能力域，新增可执行的 60 天主线，并启用最终 CI 和 GitHub Pages 发布门禁。

**Architecture:** 题库文件编号保持稳定，展示层按能力域重新组织；60 天路线成为默认完整主线，7 / 14 / 30 天作为压缩方案；总览、首页、模拟材料、README、CI 使用同一组统计口径。

**Tech Stack:** VitePress、Markdown、TypeScript 配置、Node.js 校验器、GitHub Actions、GitHub Pages。

---

## 执行依赖

开始前必须完成：

1. `2026-08-27-senior-frontend-new-modules.md` 全部任务；
2. `2026-08-27-followup-answers.md` 全部任务；
3. 本地全量结果为 22 文件、550 主问题、所有追问已回答。

---

### Task 1：按八大能力域重构导航

**Files:**
- Modify: `docs/.vitepress/config.ts`

- [ ] **Step 1：更新顶部导航**

顶部导航调整为：

```ts
nav: [
  { text: '总览', link: '/interview/00-overview' },
  { text: '60 天路线', link: '/interview/plans/60-day' },
  { text: '题库', link: '/interview/questions/01-js-ts' },
  { text: '模拟面试', link: '/interview/mocks/scripts' },
  { text: '简历', link: '/interview/resume/senior-frontend-guide' },
]
```

- [ ] **Step 2：重建侧边栏能力域**

保持「开始」「学习路线」在顶部，然后使用以下分组和顺序：

1. **Web 与计算机基础**
   - 01 JS / TS
   - 16 HTML / CSS / 可访问性
   - 17 浏览器与 Web API
   - 18 网络与 Web 安全
   - 10 手写题
2. **框架与状态管理**
   - 02 Vue3
3. **工程与质量**
   - 03 工程化
   - 20 性能与用户体验
   - 21 测试与质量保障
   - AI 编程实践五篇指南
4. **后台与业务前端**
   - 04 Ant Design Vue
   - 05 Vant H5
5. **移动端与跨平台**
   - 06 uni-app / 小程序
   - 19 Hybrid App
6. **架构与系统设计**
   - 14 前端架构
   - 11 前端系统设计
   - 12 微前端
7. **全栈、数据与 AI**
   - 07 Java 全栈偏前
   - 13 NestJS
   - 15 数据库与 Prisma
   - NestJS + Prisma 教程
   - 09 AI / vibe coding
8. **领导力与求职**
   - 08 架构 / Lead
   - 22 项目答辩与行为面试
   - 简历套件
   - 故事、模拟、评分和反问

- [ ] **Step 3：加入四条学习路线**

「学习路线」顺序：

1. 60 天完整主线；
2. 30 天强化版；
3. 14 天冲刺版；
4. 7 天压缩版。

- [ ] **Step 4：检查配置和死链**

确保没有 `ignoreDeadLinks: true`，执行：

```bash
pnpm docs:build
```

- [ ] **Step 5：提交**

```bash
git add docs/.vitepress/config.ts
git commit -m "docs: 按八大能力域重构站点导航"
```

---

### Task 2：编写 60 天完整复习主线

**Files:**
- Create: `docs/interview/plans/60-day.md`
- Modify: `docs/interview/plans/7-day.md`
- Modify: `docs/interview/plans/14-day.md`
- Modify: `docs/interview/plans/30-day.md`

- [ ] **Step 1：建立路线执行规则**

文首说明：

- 每天 60～120 分钟；
- Q 题用遮答案口述，D 题绑定项目证据；
- 每周 5 天学习、1 天输出、1 天模拟 / 复盘；
- 每周至少 2 次手写或系统设计输出；
- 每日完成标准是“可口述 + 有输出 + 记录卡点”，不是阅读完成；
- 60 天不是 550 题顺序通刷，而是按岗位权重抽题。

- [ ] **Step 2：按日编写 D1～D60**

每一天必须包含：

```md
### D1 — 主题

#### 学习目标
#### 题库与材料
#### 必做输出
#### 验收标准
```

使用以下唯一日标识和主题，不复用 7 / 14 / 30 天旧任务 ID：

```text
d01-js-runtime          d02-js-async           d03-ts-type-system
d04-ts-engineering      d05-html-semantics     d06-css-layout
d07-css-architecture    d08-a11y-stage-review
d09-browser-rendering   d10-browser-events     d11-browser-storage
d12-worker-pwa          d13-network-protocol   d14-http-cache
d15-web-security        d16-web-stage-mock
d17-vue-reactivity      d18-vue-scheduler      d19-vue-renderer
d20-vue-component       d21-vue-state          d22-vue-performance
d23-vue-ssr             d24-vue-stage-mock
d25-vite-build          d26-ci-release         d27-testing-unit
d28-testing-e2e         d29-performance-metrics d30-performance-diagnosis
d31-observability       d32-quality-stage-mock
d33-admin-form          d34-admin-table        d35-admin-permission
d36-admin-platform      d37-vant-mobile        d38-h5-weak-network
d39-business-stage-mock
d40-mini-runtime        d41-mini-performance   d42-mini-release
d43-hybrid-bridge       d44-hybrid-lifecycle   d45-hybrid-performance
d46-cross-platform-mock
d47-mysql-index         d48-mysql-transaction  d49-prisma
d50-nestjs              d51-java-ai-delivery   d52-fullstack-stage-mock
d53-frontend-architecture d54-system-design    d55-microfrontend
d56-architecture-failure d57-architecture-mock
d58-lead-behavior       d59-resume-project     d60-final-interview
```

- [ ] **Step 3：落实阶段输出**

至少包含：

- D8：HTML / CSS / A11y 审计清单；
- D16：浏览器、网络、安全和手写模拟；
- D24：Vue 专项模拟；
- D32：质量门禁与性能治理方案；
- D39：后台 / H5 业务案例；
- D46：小程序 / Hybrid 选型与 Bridge 方案；
- D52：NestJS + Prisma 最小闭环；
- D57：端到端系统设计；
- D60：75 分钟综合模拟和九维评分。

- [ ] **Step 4：更新压缩路线定位**

在 7 / 14 / 30 天文首增加：

- 指向 60 天完整主线；
- 当前路线适合的准备时间；
- 从 60 天裁剪时保留哪些核心模块；
- 新增题库的最小覆盖方式。

不得简单把 60 天每天机械合并。

- [ ] **Step 5：验证并提交**

```bash
pnpm docs:build
git add docs/interview/plans
git commit -m "docs: 新增资深前端 60 天完整复习路线"
```

---

### Task 3：统一首页、总览和 README

**Files:**
- Modify: `docs/index.md`
- Modify: `docs/interview/00-overview.md`
- Modify: `README.md`

- [ ] **Step 1：更新统一统计口径**

三处统一展示：

- 8 个能力域；
- 22 个题库；
- 339 道 Q；
- 211 道 D；
- 550 道主问题；
- 所有主问题和追问均有答案；
- 7 / 14 / 30 / 60 天四条路线。

- [ ] **Step 2：更新总览能力矩阵**

矩阵至少包含：

- 能力域；
- 对应题库；
- Senior / Staff / Tech Lead / 前端偏全栈岗位权重；
- 复习优先级；
- 建议项目证据。

不要把 550 题描述为必须全部背诵。

- [ ] **Step 3：更新入口和推荐路径**

首页提供：

1. 第一次使用：总览 → 自测 → 60 天路线；
2. 14 天内面试：14 天路线；
3. 专项补弱：按八大能力域进入；
4. 面试前 24 小时：故事、行为题、模拟和反问；
5. 全栈补强：NestJS → 数据库与 Prisma → 实战教程。

- [ ] **Step 4：更新 README 开发与校验命令**

README 暂时写入最终命令，CI 在 Task 6 启用：

```bash
pnpm docs:dev
pnpm docs:validate:test
pnpm docs:validate:followups
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 pnpm docs:check:followups
```

- [ ] **Step 5：验证并提交**

```bash
pnpm docs:build
git add docs/index.md docs/interview/00-overview.md README.md
git commit -m "docs: 统一完整面试路线入口与统计口径"
```

---

### Task 4：扩展模拟面试脚本

**Files:**
- Modify: `docs/interview/mocks/scripts.md`
- Modify: `docs/interview/mocks/scorecard.md`
- Modify: `docs/interview/mocks/reverse-questions.md`

- [ ] **Step 1：新增四场专项脚本**

每场包含时间分配、问题顺序、追问分支和结束标准：

1. 60 分钟 Web 基础与安全；
2. 60 分钟 Hybrid App 与跨端；
3. 60 分钟性能、测试与质量；
4. 60 分钟项目答辩与行为面试。

保留现有 Vue、微前端、NestJS、前端架构和综合场。

- [ ] **Step 2：新增 75 分钟终场脚本**

时间分配：

- 5 分钟自我介绍；
- 15 分钟项目深挖；
- 15 分钟 Vue / Web 原理；
- 15 分钟系统设计；
- 10 分钟故障与质量治理；
- 10 分钟行为与领导力；
- 5 分钟反问。

根据目标岗位提供 Senior、Staff / 架构、Tech Lead、前端偏全栈四种抽题映射。

- [ ] **Step 3：校准九维评分**

评分维度：

1. 正确性；
2. 原理深度；
3. 工程落地；
4. 架构约束；
5. 故障治理；
6. 演进能力；
7. 业务价值；
8. 领导力；
9. 表达与证据。

规则：

- 未考察维度从分母移除；
- 综合场至少覆盖 7 个维度；
- 正确性或诚信触发红线时不得被总分抵消；
- 给出归一化公式和 60 / 75 / 85 分解释；
- 评分项必须能记录证据，不能只凭印象。

- [ ] **Step 4：更新反问清单**

增加：

- AI 产品和数据合规；
- Web / Hybrid 技术边界；
- 质量 SLO 与事故机制；
- 架构决策权和跨团队协作；
- 岗位实际全栈比例。

- [ ] **Step 5：验证锚点并提交**

```bash
pnpm docs:build
git add docs/interview/mocks
git commit -m "docs: 扩展完整路线模拟面试与评分体系"
```

逐个点击或检查脚本中的 VitePress 锚点，禁止凭标题猜测 slug。

---

### Task 5：执行全内容一致性审查

**Files:**
- Modify: 所有审查发现问题的文档

- [ ] **Step 1：审查模块边界**

检查：

- 浏览器渲染不重复 Vue 调度；
- 网络安全不重复业务权限；
- 性能不重复构建工具配置；
- Hybrid 不重复普通 H5 和小程序；
- 项目行为题不重复 Lead 方法论；
- 数据库 / Prisma 不重复 NestJS 请求生命周期。

- [ ] **Step 2：审查跨文档事实**

核对：

- 题量统计；
- 版本基线；
- NestJS 生命周期；
- Prisma 命令和事务语义；
- WebView 安全与热更新边界；
- Core Web Vitals；
- OAuth / OIDC / PKCE；
- 所有站内链接与标题锚点。

- [ ] **Step 3：审查可学习性**

抽取每个能力域至少 5 道题口述，确认：

- Q 题可在 1～2 分钟回答；
- D 题有约束、方案、取舍、故障和演进；
- 追问答案直接回应，不复述主答案；
- 行为题不编造用户经历；
- 路线每日任务在 60～120 分钟内可完成。

- [ ] **Step 4：提交审查修正**

```bash
git add docs
git commit -m "docs: 完成资深前端完整路线内容审查"
```

若无修正，不创建空提交。

---

### Task 6：启用最终 CI 门禁

**Files:**
- Modify: `.github/workflows/deploy-docs.yml`
- Modify: `package.json`
- Modify: `scripts/validate-question-bank.mjs`
- Modify: `scripts/validate-question-bank.test.mjs`

- [ ] **Step 1：锁定 22 文件集合**

测试必须验证：

- 缺任意 01～22 文件时失败；
- 多出伪题库文件时失败；
- 顺序变化不影响集合判断；
- 精确 550 通过，549 / 551 失败；
- 任一追问缺答案、错号、错标题或过短时失败。

- [ ] **Step 2：确认 package scripts**

最终保留：

```json
{
  "docs:validate": "node scripts/validate-question-bank.mjs",
  "docs:validate:test": "node scripts/validate-question-bank.test.mjs",
  "docs:validate:followups": "node scripts/validate-question-bank.mjs --require-followups",
  "docs:check": "pnpm docs:validate && pnpm docs:build",
  "docs:check:followups": "pnpm docs:validate:followups && pnpm docs:build"
}
```

- [ ] **Step 3：更新 GitHub Actions**

Build job 使用：

```yaml
- name: Test question bank validator
  run: pnpm docs:validate:test

- name: Build
  run: >
    MIN_TOTAL_QUESTIONS=540
    MAX_TOTAL_QUESTIONS=560
    EXPECTED_TOTAL_QUESTIONS=550
    pnpm docs:check:followups
```

- [ ] **Step 4：本地复现 CI**

```bash
pnpm install --frozen-lockfile
pnpm docs:validate:test
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 \
pnpm docs:check:followups
git diff --check
```

- [ ] **Step 5：提交**

```bash
git add .github/workflows/deploy-docs.yml package.json scripts
git commit -m "ci: 启用 550 题与追问答案发布门禁"
```

---

### Task 7：最终审查、部署与线上验收

**Files:**
- Modify: 最终审查发现问题的文件

- [ ] **Step 1：独立审查完整分支**

审查 `master...HEAD`：

- 规格：8 域、22 库、550 题、60 天路线、全部追问答案；
- 技术：版本和平台事实；
- 安全：认证、Bridge、AI 工具和供应链；
- 教学：答案可口述、路线可执行；
- 站点：导航、搜索、死链、移动端阅读。

修复全部 Critical 和 Important。

- [ ] **Step 2：最终本地验证**

```bash
pnpm docs:validate:test
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 \
pnpm docs:check:followups
git diff --check master...HEAD
git status --short
```

保留构建耗时和输出规模，和扩展前基线比较；若本地搜索索引过大，先定位再决定是否调整搜索配置，不删除内容规避问题。

- [ ] **Step 3：提交最终修正**

若有修正：

```bash
git add .
git commit -m "docs: 完成资深前端备战大全最终验收"
```

- [ ] **Step 4：合并并推送**

按照 `superpowers:finishing-a-development-branch` 检查后执行；未经用户确认不擅自推送。

- [ ] **Step 5：观察 GitHub Pages**

确认 workflow build 和 deploy 均成功。失败时先读取具体 job 日志并修复根因，不绕过校验。

- [ ] **Step 6：线上抽检**

访问 `https://julytian.github.io/mianshi/`，检查：

- 首页和总览；
- 60 天路线；
- 新增 15～22 八个题库；
- NestJS + Prisma 教程；
- 追问折叠区；
- 搜索；
- 桌面端和移动端侧边栏；
- 站内链接与上一页 / 下一页。

记录最终线上 URL 和 workflow 结果。
