# 14 天主线

> **适合准备时间：** 约 2 周、目标岗位 A / B / C 都要能接的常规冲刺。若有 6～8 周，请改走 [60 天完整复习路线](/interview/plans/60-day)，不要把 60 天每天压进 14 天。

默认冲刺节奏。先读 [总览与侧重点矩阵](/interview/00-overview)，按公司类型标出加重模块，再按日执行。每天建议：**读题 → 遮答案口述 → 对标踩坑 → 完成口述任务 → 勾选 Checklist**。

适用：有约 2 周备战窗口、目标 A/B/C 都要能接的资深前端。

### 从 60 天裁剪时保留的核心

- Web 底座只保留 JS / TS 事件循环与类型约束（60 天 D1–D4）；HTML / CSS / A11y 只做下方最小覆盖
- Vue3 核心与主项目故事（D17–D21、D58）
- 多端按 JD 选一条加重：AntDV、Vant 或小程序（D33–D42 三选一加深）
- 工程化 + 一条性能证据（D25–D30）
- NestJS / Java 对比与 2 场模拟（D50–D51、对应本页 D12–D13）
- 架构只按 JD 三选一：微前端 / NestJS / 前端架构（D53–D55 选一）

### 新增题库的最小覆盖

14 天不新开完整阶段，用「加 20 分钟抽题」挂到已有日：

| 题库 | 最小抽题 | 挂到哪一天 |
| ---- | -------- | ---------- |
| [HTML / CSS / A11y](/interview/questions/16-html-css-a11y) | Q1、Q6、Q11、D8 | D1 收尾或 D5 移动端对照 |
| [浏览器与 Web API](/interview/questions/17-browser-web-api) | Q1、Q2、D2 | D1 事件循环加深 |
| [网络与 Web 安全](/interview/questions/18-network-security) | Q6、Q8、Q11、D3 | D7 缓存、D8 安全一问 |
| [性能与用户体验](/interview/questions/20-performance-ux) | Q1、Q11、D3 | 并入 D8，替代空泛的「感觉型优化」 |
| [测试与质量保障](/interview/questions/21-testing-quality) | Q1、Q9、D7 | 并入 D7 质量门禁 |
| [项目答辩与行为面试](/interview/questions/22-project-behavioral) | Q1、Q2、D1、D2 | 并入 D3 故事、D14 终检 |
| [数据库与 Prisma](/interview/questions/15-database-prisma) | Q15、Q17、D6 | 仅全栈岗，并入 D9 |
| [Hybrid App](/interview/questions/19-hybrid-app) | Q1、Q3、D1 | 仅 JD 要求时，并入 D5 / D6 |

---

## 阶段总览

| 阶段 | 天数 | 重心 |
| ---- | ---- | ---- |
| 底座 | D1–D3 | JS/TS、Vue3、主项目故事骨架 |
| 多端 | D4–D6 | Ant Design Vue、Vant、uni-app / 小程序 |
| 工程与全栈 | D7–D9 | 工程化、性能、NestJS / Java 对比 |
| 架构与 AI | D10–D11 | 前端架构 + Lead、微前端 + Cursor 实践 |
| 模拟收敛 | D12–D14 | 模拟 ×2、弱项回炉、反问清单 |

---

## D1 — JS/TS 底座

### 学习目标

- 把类型系统说成「生产约束」：`unknown` / `any`、泛型边界、常用工具类型
- 事件循环、闭包、`this`、Promise 并发控制能口述到边界，不背术语堆
- 建立「先想 90 秒再对答案」的刷题节奏

### 题库链接

- [JS/TS 题库](/interview/questions/01-js-ts)

### 口述任务

用 3 分钟讲清：你在主项目里如何用 TypeScript 约束接口与组件 props；举一个「类型帮你拦下线上问题」的例子。

---

## D2 — Vue3 核心

### 学习目标

