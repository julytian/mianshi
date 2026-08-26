# 30 天加练版

在 [14 天主线](/interview/plans/14-day) 骨架上拉长节奏：全月安排 **7 次必做手写、2 次独立系统设计、4 场周模拟 + 1 场额外综合架构模拟**，可选叠加 **Spring Boot CRUD + Vue 口述闭环**。手写集中在前两周打底，D16 再巩固一次；D27 按状态在半场彩排与轻量复盘中二选一。

先读 [总览与侧重点矩阵](/interview/00-overview)。执行原则：**14 天内容不加水稀释，用加练日做深度与肌肉记忆**；忙时优先保住主故事、Vue3、工程化与当周模拟。

---

## 节奏约定

| 节奏 | 做法 |
| ---- | ---- |
| 手写 7 次 | D2、D4、D6、D9、D11、D13、D16 从 [手写题库](/interview/questions/10-handwriting) 限时练习 |
| 系统设计 2 次 | D9、D16 画一页方案口述；D22～D25 再通过架构专项应用设计能力 |
| 周模拟 4 场 | D7、D14、D21、D28 各 1 场，用 [模拟脚本](/interview/mocks/scripts) + [评分表](/interview/mocks/scorecard) |
| 额外专项场 | D25 独立完成 75 分钟高级前端架构模拟，不替代 D28 终场 |
| 可选 Java 闭环 | 第 3～4 周任选 2～3 个晚上：最小 Spring Boot CRUD + Vue 管理页，练 AI 协作口述 |

四周映射（可按入职日期平移）：

| 周次 | 对应 14 天阶段 | 加练重点 |
| ---- | -------------- | -------- |
| W1（D1–D7） | 底座 + 多端前半 | 手写打底、第 1 场模拟 |
| W2（D8–D14） | 多端收尾 + 工程/性能/Java | 系统设计 #1、第 2 场模拟 |
| W3（D15–D21） | Lead + AI + 架构专项 | 系统设计 #2、微前端、NestJS 基础与高级、第 3 场模拟 |
| W4（D22–D30） | 架构实践 + 终检 | 前端架构、Cursor + Vue、简历 / ATS、额外架构场与第 4 场周模拟 |

下方按日给出目标；与 14 天同名的「主题日」内容对齐主线，加练日标注 **【加练】**。

---

## W1 · 底座与多端启动

### D1 — JS/TS 底座

#### 学习目标

- 类型系统与异步模型建立「可追问」深度，不只背定义
- 定下 30 天刷题节奏：遮答案 → 口述 → 记卡壳

#### 题库链接

- [JS/TS](/interview/questions/01-js-ts)

#### 口述任务

3 分钟讲清主项目里 TS 如何约束接口与组件；列出本周手写候选题号。

---

### D2 —【加练】手写日 A + Vue3 预读

#### 学习目标

- 限时完成 2～3 道手写（防抖/节流、深拷贝边界、Promise 相关等）
- 预读 Vue3 响应式与组合式章节标题，为 D3 铺路

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [Vue3](/interview/questions/02-vue3)

#### 口述任务

每道手写讲清时间复杂度与边界；错题收入错题本（本地笔记即可）。

---

### D3 — Vue3 核心

#### 学习目标

- 同 14 天 D2：响应式、通信、生命周期、复用模式
- 额外：对照手写日暴露的 JS 弱点，回补 2 题

#### 题库链接

- [Vue3](/interview/questions/02-vue3)
- [JS/TS](/interview/questions/01-js-ts)

#### 口述任务

真实页面 4 分钟数据流口述。

---

### D4 —【加练】手写日 B + 主故事起草

#### 学习目标

- 再练 2 道手写（数组/并发控制/发布订阅等）
- 用故事模板拉出主项目骨架与指标草稿

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [故事模板](/interview/stories/template)

#### 口述任务

主故事大纲过一遍（可不录音）；手写错题复盘。

---

### D5 — 主项目故事定稿

#### 学习目标

- 5 分钟版 + 90 秒版可稳定复述
- 失败与「如果重来」两个分支写完

#### 题库链接

- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)

#### 口述任务

录音主故事；回听删掉空话与不可验证的夸大。

---

### D6 —【加练】手写日 C + AntDV

#### 学习目标

- 手写 2 题；中后台表格/表单/权限主线读透

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [AntDV](/interview/questions/04-admin-antdv)

#### 口述任务

权限 + 菜单/路由落地口述。

---

### D7 —【周模拟 #1】+ H5/Vant 快扫

#### 学习目标

- 完成第 1 场完整模拟并填评分表
- H5/Vant 扫考察点与踩坑，为 W2 多端留钩子

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- [H5 / Vant](/interview/questions/05-h5-vant)

