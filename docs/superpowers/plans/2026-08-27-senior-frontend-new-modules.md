# 资深前端新增能力模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 15～22 八个题库和 NestJS + Prisma 教程，将主问题从 382 扩展到精确 550，并为每道新题同时提供主答案和追问答案。

**Architecture:** 每个模块独立成一个 Markdown 题库，基础题在前、深层题在后；每完成一个模块就把文件加入校验器精确集合并执行单文件追问门禁。模块之间通过边界说明和交叉链接避免重复，最终统一做技术事实审查。

**Tech Stack:** Markdown、VitePress、Node.js 校验脚本、MySQL、Prisma、NestJS、Web Platform API。

---

## 执行依赖

开始本计划前，只需先完成 `2026-08-27-followup-answers.md` 的 Task 1，确保 `--require-followups` 和 `--followup-files` 已可用。本计划完成后返回该计划执行 Task 2～16，再执行站点整合计划。

---

## 统一题目格式

每个 Q 题必须包含：

```md
### Q1. 题目

**考察点：** 具体能力。

::: details 参考答案

可口述的完整答案。

:::

**追问：** 进一步问题？

::: details 追问参考答案

约 100～200 字的直接答案、依据和工程边界。

:::
```

每个 D 题必须包含：

```md
### D1. 深层题目

::: details 参考答案

#### 基础结论
#### 原理深挖
#### 工程场景
#### 反例 / 踩坑
#### 资深回答模板

:::

**追问链：**
1. 追问一？
2. 追问二？
3. 追问三？

::: details 追问参考答案

**1. 追问一？**

完整答案。

**2. 追问二？**

完整答案。

**3. 追问三？**

完整答案。

:::
```

---

### Task 1：新增数据库与 Prisma 题库

**Files:**
- Create: `docs/interview/questions/15-database-prisma.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 17 道 Q 题**

按以下顺序编写：

1. MySQL 常用数据类型与金额、时间、JSON 选择。
2. 主键、唯一键、外键和业务唯一性。
3. JOIN 类型及结果集膨胀。
4. 子查询、CTE 和窗口函数的适用边界。
5. B+ Tree 索引及其适合范围查询的原因。
6. 联合索引与最左匹配。
7. 覆盖索引、回表和索引下推。
8. `EXPLAIN` 的访问类型、key、rows、Extra。
9. 深分页、游标分页和稳定排序。
10. ACID 与事务边界。
11. 隔离级别、脏读、不可重复读和幻读。
12. MVCC、快照读与当前读。
13. 行锁、间隙锁、死锁和锁等待。
14. 连接池、超时和连接泄漏。
15. Prisma Schema、Model、Relation 和 Client。
16. Prisma `select`、`include`、分页和关系查询。
17. Prisma Migration、Seed 和生产部署。

- [ ] **Step 2：创建 10 道 D 题**

按以下主题编写：

1. 从查询模式设计联合索引。
2. 使用 `EXPLAIN ANALYZE` 定位慢查询。
3. 高并发库存扣减与锁策略。
4. 死锁复现、诊断和重试边界。
5. 大表分页和数据导出。
6. Prisma N+1 与关系加载治理。
7. Prisma 批量事务、交互式事务和外部调用边界。
8. Prisma 迁移的 expand-and-contract 发布。
9. 连接池耗尽、Serverless 和 PgBouncer / 数据库代理边界。
10. 多租户、原生 SQL、参数化查询和越权防护。

- [ ] **Step 3：更新精确文件集合**

在 `EXPECTED_QUESTION_FILES` 末尾增加：

```js
'15-database-prisma.md',
```

- [ ] **Step 4：验证 409 题和追问答案**

```bash
MIN_TOTAL_QUESTIONS=400 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=409 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=15-database-prisma.md
pnpm docs:build
```

Expected：`Q=17 D=10 total=27`，追问全部回答。

- [ ] **Step 5：提交**

```bash
git add docs/interview/questions/15-database-prisma.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增数据库与 Prisma 面试题库"
```

---

### Task 2：新增 NestJS + Prisma 实战教程

**Files:**
- Create: `docs/interview/guides/backend/nestjs-prisma.md`
- Modify: `docs/interview/questions/13-nestjs.md`
- Modify: `docs/interview/questions/15-database-prisma.md`

- [ ] **Step 1：核对当前 Prisma 官方基线**

查询 Prisma 和 NestJS 官方文档，记录：

- 当前 Prisma major 与 Node.js 支持范围；
- 当前生成器、数据库驱动和 Client 初始化方式；
- `migrate dev` 与 `migrate deploy`；
- 批量事务与交互式事务；
- 已弃用中间件、Preview 能力和扩展 API。

禁止从旧教程直接复制版本敏感配置。

- [ ] **Step 2：编写完整教程**

教程章节：

1. 环境与依赖。
2. 初始化 Prisma 和连接 MySQL。
3. Schema、User / Role / Order 示例关系。
4. 生成 Client 和迁移。
5. NestJS `PrismaModule` / `PrismaService`。
6. CRUD、DTO 映射、`select` / `include`。
7. 游标分页和 N+1。
8. 批量事务与交互式事务。
9. Prisma 错误到 HTTP 错误契约的映射。
10. 日志、慢查询、连接池和健康检查。
11. Seed、测试数据库和集成测试。
12. `migrate deploy`、灰度、回滚和生产检查。
13. 原生 SQL、参数化查询和多租户。

至少提供可复制的：

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

以及 CRUD、事务、分页、错误映射和测试示例。代码必须与核对后的 Prisma 版本一致。

- [ ] **Step 3：增加双向链接**

- `13-nestjs.md` 文首链接教程和数据库题库。
- `15-database-prisma.md` 文首链接 NestJS 题库和教程。

- [ ] **Step 4：验证并提交**

```bash
pnpm docs:build
git add docs/interview/guides/backend/nestjs-prisma.md \
  docs/interview/questions/13-nestjs.md \
  docs/interview/questions/15-database-prisma.md
