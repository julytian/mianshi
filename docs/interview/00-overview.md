# 总览与侧重点矩阵

## 一句话定位

10 年前端，主栈 Vue3 + TypeScript，覆盖 uni-app / 微信小程序与 H5；中后台用 Ant Design Vue，移动端用 Vant；AI vibe coding 时以后端 Java Spring Boot 补齐接口与简单业务闭环——面试主身份仍是前端，全栈能力用来提交付效率与联调深度，不是去抢后端岗。

---

## 规模与口径

本站统一使用以下数字（与首页、仓库 README 一致）：

- 9 个能力域
- 26 个题库
- 388 道 Q
- 242 道 D
- 630 道主问题
- 所有主问题和追问均有答案
- 7 / 14 / 30 / 60 天四条路线

**不要把 630 题当成必须全部背诵的清单。** 先对照下方矩阵标出加重与可弱化，再按岗位权重抽题。默认完整路线是 [60 天](/interview/plans/60-day)，不是从第 1 题顺序刷到最后。

---

## 目标岗位

同时覆盖四类角色，按 JD 与面试官画像切换叙事重心：

| 代号 | 岗位 | 你要证明什么 |
| ---- | ---- | ------------ |
| Senior | 资深 / 高级前端 | 业务能落地，Vue3 + TS 有深度，工程化与性能说得清 |
| Staff | Staff / 前端架构 | 能从约束推导方案，守模块边界、故障与演进，而不只是把需求做完 |
| Tech Lead | 前端 Tech Lead / 技术负责人 | 能带人、做技术决策、守质量门禁，排期与取舍有方法论 |
| 前端偏全栈 | 全栈偏前 | 能用 Spring Boot 或 NestJS 独立或与 AI 协作扛简单后端，接口与数据聊透，但仍以前端为主岗 |

先维护一份事实母版，统一保存经历、指标与证据；每次投递再按目标岗位生成一个**单一主定位版本**，只调整排序、关键词和篇幅，不改写事实。

---

## 九大能力域与岗位权重

分组与侧栏导航一致。权重表示默认投入：高 = 该岗必做，中 = 按 JD / 经历加练，低 = 被问到讲边界即可。

| 能力域 | 对应题库 | Senior | Staff | Tech Lead | 前端偏全栈 | 复习优先级 | 建议项目证据 |
| ------ | -------- | ------ | ----- | --------- | ---------- | ---------- | ------------ |
| Web 与计算机基础 | [01 JS / TS](/interview/questions/01-js-ts) · [16 HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y) · [17 浏览器与 Web API](/interview/questions/17-browser-web-api) · [18 网络与 Web 安全](/interview/questions/18-network-security) · [10 手写题](/interview/questions/10-handwriting) | 高 | 高 | 中 | 高 | P0 | 一次卡顿 / 泄漏 / 安全或缓存事故；手写工具函数真正进过仓库 |
| 框架与数据 | [02 Vue3](/interview/questions/02-vue3) · [23 Nuxt](/interview/questions/23-nuxt) · [24 Vite](/interview/questions/24-vite) · [25 Webpack](/interview/questions/25-webpack) | 高 | 高 | 高 | 高 | P0 | 复杂表单或大列表、响应式性能、SSR / 水合、一次构建器选型 |
| 工程与质量 | [03 工程化](/interview/questions/03-engineering) · [20 性能与用户体验](/interview/questions/20-performance-ux) · [21 测试与质量保障](/interview/questions/21-testing-quality) · [AI 指南](/interview/guides/ai-coding/cursor-workflow) | 高 | 高 | 高 | 中 | P0 | CI 门禁、性能预算或 Core Web Vitals、一次发布回滚；AI 协作有可复用 Rules / Skills |
| 后台与业务前端 | [04 Ant Design Vue](/interview/questions/04-admin-antdv) · [05 Vant H5](/interview/questions/05-h5-vant) | 中 | 中 | 中 | 中 | P1 | 权限 / 表格 / 表单平台，或弱网 H5 转化与状态恢复 |
| 移动端与跨平台 | [06 uni-app / 小程序](/interview/questions/06-uniapp-miniprogram) · [19 Hybrid App](/interview/questions/19-hybrid-app) | 中 | 低 | 中 | 低 | P1 | 包体积或启动耗时、Bridge 故障、多端发布与回滚；无相关经历可弱化 |
| 架构与系统设计 | [14 前端架构](/interview/questions/14-frontend-architecture) · [11 前端系统设计](/interview/questions/11-frontend-system-design) · [12 微前端](/interview/questions/12-microfrontend) | 中 | 高 | 高 | 中 | P0 | 模块边界或微前端接入、一次故障演练、演进取舍（为什么不选另一方案） |
| 运维与部署 | [26 Jenkins / Docker / k8s](/interview/questions/26-devops) · [教程](/interview/guides/devops/jenkins) | 中 | 中 | 高 | 中 | P1 | 一条真实流水线、镜像分层或一次回滚；无集群经历可只讲静态站 + CDN |
| 全栈、数据与 AI | [07 Java 全栈偏前](/interview/questions/07-java-fullstack) · [13 NestJS](/interview/questions/13-nestjs) · [15 数据库与 Prisma](/interview/questions/15-database-prisma) · [09 AI / vibe coding](/interview/questions/09-ai-vibe-coding) · [Prisma 教程](/interview/guides/backend/nestjs-prisma) | 低 | 中 | 低 | 高 | P1 | 自己设计过的接口与表、一次联调 / 事务排障；偏全栈岗升为 P0 |
| 领导力与求职 | [08 架构 / Lead](/interview/questions/08-architecture-lead) · [22 项目答辩与行为面试](/interview/questions/22-project-behavioral) · [简历](/interview/resume/senior-frontend-guide) · [模拟](/interview/mocks/scripts) | 中 | 中 | 高 | 中 | P0 | 3 / 5 / 10 分钟项目口述、一次带人或质量门禁、模拟评分表上的卡点 |