- Composition API、响应式边界（ref / reactive / computed / watch）说清楚
- 生命周期、组件通信、Provide/Inject、Suspense 场景级掌握
- 能对比 Options API 何时还值得用，以及迁移成本怎么讲

### 题库链接

- [Vue3 题库](/interview/questions/02-vue3)

### 口述任务

选一个真实页面（列表 + 详情或表单流），按「数据流 → 副作用 → 卸载清理」口述实现，控制在 4 分钟内。

---

## D3 — 主项目故事骨架

### 学习目标

- 用故事模板压出一条主线：背景 → 目标 → 方案 → 取舍 → 结果 → 复盘
- 指标尽量量化（耗时、错误率、交付周期、包体积等）
- 准备 2 个追问分支：失败经历与「如果重来」

### 题库链接

- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)
- 回看 [Vue3](/interview/questions/02-vue3)、[JS/TS](/interview/questions/01-js-ts) 中与主项目相关的题

### 口述任务

完整录制（或对着镜子）主项目故事 **5 分钟版** + **90 秒电梯版**；写下来第二天还能复述。

---

## D4 — 中后台 Ant Design Vue

### 学习目标

- 表格、表单、权限、菜单与布局的「可维护拆分」能讲清
- 大数据量表格、远程搜索、表单联动的性能与体验取舍
- 组件库二次封装原则：何时封、何时不封

### 题库链接

- [中后台 AntDV 题库](/interview/questions/04-admin-antdv)

### 口述任务

讲一次「权限 + 动态路由 / 菜单」落地：数据从哪来、前端怎么裁、刷新后如何恢复。

---

## D5 — H5 与 Vant

### 学习目标

- 移动端适配、安全区、手势与滚动穿透等踩坑能点名
- Vant 表单、列表、弹层组合拳；弱网与加载态策略
- H5 与中后台在状态管理、路由、构建上的差异叙事

### 题库链接

- [H5 / Vant 题库](/interview/questions/05-h5-vant)

### 口述任务

口述一个 H5 活动页或业务页：首屏策略、缓存、返回栈问题你怎么处理。

---

## D6 — uni-app / 小程序

### 学习目标

- 条件编译、分包、生命周期与 Vue Web 端差异说清楚
- 登录态、存储、分享、支付等能力边界（能做什么 / 不能承诺什么）
- 多端同构的收益与坑：何时该拆仓库或拆包

### 题库链接

- [uni-app / 小程序题库](/interview/questions/06-uniapp-miniprogram)

### 口述任务

用 4 分钟讲「多端交付」：选型理由、一次真实踩坑、你如何保证回归成本可控。

---

## D7 — 工程化

### 学习目标

- 构建（Vite）、规范（ESLint/Prettier）、CI、Monorepo / 多包直觉到位
- 环境变量、代理、sourcemap、发布回滚链路能画一遍
- 质量门禁：单测、E2E、code review 在团队里怎么落地而不是空喊

### 题库链接

- [工程化题库](/interview/questions/03-engineering)

### 口述任务

讲清你负责过的一条流水线：从 MR 到生产，卡点在哪、你推动过什么改进。

---

## D8 — 性能与体验

### 学习目标

- 从指标出发：LCP、INP、CLS、包体积、长列表、接口瀑布
- 会诊断：Chrome Performance / Network 怎么定位到「你的锅」
- 优化要有前后对比；避免「无数据的感觉型优化」

### 题库链接

- [工程化题库（性能相关）](/interview/questions/03-engineering)
- [前端系统设计](/interview/questions/11-frontend-system-design)（可先扫标题）

### 口述任务

准备一个性能案例 STAR：问题发现 → 假设 → 验证 → 手段 → 结果数字。

---

## D9 — NestJS / Java 对比

### 学习目标

- 对比 NestJS 与 Spring Boot 的模块、依赖注入、请求链路和生产治理
- 说清 NestJS 更适合 BFF / TypeScript 团队快速闭环的条件，以及 Java 主路径更稳妥的场景
- 接口设计、鉴权、校验、异常、幂等与可观测性都落到同一组生产约束
- 保持全栈偏前边界，不把框架类比当作底层机制相同