git commit -m "docs: 新增 NestJS Prisma 实战教程"
```

---

### Task 3：新增 HTML / CSS / 可访问性题库

**Files:**
- Create: `docs/interview/questions/16-html-css-a11y.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 12 道 Q 题**

主题：

1. 语义化 HTML 与文档结构。
2. 表单 label、错误和自动填充。
3. 图片、`srcset`、`sizes` 和媒体。
4. 层叠、优先级、继承和 cascade layers。
5. BFC、包含块和格式化上下文。
6. Flex 布局边界。
7. Grid 布局边界。
8. 定位与层叠上下文。
9. 响应式、容器查询和逻辑属性。
10. CSS 自定义属性、主题和暗色模式。
11. 键盘、焦点和可访问名称。
12. ARIA 使用原则与常见误用。

- [ ] **Step 2：创建 8 道 D 题**

主题：

1. 复杂后台布局和自适应策略。
2. Modal / Menu / Combobox 的可访问性。
3. 大量 CSS 的架构与作用域治理。
4. `contain`、`content-visibility` 和渲染成本。
5. RTL、国际化和逻辑属性。
6. 设计系统 Token 与 CSS 变量。
7. 移动端安全区、键盘和视口。
8. WCAG 审计、自动化与人工测试。

- [ ] **Step 3：加入文件集合并验证 429 题**

在 `EXPECTED_QUESTION_FILES` 增加 `16-html-css-a11y.md`，执行：

```bash
MIN_TOTAL_QUESTIONS=420 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=429 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=16-html-css-a11y.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/16-html-css-a11y.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增 HTML CSS 与可访问性题库"
```

---

### Task 4：新增浏览器与 Web API 题库

**Files:**
- Create: `docs/interview/questions/17-browser-web-api.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 12 道 Q 题**

主题：导航与渲染流水线、DOM 与事件、Observer API、Storage / IndexedDB / Cookie、History、Page Lifecycle、BFCache、Worker、Service Worker、BroadcastChannel、Web Components、PWA。

- [ ] **Step 2：创建 8 道 D 题**

主题：

1. 从 URL 到可交互的完整链路。
2. Event Loop、渲染机会和长任务。
3. 内存泄漏与 DevTools 诊断。
4. 多标签页状态同步。
5. 离线缓存和 Service Worker 更新。
6. BFCache 兼容与页面恢复。
7. Worker 任务拆分和数据复制成本。
8. Web API 兼容性、权限和渐进增强。

- [ ] **Step 3：加入文件集合并验证 449 题**

```bash
MIN_TOTAL_QUESTIONS=440 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=449 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=17-browser-web-api.md
pnpm docs:build
```

Expected：更新 `EXPECTED_QUESTION_FILES` 后，`Q=12 D=8 total=20`。

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/17-browser-web-api.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增浏览器与 Web API 题库"
```