P0 默认先做，P1 按 JD 和自己的项目经历升级或降级。面试前 24 小时把领导力与求职域再过一遍，不要留到全部题库刷完。

### 自测

第一次使用不要直接开刷 60 天：

1. 对照 JD，给上表九域各标一个「高 / 中 / 低」。
2. 每个标成「高」的域，遮答案口述 2 道 Q；卡住的题号记下来。
3. 再进 [60 天完整主线](/interview/plans/60-day)，按卡点抽 D，而不是按文件顺序通刷。

---

## 26 个题库题量

| 能力域 | 编号 | 题库 | Q | D | 合计 |
| ------ | ---- | ---- | -: | -: | ---: |
| Web 与计算机基础 | 01 | [JS / TS](/interview/questions/01-js-ts) | 28 | 10 | 38 |
| | 16 | [HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y) | 12 | 8 | 20 |
| | 17 | [浏览器与 Web API](/interview/questions/17-browser-web-api) | 12 | 8 | 20 |
| | 18 | [网络与 Web 安全](/interview/questions/18-network-security) | 14 | 9 | 23 |
| | 10 | [手写题](/interview/questions/10-handwriting) | 11 | 5 | 16 |
| 框架与数据 | 02 | [Vue3](/interview/questions/02-vue3) | 31 | 14 | 45 |
| | 23 | [Nuxt](/interview/questions/23-nuxt) | 12 | 8 | 20 |
| | 24 | [Vite](/interview/questions/24-vite) | 12 | 8 | 20 |
| | 25 | [Webpack](/interview/questions/25-webpack) | 11 | 7 | 18 |
| 工程与质量 | 03 | [工程化](/interview/questions/03-engineering) | 20 | 14 | 34 |
| | 20 | [性能与用户体验](/interview/questions/20-performance-ux) | 12 | 8 | 20 |
| | 21 | [测试与质量保障](/interview/questions/21-testing-quality) | 11 | 7 | 18 |
| 后台与业务前端 | 04 | [Ant Design Vue](/interview/questions/04-admin-antdv) | 14 | 8 | 22 |
| | 05 | [Vant H5](/interview/questions/05-h5-vant) | 12 | 8 | 20 |
| 移动端与跨平台 | 06 | [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram) | 17 | 8 | 25 |
| | 19 | [Hybrid App](/interview/questions/19-hybrid-app) | 13 | 9 | 22 |
| 架构与系统设计 | 14 | [前端架构](/interview/questions/14-frontend-architecture) | 15 | 15 | 30 |
| | 11 | [前端系统设计](/interview/questions/11-frontend-system-design) | 7 | 6 | 13 |
| | 12 | [微前端](/interview/questions/12-microfrontend) | 19 | 15 | 34 |
| 运维与部署 | 26 | [Jenkins / Docker / k8s](/interview/questions/26-devops) | 14 | 8 | 22 |
| 全栈、数据与 AI | 07 | [Java 全栈偏前](/interview/questions/07-java-fullstack) | 14 | 8 | 22 |
| | 13 | [NestJS](/interview/questions/13-nestjs) | 20 | 16 | 36 |
| | 15 | [数据库与 Prisma](/interview/questions/15-database-prisma) | 17 | 10 | 27 |
| | 09 | [AI / vibe coding](/interview/questions/09-ai-vibe-coding) | 13 | 8 | 21 |
| 领导力与求职 | 08 | [架构 / Lead](/interview/questions/08-architecture-lead) | 17 | 9 | 26 |
| | 22 | [项目答辩与行为面试](/interview/questions/22-project-behavioral) | 10 | 8 | 18 |
| **合计** | | **26 个题库** | **388** | **242** | **630** |

