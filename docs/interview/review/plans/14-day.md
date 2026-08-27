# 面试前 14 天

> **适合场景：** 约两周窗口，九域速记扫完 + 高频专题各过一遍 + 终场模拟。
>
> **每日时长：** 90～150 分钟。
>
> **完成标准：** 当天主题可遮稿口述；九域与十二专题至少各覆盖一次主线；终场模拟完成。
>
> **任务 ID 前缀：** `r14-d{n}-{slug}`（禁止复用 60 天计划 ID）。

与学习路线中的 [14 天冲刺版](/interview/plans/14-day) 不同：本页是复习模块临场回炉。入口见 [复习总览](/interview/review/00-overview)。默认完整备战仍是 [60 天](/interview/plans/60-day)。

---

## 阶段总览

| 天数 | 重心 | 任务 ID |
| ---- | ---- | ------- |
| D1 | Web 基础速记 + JS 运行时专题 | `r14-d1-web-js` |
| D2 | TS 类型专题 + 手写入口 | `r14-d2-ts-types` |
| D3 | 浏览器渲染专题 + 网络与安全速记入口 | `r14-d3-browser-net` |
| D4 | 网络与 Web 安全专题 | `r14-d4-security` |
| D5 | 框架与数据速记 + Vue3 专题 | `r14-d5-vue` |
| D6 | Nuxt SSR 专题 | `r14-d6-nuxt` |
| D7 | Vite / Webpack 专题 + 工程速记 | `r14-d7-build` |
| D8 | 性能、测试与质量门禁专题 | `r14-d8-perf-qa` |
| D9 | 后台业务 + 移动跨端速记 | `r14-d9-biz-mobile` |
| D10 | Hybrid / 小程序 / H5 专题 | `r14-d10-hybrid` |
| D11 | 架构速记 + 微前端专题 | `r14-d11-arch-mf` |
| D12 | 运维速记 + 全栈 / Nest / Prisma 专题 | `r14-d12-devops-full` |
| D13 | 领导力速记 + 行为专题 + 主故事 | `r14-d13-lead-story` |
| D14 | 终场模拟 + 反问终检 | `r14-d14-final-mock` |

---

### D1 — Web 基础与 JS 运行时

任务 ID：`r14-d1-web-js`

#### 学习目标

- Web 与计算机基础速记结论卡可讲
- JS 运行时与异步专题建立 15 分钟主线

#### 材料

- [Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)
- [JS 运行时与异步](/interview/review/topics/01-js-runtime)
- 真源：[01 JS/TS](/interview/questions/01-js-ts)、[17 Browser/Web API](/interview/questions/17-browser-web-api)

#### 必做输出

- 遮稿口述 [01 速记](/interview/review/sheets/01-web-fundamentals) 核心结论卡 8～10 分钟（事件循环、取消、缓存入口优先）
- [01 JS 运行时专题](/interview/review/topics/01-js-runtime) 讲满 15 分钟主线；勾选验收清单过半
- 手画一条「同步 → 微任务 → 渲染 → 宏任务」时间线，绑定项目一次卡顿证据坑位
- 卡点 ≥ 3 条，回链题库题号

#### 验收标准

速记 5 分钟稿 + 专题主线可开讲。

---

### D2 — TypeScript 类型系统

任务 ID：`r14-d2-ts-types`

#### 学习目标

- TS 类型系统专题可讲 15 分钟
- 与手写 / 工程约束的边界说清

#### 材料

- [TypeScript 类型系统](/interview/review/topics/02-ts-types)
- [Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)（类型相关结论卡）
- 真源：[01 JS/TS](/interview/questions/01-js-ts)、[10 手写](/interview/questions/10-handwriting)（只入口，不新开刷题周）

#### 必做输出

- [02 TS 专题](/interview/review/topics/02-ts-types) 15 分钟主线口述；验收清单勾选过半
- 讲清 `unknown` / 收窄 / 泛型约束各一例（用自己的 API 边界）
- 选 1 道手写入口题限时 25 分钟（并发池或 `Promise.all` 思路即可），讲失败短路与取消
- 卡点回链 [01 JS/TS](/interview/questions/01-js-ts)，不另编类型口径

#### 验收标准

类型专题验收清单勾选过半。

---

### D3 — 浏览器渲染与网络入口

任务 ID：`r14-d3-browser-net`