#### 口述任务

模拟后只定「下周回炉的两个维度」；不扩战线。

---

## W2 · 多端、工程、Java

### D8 — uni-app / 小程序

#### 学习目标

- 条件编译、分包、登录与存储边界
- 多端同构收益与坑

#### 题库链接

- [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)

#### 口述任务

4 分钟多端交付故事。

---

### D9 —【加练】手写日 D + 系统设计 #1

#### 学习目标

- 手写 2 题
- 选一题前端系统设计（如 Feed、后台权限、上传链路），画一页方案并口述

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [前端系统设计](/interview/questions/11-frontend-system-design)

#### 口述任务

系统设计 8～10 分钟：需求澄清 → 方案 → 瓶颈 → 演进。

---

### D10 — 工程化

#### 学习目标

- 构建、规范、CI、发布回滚、门禁

#### 题库链接

- [工程化](/interview/questions/03-engineering)

#### 口述任务

MR → 生产流水线口述。

---

### D11 —【加练】手写日 E + 性能

#### 学习目标

- 手写 2 题；性能 STAR（含数字）定稿

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [工程化](/interview/questions/03-engineering)

#### 口述任务

性能案例完整口述；指标口径对齐 LCP/INP/包体积等。

---

### D12 — Java 全栈边界

#### 学习目标

- Spring Boot 主路径；接口/鉴权/联调/幂等场景级
- 明确不做 JVM 与论文级分布式事务

#### 题库链接

- [Java 全栈](/interview/questions/07-java-fullstack)
- [总览](/interview/00-overview)

#### 口述任务

接口设计与联调约定口述。

---

### D13 —【加练】手写日 F +（可选）CRUD 闭环启动

#### 学习目标

- 手写 2 题
- **可选**：用 AI 起一个最小 Spring Boot CRUD + 一张 Vue 表页，只求能跑通与能讲

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [AI vibe coding](/interview/questions/09-ai-vibe-coding)
- [Java 全栈](/interview/questions/07-java-fullstack)

#### 口述任务

若做可选任务：录 3 分钟「今天搭了什么、AI 写了什么、我改了什么」。

**可选加练（不计入 Checklist）：** 启动最小 Spring Boot CRUD + Vue 管理页。后续若继续做，可在 D20 将其生产化；不做也不影响计划完成率。

---

### D14 —【周模拟 #2】

#### 学习目标

- 换公司类型或画像做第 2 场完整模拟
- 对照 W1 评分看进步维度

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)

#### 口述任务

模拟后更新「上场三句」与「不主动展开话题」。

---

## W3 · Lead、AI、回炉

### D15 — 架构 Lead

#### 学习目标

- 决策、带人、排期、门禁、前后端协作

#### 题库链接

- [架构 / Lead](/interview/questions/08-architecture-lead)

#### 口述任务

一次技术决策故事（含阻力）。

---

### D16 —【加练】手写日 G + 系统设计 #2

#### 学习目标

- 手写 2 题；第二道系统设计（与 #1 不同类型）

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [前端系统设计](/interview/questions/11-frontend-system-design)

#### 口述任务

系统设计口述，刻意练「澄清问题」开场 1 分钟。

---

### D17 — AI vibe coding（Vue + Java）

#### 学习目标

- AI 协作工作流与质量关卡
- 与可选 CRUD 项目互相印证

#### 题库链接

- [AI vibe coding](/interview/questions/09-ai-vibe-coding)

#### 口述任务

5 分钟 Vue + Java AI 闭环叙事。

---

### D18 — 微前端专项

#### 学习目标

- 判断微前端是否值得引入，区分组织问题、构建问题与运行时问题
- 讲清应用边界、样式 / JS 隔离、路由、通信、共享依赖和降级
- 将原弱项回炉并入本日最后 30 分钟，只修正评分最低的一个架构回答

#### 题库链接

- [微前端](/interview/questions/12-microfrontend)
- [工程化](/interview/questions/03-engineering)

#### 口述任务

完成一次「单体前端是否拆微前端」8 分钟评审：约束 → 备选 → 风险 → 试点 → 回退。

---

### D19 — NestJS 基础与生产

#### 学习目标

- Module、Controller、Provider、依赖注入与请求生命周期能画图说明
- 掌握 DTO 校验、异常、鉴权、配置、日志、健康检查与优雅停机
- 明确 NestJS BFF 与 Spring Boot 服务的选型边界

#### 题库链接

- [NestJS](/interview/questions/13-nestjs)
- [Java 全栈](/interview/questions/07-java-fullstack)

#### 口述任务