工程与质量域另有 [AI 编程实践](/interview/guides/ai-coding/cursor-workflow) 五篇指南；运维域另有 [Jenkins](/interview/guides/devops/jenkins) / [Docker](/interview/guides/devops/docker) / [Kubernetes](/interview/guides/devops/k8s) 教程；全栈域另有 [NestJS + Prisma 教程](/interview/guides/backend/nestjs-prisma)；领导力域另有简历套件与模拟材料。指南不计入 630 道主问题。

---

## 侧重点矩阵

先选公司类型（或 Lead 面场次），再决定「加重」与「可弱化」。目标是少背、多打准，而不是整库通刷。

| 公司类型 | 加重 | 可弱化 |
| -------- | ---- | ------ |
| 大厂 / 中大厂 | JS/TS、Vue 原理、手写、性能、系统设计 | 业务组件细节；Java 只保留接口与协作 |
| 业务型 / ToB | 后台架构、工程化、稳定性、AntDV、Java 联调 | 算法深度、微服务八股 |
| 外包 / 交付 | 多端、uni-app、交付节奏、踩坑 | 过深原理 |
| 创业 / AI | AI 协作、Vue+Java 快速闭环、产品感 | 八股堆叠 |
| Lead 面 | 带人、技术决策、质量门禁、排期取舍、前后端分工 | 单纯背题 |

### 怎么用这张表

1. **投递前**：对照 JD 标出「加重」列对应模块，计划里优先排这些天。
2. **面试前一天**：弱化列只扫标题与踩坑，不深挖答案。
3. **临场**：被问到弱化区，答到「够用 + 边界」即可，主动把话头拉回加重区的项目证据。

---

## Java 叙事边界

全栈偏前是差异化，不是第二套八股战场。默认口径：

- **主路径**：Spring Boot + MyBatis-Plus + MySQL
- **按需**：Redis、消息队列（场景级：缓存热点、异步解耦、防重提交）
- **微服务**：点到为止——为什么拆、网关对前端的影响、环境与配置意识；不深挖中间件源码
- **明确不做**：JVM 调优、分布式事务论文级讲解、与专职后端拼中间件细节

面试主身份始终是 **前端 / 前端 Lead**。Java 部分定位为：能独立扛简单后端、能设计接口、能联调排障、能用 AI 加速交付。Node.js 仅保留工程脚本 / BFF 认知，不再作为全栈主后端叙事。

---

## 怎么用本站

推荐路径（可按时间压力裁剪）：

1. **选岗位与公司类型** —— 对照上方能力域矩阵和公司类型表，标出加重模块
2. **自测** —— 每个加重域口述 2 道 Q，记下卡点
3. **先 Q 后 D** —— Q 题用于建立知识面与高频答法，D 题用于原理、故障和架构追问
4. **进完整主线** —— 默认走 [60 天完整主线](/interview/plans/60-day)
5. **题库对答案** —— 按计划抽题，先想再展开参考答案；不要按 01～22 通刷
6. **故事与模拟** —— 用 [故事模板](/interview/stories/template) 打磨项目口述，再用 [模拟脚本](/interview/mocks/scripts) 按公司类型过场

时间不够或需要加练时：

- **[14 天冲刺版](/interview/plans/14-day)**：约 2 周窗口的常规压缩
- **[7 天压缩版](/interview/plans/7-day)**：砍手写 / 系统设计深挖，保留 Vue3、工程化、主项目故事、AI + Java 叙事与 1 场模拟
- **[30 天强化版](/interview/plans/30-day)**：在 14 天骨架上加弱项回炉、更多手写与系统设计、多场模拟

本地预览：`pnpm docs:dev`；构建校验：`pnpm docs:build`。

---

### Q / D 分层与学习顺序

- **Q 题：** 高频基础与场景判断。先遮住答案口述 1～2 分钟，目标是覆盖完整、结论准确。
- **D 题：** 深层追问。按「基础结论 → 原理深挖 → 工程场景 → 反例 / 踩坑 → 演进条件」回答，目标是证明资深判断力。
- **第一轮：** 主栈与 P0 域只做 Q 题，快速建立地图并标记卡壳点。
- **第二轮：** 按 JD 选择微前端、NestJS、前端架构、Hybrid、性能等专项，完成高频 Q 题与计划指定 D 题。
- **第三轮：** 把 D 题答案接到项目故事、简历证据和模拟面试，不再孤立背诵。

---

## 题型说明

题库以 Q / D 分层组织，并用以下结构保证「先想后对」和「能追问」：

| 段落 | 作用 |
| ---- | ---- |
| **题目** | 题干本身，默认展开 |
| **考察点** | 面试官真正想听的能力点，避免答偏 |
| **参考答案** | 完整可口述版本；站点里用 `<details>` 折叠，默认收起 |
| **追问链** | 高频题必有：一层层往深挖时怎么接 |
| **踩坑** | 常见错答、边界与生产里容易翻车的点 |

阅读建议：遮住答案口述 1～2 分钟 → 展开对标 → 顺着追问链再答一轮 → 把卡壳点记进当天计划或故事模板。