#### 学习目标

- 浏览器渲染与性能底座专题主线可讲
- 网络与安全速记建立入口印象

#### 材料

- [浏览器渲染与性能底座](/interview/review/topics/03-browser-rendering)
- [Web 与计算机基础速记（含网络 / 安全入口）](/interview/review/sheets/01-web-fundamentals)
- [网络与 Web 安全专题](/interview/review/topics/04-network-security)（预读标题与知识地图）
- 真源：[17 Browser](/interview/questions/17-browser-web-api)、[16 HTML/CSS](/interview/questions/16-html-css-a11y)

#### 必做输出

- [03 浏览器渲染专题](/interview/review/topics/03-browser-rendering) 讲满 15 分钟（导航 → 解析 → 布局绘制 → 交互）
- 从 [01 速记](/interview/review/sheets/01-web-fundamentals) 抽出缓存 / Cookie / SW 相关结论卡快讲 5 分钟
- 预读 [04 网络与安全专题](/interview/review/topics/04-network-security) 标题，写下明日要深挖的 3 个追问
- 卡点记录含至少 1 条「渲染 vs 性能指标」边界

#### 验收标准

渲染链路可口述；安全专题已排入 D4。

---

### D4 — 网络与 Web 安全专题

任务 ID：`r14-d4-security`

#### 学习目标

- 网络与 Web 安全专题完整主线
- 常见红线与边界不与题库冲突

#### 材料

- [网络与 Web 安全](/interview/review/topics/04-network-security)
- [Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)
- 真源：[18 网络与安全](/interview/questions/18-network-security)

#### 必做输出

- [04 专题](/interview/review/topics/04-network-security) 15 分钟主线；追问树至少走完一层
- 口述 XSS / CSRF / Cookie 属性 / CORS≠CSRF 红线各 60～90 秒
- 填 1 个证据坑位（CSP / SameSite / BFF Cookie 任选，用自己的）
- 与 [01 速记](/interview/review/sheets/01-web-fundamentals) 交叉核对口径冲突

#### 验收标准

专题 15 分钟可讲；追问树走完一层。

---

### D5 — 框架速记与 Vue3 专题

任务 ID：`r14-d5-vue`

#### 学习目标

- 框架与数据速记可讲
- Vue3 响应式与渲染专题 15～25 分钟主线

#### 材料

- [框架与数据速记](/interview/review/sheets/02-framework-data)
- [Vue3 响应式与渲染](/interview/review/topics/05-vue-reactivity)
- 真源：[02 Vue3](/interview/questions/02-vue3)

#### 必做输出

- [02 速记](/interview/review/sheets/02-framework-data) 遮稿 8～10 分钟
- [05 Vue3 专题](/interview/review/topics/05-vue-reactivity) 讲满 15～25 分钟；验收清单勾选过半
- 追问树选 2 条走到 L2；大列表或水合案例填自己的数字
- 卡点回链 [02 Vue3](/interview/questions/02-vue3) Q/D

#### 验收标准

Vue3 专题验收清单勾选过半。

---

### D6 — Nuxt SSR / 同构

任务 ID：`r14-d6-nuxt`

#### 学习目标

- Nuxt SSR / 同构专题主线可讲
- hydration 与渲染模式边界清晰

#### 材料

- [Nuxt SSR / 同构](/interview/review/topics/06-nuxt-ssr)
- [框架与数据速记](/interview/review/sheets/02-framework-data)
- 真源：[23 Nuxt](/interview/questions/23-nuxt)、[02 Vue3](/interview/questions/02-vue3)（hydration 相关）

#### 必做输出

- [06 Nuxt 专题](/interview/review/topics/06-nuxt-ssr) 15 分钟主线（渲染模式 → 数据获取 → 水合）
- 口述至少四个 hydration mismatch 原因 + 定位步骤
- 无 Nuxt 经历：讲清「够用边界 + 与纯 SPA 差异」，并标明不上深水区
- 卡点与 D5 Vue 水合口径对齐，冲突回题库

#### 验收标准

SSR 主线可独立口述。

---

### D7 — 构建器与工程速记

任务 ID：`r14-d7-build`

#### 学习目标

- Vite 与 Webpack 专题选型边界可讲
- 工程与质量速记覆盖交付链路

#### 材料