---

### Task 5：新增网络与 Web 安全题库

**Files:**
- Create: `docs/interview/questions/18-network-security.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 14 道 Q 题**

主题：DNS、TCP / TLS、HTTP/1.1、HTTP/2、HTTP/3、缓存、CDN、Cookie / Session / Token、CORS、CSRF、XSS、CSP、OAuth / OIDC + PKCE、安全响应头。

- [ ] **Step 2：创建 9 道 D 题**

主题：

1. 页面请求链路与网络排障。
2. 缓存一致性和版本发布。
3. 登录与 Token 刷新安全。
4. XSS、CSP、Trusted Types 治理。
5. CSRF 与 Cookie 凭证模型。
6. 第三方脚本、SRI 和供应链。
7. 上传、下载和内容嗅探安全。
8. WebSocket / SSE 的鉴权、重连和限流。
9. 前端安全事件响应与日志证据。

- [ ] **Step 3：加入文件集合并验证 472 题**

```bash
MIN_TOTAL_QUESTIONS=460 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=472 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=18-network-security.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/18-network-security.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增网络与 Web 安全题库"
```

---

### Task 6：新增 Hybrid App 题库

**Files:**
- Create: `docs/interview/questions/19-hybrid-app.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 13 道 Q 题**

主题：

1. Hybrid App 架构与适用场景。
2. WebView 与系统浏览器差异。
3. JSBridge 请求响应协议。
4. Bridge 版本协商和能力探测。
5. Android / iOS 生命周期。
6. 返回栈和路由同步。
7. Cookie、Session 和 SSO。
8. 相机、定位、文件和权限。
9. 上传、下载和本地文件。
10. Web 资源缓存与更新。
11. 调试、日志和崩溃关联。
12. uni-app App、Capacitor、Cordova。
13. 签名、应用商店和热更新合规。

- [ ] **Step 2：创建 9 道 D 题**

主题：

1. 可演进 JSBridge 设计。
2. Bridge 安全与不可信 Web 内容隔离。
3. 启动白屏、WebView 池和预加载。
4. 前后台、进程回收和状态恢复。
5. 原生插件兼容、灰度和降级。
6. Hybrid 网络代理、证书和抓包边界。
7. 跨端监控、trace 和故障归因。
8. 热更新、资源签名、回滚和商店政策。
9. Hybrid / PWA / RN / Flutter / 原生选型。

- [ ] **Step 3：加入文件集合并验证 494 题**

```bash
MIN_TOTAL_QUESTIONS=480 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=494 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=19-hybrid-app.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/19-hybrid-app.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增 Hybrid App 面试题库"
```

---

### Task 7：新增性能与用户体验题库

**Files:**
- Create: `docs/interview/questions/20-performance-ux.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 12 道 Q 题**

主题：Core Web Vitals、RUM / Lab、性能预算、加载优先级、Bundle / Chunk、图片、字体、第三方脚本、长任务、内存、Vue 大列表、性能告警。

- [ ] **Step 2：创建 8 道 D 题**

主题：

1. 建立体验 SLI / SLO。
2. 首屏性能端到端治理。
3. INP 与长任务诊断。
4. 大表格和响应式降级。
5. 内存泄漏和长期会话。
6. 第三方资源隔离。
7. 性能回归门禁和灰度。
8. 性能指标与业务结果关联。

- [ ] **Step 3：加入文件集合并验证 514 题**

```bash
MIN_TOTAL_QUESTIONS=500 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=514 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=20-performance-ux.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/20-performance-ux.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增性能与用户体验题库"
```

---

### Task 8：新增测试与质量保障题库

**Files:**
- Create: `docs/interview/questions/21-testing-quality.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 11 道 Q 题**

主题：测试金字塔、Vitest、Vue Test Utils、Composable、Pinia / Router、Mock / Fake、契约测试、Playwright、视觉回归、可访问性测试、覆盖率边界。