口述一条完整请求链：Middleware → Guard → Interceptor 入站 → Pipe → Controller/Provider → Interceptor 出站 → Exception Filter。其中前六段是正常主链；Exception Filter 只在异常未被前层处理的异常路径触发，并非每次请求都会顺序执行。

---

### D20 — NestJS 高级

#### 学习目标

- 掌握 Provider scope、循环依赖、事务边界、缓存、队列、限流与幂等
- 能设计可测试、可观测、可发布和可回滚的 NestJS 服务
- 完成一项生产化任务：已有 CRUD 项目就补鉴权、校验、日志或健康检查；没有项目则输出同等深度的 NestJS 生产方案与验证清单

#### 题库链接

- [NestJS](/interview/questions/13-nestjs)
- [AI vibe coding](/interview/questions/09-ai-vibe-coding)

#### 口述任务

从限流、队列、缓存、事务中任选一项，讲清触发条件、失败路径、监控指标与回退方案；完成「现有 CRUD 生产化」或「等价生产方案与验证清单」任一条即可。

---

### D21 —【周模拟 #3】（可偏 Lead 或创业/AI）

#### 学习目标

- 第 3 场完整模拟；有意练 Lead 或 AI 差异化叙事

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- [Lead](/interview/questions/08-architecture-lead) / [AI](/interview/questions/09-ai-vibe-coding)

#### 口述任务

模拟后检查：差异化是否讲满 5 分钟以上有效内容。

---

## W4 · 收敛与终检

### D22 — 前端架构专项

#### 学习目标

- 从业务目标、团队、规模、合规与存量系统提取约束
- 用质量属性决定边界、依赖方向、发布策略和可观测性
- 将多端 / 业务栈查漏合并进案例：只补与目标 JD 相关的一个缺口

#### 题库链接

- [前端架构](/interview/questions/14-frontend-architecture)
- [前端系统设计](/interview/questions/11-frontend-system-design)
- [架构 / Lead](/interview/questions/08-architecture-lead)

#### 口述任务

输出一页架构决策记录：约束、候选方案、决策、证据、风险、演进触发器。

---

### D23 — Cursor Rules / Skills + Vue 实践

#### 学习目标

- 为 Vue 3 项目编写一条短、可执行、按文件生效的 Rule
- 用一个 Skill 固化「读取约束 → 修改 → 验证 → 复盘」流程
- 将系统设计 #3 合并为实践评审，检查 AI 修改的架构边界、降级与验证

#### 题库链接

- [Cursor Rules](/interview/guides/ai-coding/rules)
- [Cursor Skills](/interview/guides/ai-coding/skills)
- [Vue 项目实践](/interview/guides/ai-coding/vue-project-example)

#### 口述任务

展示一次可复现实践：Rule 拦住什么偏差、Skill 复用了什么步骤、人工审查发现了什么风险。

---

### D24 — 简历 / ATS 专项

#### 学习目标

- 确认单一岗位定位、关键词覆盖、时间线与项目证据一致
- 用动作、约束、方案和量化结果改写项目经历
- 检查 ATS 可解析性；删除无法在追问中证明的架构名词

#### 题库链接

- [资深前端简历指南](/interview/resume/senior-frontend-guide)
- [ATS 检查清单](/interview/resume/ats-checklist)
- [项目改写检查清单](/interview/resume/project-rewrite-checklist)

#### 口述任务

对简历逐行做 30 秒证据检验，并用目标 JD 完成一次关键词与可信度终检。

---

### D25 — 综合架构模拟

#### 学习目标

- 完成一场融合微前端、NestJS、前端架构、AI 治理的架构模拟
- 回答必须覆盖约束识别、原理深度、故障治理与演进能力
- 合并 Java / AI 终检：只在选型与质量关卡中对比，不单独背题

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- [前端架构](/interview/questions/14-frontend-architecture)

#### 口述任务

完成 75 分钟高级前端架构模拟；按评分表记录红线、最低维度和下一次演进回答。

---

### D26 — 主故事与简历联调

#### 学习目标

- 简历逐行证据句
- 主故事根据四周模拟反馈最终定稿

#### 题库链接

- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)

#### 口述任务

90 秒版 / 5 分钟版各两遍；请人听或回听挑刺。

---

### D27 —【加练】半场彩排 / 轻量复盘

#### 学习目标

- 二选一完成：状态良好时按正式流程彩排半场（介绍 + 故事 + 5 问）
- 若已疲劳，改做轻量复盘：回看 Top 3、口述主故事 1 遍并确认次日材料，不再追加手写

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)

#### 口述任务

半场彩排与轻量复盘二选一，完成其一即完成本日 Checklist；疲劳时优先轻量复盘，调整睡眠与表达节奏，不为刷题熬夜。