- [Vite 与 Webpack 构建器](/interview/review/topics/07-vite-webpack)
- [工程与质量速记](/interview/review/sheets/03-engineering-quality)
- 真源：[03 工程化](/interview/questions/03-engineering)

#### 必做输出

- [07 构建专题](/interview/review/topics/07-vite-webpack) 15 分钟（dev / prod、插件、分包、Vite 8 生产默认口径）
- [03 工程速记](/interview/review/sheets/03-engineering-quality) 口述「规范 → CI → 发布 / 回滚」3～5 分钟
- 写 1 则构建选型或体积治理案例提纲（数字用自己的）
- 卡点回链工程题库，禁止与专题口径打架

#### 验收标准

构建选型 + 工程链路各 3 分钟过关。

---

### D8 — 性能、测试与质量门禁

任务 ID：`r14-d8-perf-qa`

#### 学习目标

- 性能 / 测试专题完整主线
- 准备一条带数字的证据坑位

#### 材料

- [性能、测试与质量门禁](/interview/review/topics/08-perf-testing)
- [工程与质量速记](/interview/review/sheets/03-engineering-quality)
- [浏览器渲染与性能底座](/interview/review/topics/03-browser-rendering)（指标回炉）
- 真源：[20 性能](/interview/questions/20-performance-ux)、[21 测试](/interview/questions/21-testing-quality)

#### 必做输出

- [08 专题](/interview/review/topics/08-perf-testing) 15～20 分钟主线；验收清单勾选过半
- 写下 **一条** 性能 STAR：基线指标 → 手段 → 验证分位 → 回归门禁（填自己的项目）
- 口述质量门禁「我们团队实际怎么做」3 分钟，避免空概念
- 与 D3 / D7 卡点合并去重

#### 验收标准

专题可讲；证据坑位已写下（填自己的项目，不抄示例）。

---

### D9 — 业务前端与跨端速记

任务 ID：`r14-d9-biz-mobile`

#### 学习目标

- 后台与业务前端、移动端与跨平台两篇速记扫完
- 按 JD 标加重面

#### 材料

- [后台与业务前端速记](/interview/review/sheets/04-admin-business)
- [移动端与跨平台速记](/interview/review/sheets/05-mobile-cross)
- 真源快链：[04 AntDV](/interview/questions/04-admin-antdv)、[05 H5/Vant](/interview/questions/05-h5-vant)、[06 uni-app](/interview/questions/06-uniapp-miniprogram)

#### 必做输出

- [04](/interview/review/sheets/04-admin-business)、[05](/interview/review/sheets/05-mobile-cross) 各遮稿口述 5～8 分钟
- 按 JD 标「加重 / 够用」：中后台加重权限与表格；H5 / 多端加重分包与桥
- 各准备 1 个「够深」业务技术点提纲（含踩坑）
- 卡点回链对应题库，不双线通刷

#### 验收标准

两域结论卡可遮稿快讲。

---

### D10 — Hybrid / 小程序 / H5 专题

任务 ID：`r14-d10-hybrid`

#### 学习目标

- Hybrid / 小程序 / H5 专题主线
- 无相关经历则只保留边界叙事

#### 材料

- [Hybrid / 小程序 / H5](/interview/review/topics/11-hybrid-miniapp-h5)
- [移动端与跨平台速记](/interview/review/sheets/05-mobile-cross)
- 真源：[19 Hybrid](/interview/questions/19-hybrid-app)、[06 uni-app](/interview/questions/06-uniapp-miniprogram)

#### 必做输出

- [11 专题](/interview/review/topics/11-hybrid-miniapp-h5) 15 分钟主线，或「边界叙事」8 分钟版本（无经历时）
- 口述 WebView 通信 / 分包 / 鉴权差异中至少 2 个点
- 与 [05 速记](/interview/review/sheets/05-mobile-cross) 交叉核对平台差异口径
- JD 未写 Hybrid 时：只保留够用边界，标明不上深水区

#### 验收标准

专题主线或「够用 + 边界」叙事可上场。

---

### D11 — 架构与微前端

任务 ID：`r14-d11-arch-mf`

#### 学习目标

- 架构与系统设计速记可讲
- 微前端与前端架构专题主线

#### 材料