### 题库链接

- [NestJS 题库](/interview/questions/13-nestjs)
- [Java 全栈题库](/interview/questions/07-java-fullstack)
- 回看 [总览 · Java 叙事边界](/interview/00-overview)

### 口述任务

用一张对比卡口述「同一个管理后台 BFF 为什么选 NestJS 或 Spring Boot」：团队、交付、性能、生态、运维与退出成本分别是什么。

---

## D10 — 前端架构 + Lead

### 学习目标

- 从业务、规模、团队、合规和存量系统识别架构约束
- 用质量属性、依赖边界、故障治理与演进触发器解释架构方案
- 技术决策覆盖选型、债务、灰度、回滚；用业务语言讲清取舍
- 带人与质量：评审、门禁、排期、风险上报

### 题库链接

- [前端架构题库](/interview/questions/14-frontend-architecture)
- [架构 / Lead 题库](/interview/questions/08-architecture-lead)

### 口述任务

准备一个 Lead 向架构故事：约束是什么、有哪些方案、你如何推动决策、故障如何兜底、何时触发下一阶段演进。

---

## D11 — 微前端 + Cursor 实践

### 学习目标

- 判断微前端的适用边界，讲清应用拆分、隔离、通信、共享依赖与故障降级
- 完成 Cursor Rules / Skills 实践：让规则约束 Vue 修改，让 Skill 固化重复工作流
- 保留人工质量关卡：需求拆解、审代码、测试、权限与可维护性检查

### 题库链接

- [微前端题库](/interview/questions/12-microfrontend)
- [AI vibe coding 题库](/interview/questions/09-ai-vibe-coding)
- [Cursor Rules](/interview/guides/ai-coding/rules)
- [Cursor Skills](/interview/guides/ai-coding/skills)
- [Vue 项目实践](/interview/guides/ai-coding/vue-project-example)

### 口述任务

用 5 分钟演示叙事：为一个 Vue 微应用补功能时，Rule 如何约束代码，Skill 如何驱动检查，你如何审查跨应用契约并阻止故障扩散。

---

## D12 — 模拟面试 #1

### 学习目标

- 按目标公司类型选择 45～60 分钟常规脚本；目标为高级架构时可改选 75 分钟高级前端架构场，复盘另计
- 练开场自我介绍 + 主故事 + 至少 3 轮追问
- 用评分表记下薄弱维度，不急着补全库

### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- 按弱项回链对应题库模块

### 口述任务

完整走一场所选时长的模拟（可找同伴或自问自答录音）；结束后另做复盘，只改「评分最低的两项」。

---

## D13 — 弱项回炉 + 模拟 #2

### 学习目标

- 针对 D12 评分表，集中回炉 1～2 个模块（原理 / 工程 / 多端 / Java 选一到二）
- 第二场模拟换公司类型或面试官画像；继续选择 45～60 分钟常规脚本，或独立完成 75 分钟高级架构场，避免混用时长
- 手写题若缺口大，从手写库抽 2～3 题限时练

### 题库链接

- [手写题库](/interview/questions/10-handwriting)
- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- 弱项对应模块自选

### 口述任务

第二场模拟；对比两场评分，写出「上场三句必说」与「绝不主动展开的话题」。

---

## D14 — 反问与终检

### 学习目标

- 准备分层级的反问：团队、业务、技术债、协作、成长
- 终检主故事 90 秒版与简历每一行的「证据句」
- Checklist 扫尾，确认薄弱项有「够用答法」而非空白

### 题库链接

- [反问清单](/interview/mocks/reverse-questions)
- [总览](/interview/00-overview)
- [故事模板](/interview/stories/template)
- [简历 ATS 检查清单](/interview/resume/ats-checklist)
- [项目改写检查清单](/interview/resume/project-rewrite-checklist)

### 口述任务