- [ ] **Step 2：创建 7 道 D 题**

主题：

1. 按风险设计测试组合。
2. 异步竞态、取消和时间控制。
3. E2E 数据隔离与 Flaky Test。
4. API 契约和跨团队兼容。
5. 视觉、可访问性与人工检查。
6. 属性测试、变异测试和故障注入。
7. 质量门禁、发布信心和紧急例外。

- [ ] **Step 3：加入文件集合并验证 532 题**

```bash
MIN_TOTAL_QUESTIONS=520 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=532 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=21-testing-quality.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/21-testing-quality.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增测试与质量保障题库"
```

---

### Task 9：新增项目答辩与行为面试题库

**Files:**
- Create: `docs/interview/questions/22-project-behavioral.md`
- Modify: `scripts/validate-question-bank.mjs`

- [ ] **Step 1：创建 10 道 Q 题**

主题：自我介绍、主项目、个人贡献、技术取舍、失败案例、跨团队冲突、需求变化、离职原因、职业规划、反问与收尾。

- [ ] **Step 2：创建 8 道 D 题**

主题：

1. 3 / 5 / 10 分钟项目答辩。
2. 指标口径与个人贡献证据。
3. 重大事故和失败复盘。
4. 无职权影响与跨团队推动。
5. 排期冲突和优先级决策。
6. 反馈、培养和绩效难题。
7. 产品判断和业务价值。
8. 诚信、保密和无法回答的问题。

答案使用 STAR-L，示例必须标记为可替换表达，不暗示为用户真实经历。

- [ ] **Step 3：加入文件集合并验证 550 题**

```bash
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=22-project-behavioral.md
pnpm docs:build
```

- [ ] **Step 4：提交**

```bash
git add docs/interview/questions/22-project-behavioral.md scripts/validate-question-bank.mjs
git commit -m "docs: 新增项目答辩与行为面试题库"
```

---

### Task 10：新增模块全量审查

**Files:**
- Modify: `docs/interview/questions/15-database-prisma.md`
- Modify: `docs/interview/questions/16-html-css-a11y.md`
- Modify: `docs/interview/questions/17-browser-web-api.md`
- Modify: `docs/interview/questions/18-network-security.md`
- Modify: `docs/interview/questions/19-hybrid-app.md`
- Modify: `docs/interview/questions/20-performance-ux.md`
- Modify: `docs/interview/questions/21-testing-quality.md`
- Modify: `docs/interview/questions/22-project-behavioral.md`
- Modify: `docs/interview/guides/backend/nestjs-prisma.md`

- [ ] **Step 1：执行规格审查**

逐文件确认：

- Q / D 数量与设计一致；
- 每题主答案、追问和追问答案完整；
- D 题六段结构完整；
- 题号、追问编号和答案标题一致；
- 模块边界没有重复占位。

- [ ] **Step 2：执行技术审查**

按领域核对官方资料：

- MySQL / Prisma / NestJS；
- HTML / CSS / WCAG；
- 浏览器和 Web API；
- HTTP / TLS / OAuth / CSP；
- Android / iOS WebView、Capacitor、Cordova、uni-app App；
- Web Vitals；
- Vitest、Vue Test Utils、Playwright。

修复所有 Critical 和 Important。

- [ ] **Step 3：执行 22 文件、550 题阶段门禁**

```bash
pnpm docs:validate:test
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 \
node scripts/validate-question-bank.mjs \
  --require-followups \
  --followup-files=15-database-prisma.md,16-html-css-a11y.md,17-browser-web-api.md,18-network-security.md,19-hybrid-app.md,20-performance-ux.md,21-testing-quality.md,22-project-behavioral.md
MIN_TOTAL_QUESTIONS=540 MAX_TOTAL_QUESTIONS=560 EXPECTED_TOTAL_QUESTIONS=550 \
pnpm docs:check
git diff --check
```

Expected：22 文件、550 题，全部主答案和新增 8 个模块的追问答案通过；01～14 的追问门禁将在返回追问计划后开启。

- [ ] **Step 4：提交审查修正**

若有修正：

```bash
git add docs/interview/questions docs/interview/guides/backend scripts
git commit -m "docs: 完成新增能力模块深度验收"
```

若无修正，不创建空提交。