---

### D28 —【周模拟 #4 · 终场】

#### 学习目标

- 最接近目标公司的完整模拟
- 评分表对比四周趋势，只做急救不新开坑

#### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)

#### 口述任务

终场模拟；写下「明天只看这三页」清单。

---

### D29 — 反问与心态

#### 学习目标

- 分层反问定稿
- 弱项「够用答法」过一遍即可，停止通宵刷新题

#### 题库链接

- [反问清单](/interview/mocks/reverse-questions)
- [总览](/interview/00-overview)

#### 口述任务

5 个反问大声念顺；想象面试结尾 3 分钟场景。

---

### D30 — 终检日

#### 学习目标

- Checklist 扫尾；确认 plan 进度与心理准备
- 材料：简历 PDF、作品/仓库链接、可选 CRUD demo 说明各就位

#### 题库链接

- [总览](/interview/00-overview)
- [14 天主线](/interview/plans/14-day)（对照是否有漏网主题）

#### 口述任务

主故事 90 秒终检；早睡。上场只带「三句必说」与反问。

---

## 进度 Checklist

勾选写入 localStorage（键：`mianshi-plan:30-day`），与 7 / 14 天互不干扰。D18～D25 中被专项完全替换的任务使用新语义 ID，不会继承旧任务的完成态；D27 已从手写任务改为半场彩排 / 轻量复盘，因此同样迁移到新语义 ID。未变任务仍沿用原 ID。D13 的 CRUD 启动是普通可选加练，不计入 Checklist；D20 通过生产化改造或等价方案二选一完成。

<PlanChecklist planId="30-day" :items='[{"id":"d1-read","label":"D1 JS/TS 核心口述与卡壳点记录"},{"id":"d2-hand","label":"D2 手写日 A 完成 2～3 题"},{"id":"d3-vue","label":"D3 Vue3 核心与页面口述完成"},{"id":"d4-hand","label":"D4 手写日 B + 主故事大纲"},{"id":"d5-story","label":"D5 主故事 5 分钟/90 秒定稿"},{"id":"d6-hand","label":"D6 手写日 C + AntDV 权限口述"},{"id":"d7-mock","label":"D7 周模拟 #1 完成并填评分表"},{"id":"d8-uni","label":"D8 uni-app/小程序口述完成"},{"id":"d9-hand","label":"D9 手写日 D 完成"},{"id":"d9-sd","label":"D9 系统设计 #1 方案口述完成"},{"id":"d10-eng","label":"D10 工程化流水线口述完成"},{"id":"d11-hand","label":"D11 手写日 E 完成"},{"id":"d11-perf","label":"D11 性能 STAR（含数字）定稿"},{"id":"d12-java","label":"D12 Java 边界与联调口述完成"},{"id":"d13-hand","label":"D13 手写日 F 完成"},{"id":"d14-mock","label":"D14 周模拟 #2 完成"},{"id":"d15-lead","label":"D15 Lead/决策故事口述完成"},{"id":"d16-hand","label":"D16 手写日 G 完成"},{"id":"d16-sd","label":"D16 系统设计 #2 口述完成"},{"id":"d17-ai","label":"D17 AI vibe coding 闭环口述完成"},{"id":"d18-microfrontend","label":"D18 微前端专项与最低弱项修正"},{"id":"d19-nest-production","label":"D19 NestJS 基础与生产口述完成"},{"id":"d20-nest-advanced","label":"D20 NestJS 高级机制复习完成"},{"id":"d20-crud-production","label":"D20 CRUD 生产化或等价生产方案完成"},{"id":"d21-mock","label":"D21 周模拟 #3 完成"},{"id":"d22-frontend-architecture","label":"D22 前端架构决策记录完成"},{"id":"d23-cursor-vue","label":"D23 Cursor Rules / Skills + Vue 实践完成"},{"id":"d23-ai-architecture-review","label":"D23 AI 修改架构评审完成"},{"id":"d24-resume-ats","label":"D24 简历 / ATS 专项终检通过"},{"id":"d25-architecture-mock","label":"D25 综合架构模拟完成"},{"id":"d25-ai-quality-review","label":"D25 Java / AI 选型与质量关卡复盘"},{"id":"d26-resume","label":"D26 简历证据句与主故事联调"},{"id":"d27-rehearsal-review","label":"D27 半场彩排/轻量复盘二选一完成"},{"id":"d28-mock","label":"D28 周模拟 #4 终场完成"},{"id":"d29-reverse","label":"D29 反问定稿与弱项够用答法"},{"id":"d30-final","label":"D30 材料与 90 秒故事终检"}]' />