- [架构与系统设计速记](/interview/review/sheets/06-architecture)
- [微前端与前端架构](/interview/review/topics/09-microfrontend-architecture)
- 真源：[12 微前端](/interview/questions/12-microfrontend)、[14 前端架构](/interview/questions/14-frontend-architecture)、[11 系统设计](/interview/questions/11-frontend-system-design)

#### 必做输出

- [06 架构速记](/interview/review/sheets/06-architecture) 遮稿 5～8 分钟（模块边界、演进、故障面）
- [09 微前端专题](/interview/review/topics/09-microfrontend-architecture) 15 分钟主线（注册 / 隔离 / 路由 / 发布）
- 写 1 则「为何上 / 不上微前端」取舍提纲
- 无微前端经历：讲清单体拆分边界与协作成本即可

#### 验收标准

模块边界 + 微前端取舍可口述。

---

### D12 — 运维与全栈数据

任务 ID：`r14-d12-devops-full`

#### 学习目标

- 运维与部署速记可讲一条上线 / 回滚
- 全栈数据与 Nest / Prisma 专题主线（偏全栈岗加重）

#### 材料

- [运维与部署速记](/interview/review/sheets/07-devops)
- [全栈、数据与 AI 速记](/interview/review/sheets/08-fullstack-ai)
- [全栈数据与 Nest / Prisma](/interview/review/topics/10-fullstack-data)
- 真源：[26 运维](/interview/questions/26-devops)、[13 Nest](/interview/questions/13-nestjs)、[15 Prisma](/interview/questions/15-database-prisma)、[07 Java 全栈](/interview/questions/07-java-fullstack)、[09 AI](/interview/questions/09-ai-vibe-coding)

#### 必做输出

- [07 运维速记](/interview/review/sheets/07-devops) 口述上线 / 监控 / 回滚 3～5 分钟
- [08 全栈速记](/interview/review/sheets/08-fullstack-ai) 快扫结论卡；偏 AI 岗补 vibe coding 边界一句
- [10 全栈专题](/interview/review/topics/10-fullstack-data) 15 分钟或「BFF / 数据边界」8 分钟版本（非全栈岗可缩短）
- 卡点写清前后端责任面，禁止夸大未做过的中间件深度

#### 验收标准

运维链路 + 全栈边界叙事可讲。

---

### D13 — Lead、行为与主故事

任务 ID：`r14-d13-lead-story`

#### 学习目标

- 领导力速记 + 行为专题
- 主故事压实到可上场

#### 材料

- [领导力与求职速记](/interview/review/sheets/09-leadership)
- [Lead、行为与项目答辩](/interview/review/topics/12-lead-behavioral)
- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)
- 真源：[22 项目答辩与行为](/interview/questions/22-project-behavioral)

#### 必做输出

- [09 领导力速记](/interview/review/sheets/09-leadership) 遮稿 5～8 分钟
- [12 行为专题](/interview/review/topics/12-lead-behavioral) 15 分钟主线；追问树走完至少 2 条到 L2
- 产出 5 分钟 STAR + 90 秒电梯版；录音第二遍只看提纲；失败 / 取舍分支各 90 秒
- 简历证据与故事数字勾对清单；准备明日终场开场稿

#### 验收标准

主故事脱稿；行为追问有收口。

---

### D14 — 终场模拟与反问

任务 ID：`r14-d14-final-mock`

#### 学习目标

- 完成终场模拟（脚本十一或等价完整场次）
- 反问与评分表终检
- 只回炉卡点，不新开专题

#### 材料

- [模拟脚本 · 脚本十一 · 综合终场](/interview/mocks/scripts#脚本十一-综合终场-75-分钟)（或等价完整场：脚本六 / 三，按岗位）
- [评分表](/interview/mocks/scorecard)
- [反问清单](/interview/mocks/reverse-questions)
- 两周卡点对应速记 / 专题（见 [复习总览](/interview/review/00-overview)）

#### 必做输出

- 完整跑完 **脚本十一**（或岗位等价终场）；用评分表覆盖目标岗位核心维
- 合并两周卡点为「上场 Top 5」，每条遮稿口述通过；仍卡者只回对应速记结论卡
- 从 [反问清单](/interview/mocks/reverse-questions) 定 3～5 条上场版
- 禁止新开专题与通宵刷题；确认睡眠与上场节奏

#### 验收标准

终场模拟完成；上场反问版已定；最高频卡点口述通过。