对着简历逐行过一遍：每行能在 30 秒内落到项目证据；准备 5 个高质量反问。

---

## 进度 Checklist

勾选会写入浏览器 localStorage（键：`mianshi-plan:14-day`），与 7 天 / 30 天计划互不干扰。D9、D11 内容升级后使用新语义 ID，不会继承旧任务的完成态；其余未变任务继续保留原进度。

<PlanChecklist planId="14-day" :items='[{"id":"d1-read","label":"D1 读完 JS/TS 题库核心题并遮答案口述"},{"id":"d1-oral","label":"D1 完成 TS 约束接口/props 口述"},{"id":"d1-note","label":"D1 记下至少 3 个卡壳点"},{"id":"d2-read","label":"D2 读完 Vue3 核心题并口述数据流"},{"id":"d2-oral","label":"D2 完成真实页面 4 分钟口述"},{"id":"d2-edge","label":"D2 能讲清响应式边界与清理副作用"},{"id":"d3-story","label":"D3 写完主项目 STAR 骨架（含指标）"},{"id":"d3-oral5","label":"D3 录制/复述 5 分钟主故事"},{"id":"d3-oral90","label":"D3 练熟 90 秒电梯版"},{"id":"d4-read","label":"D4 过完 AntDV 中后台题库重点"},{"id":"d4-oral","label":"D4 口述权限+菜单/路由落地"},{"id":"d4-wrap","label":"D4 说清组件二次封装原则"},{"id":"d5-read","label":"D5 过完 H5/Vant 题库重点"},{"id":"d5-oral","label":"D5 口述首屏/缓存/返回栈方案"},{"id":"d5-pit","label":"D5 整理移动端踩坑清单"},{"id":"d6-read","label":"D6 过完 uni-app/小程序题库重点"},{"id":"d6-oral","label":"D6 口述多端交付选型与踩坑"},{"id":"d6-pack","label":"D6 说清分包与条件编译取舍"},{"id":"d7-read","label":"D7 过完工程化题库重点"},{"id":"d7-oral","label":"D7 口述 MR 到生产流水线"},{"id":"d7-gate","label":"D7 能讲质量门禁如何落地"},{"id":"d8-case","label":"D8 写完性能案例 STAR（含数字）"},{"id":"d8-oral","label":"D8 口述性能诊断与优化手段"},{"id":"d8-metric","label":"D8 熟悉 LCP/INP/包体积等指标口径"},{"id":"d9-nest-java-review","label":"D9 完成 NestJS / Java 对比复习"},{"id":"d9-bff-selection","label":"D9 口述 BFF 框架选型与接口约定"},{"id":"d9-fullstack-boundary","label":"D9 能清晰说出全栈偏前边界"},{"id":"d10-read","label":"D10 过完前端架构/Lead 题库重点"},{"id":"d10-oral","label":"D10 口述一次架构决策故事"},{"id":"d10-lead","label":"D10 准备带人/排期/门禁话术"},{"id":"d11-microfrontend","label":"D11 过完微前端与 AI 协作重点"},{"id":"d11-cursor-practice","label":"D11 完成 Cursor Rules / Skills 实践"},{"id":"d11-cross-app-guard","label":"D11 说清跨应用与 AI 质量关卡"},{"id":"d12-mock","label":"D12 完成模拟面试 #1 并填评分表"},{"id":"d12-fix","label":"D12 针对最低两项制定回炉计划"},{"id":"d12-intro","label":"D12 自我介绍开场稳定在 90 秒内"},{"id":"d13-weak","label":"D13 完成弱项模块回炉"},{"id":"d13-mock","label":"D13 完成模拟面试 #2（换画像）"},{"id":"d13-hand","label":"D13 限时完成 2～3 道手写（若缺口大）"},{"id":"d14-reverse","label":"D14 准备 5 个高质量反问"},{"id":"d14-resume","label":"D14 简历逐行证据句与 ATS 终检"},{"id":"d14-story","label":"D14 主故事 90 秒版终检通过"}]' />
