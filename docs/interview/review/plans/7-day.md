# 面试前 7 天

> **适合场景：** 约一周窗口，回炉薄弱域 + 2 个专题 + 1～2 场模拟。
>
> **每日时长：** 90～150 分钟。**场次时长计入当日预算**（模拟净时长 + 简短复盘都算进当天）。
>
> **完成标准：** 当天主题可遮稿口述；卡点写入笔记；薄弱域至少回炉一次。
>
> **任务 ID 前缀：** `r7-d{n}-{slug}`（禁止复用 60 天计划 ID）。

与学习路线中的 [7 天压缩版](/interview/plans/7-day) 不同：本页是复习模块临场回炉。入口见 [复习总览](/interview/review/00-overview)。

---

## 阶段总览

| 天数 | 重心 | 任务 ID |
| ---- | ---- | ------- |
| D1 | 主栈速记：框架与数据 + JS / TS 专题入口 | `r7-d1-core-sheets` |
| D2 | 专题一：Vue3 响应式与渲染 | `r7-d2-vue-topic` |
| D3 | 工程与质量速记 + 性能专题入口 | `r7-d3-eng-perf` |
| D4 | 专题二：按 JD 四选一（构建 / 微前端 / 全栈 / Hybrid） | `r7-d4-jd-topic` |
| D5 | 薄弱域速记回炉 + 主故事 | `r7-d5-weak-story` |
| D6 | 模拟 ×1 + 行为 / Lead | `r7-d6-mock` |
| D7 | 第二场模拟或终检 + 反问 | `r7-d7-final` |

---

### D1 — 主栈速记快扫

任务 ID：`r7-d1-core-sheets`

#### 学习目标

- 框架与数据域结论卡可口述
- JS 运行时与 TS 类型各建立 5 分钟入口印象
- 标出本周要深挖的 2 个专题（专题一默认 Vue3；专题二 D4 四选一）

#### 材料

- [框架与数据速记](/interview/review/sheets/02-framework-data)
- [Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)
- [JS 运行时与异步](/interview/review/topics/01-js-runtime)
- [TypeScript 类型系统](/interview/review/topics/02-ts-types)
- 真源快链：[01 JS/TS 题库](/interview/questions/01-js-ts)、[02 Vue3 题库](/interview/questions/02-vue3)

#### 必做输出

- 遮稿口述 [02 框架与数据](/interview/review/sheets/02-framework-data) 核心结论卡 8～10 分钟；卡点回链题库题号
- [01 JS 运行时](/interview/review/topics/01-js-runtime)、[02 TS 类型](/interview/review/topics/02-ts-types) 各做 5 分钟入口口述（战场句 + 知识地图即可）
- 写下本周专题二选题（构建 / 微前端 / 全栈 / Hybrid 四选一）及理由一句
- 卡点清单起步 ≥ 3 条

#### 验收标准

主栈速记遮稿可讲；专题二选题已写下。

---

### D2 — 专题一：Vue3 响应式与渲染

任务 ID：`r7-d2-vue-topic`

#### 学习目标

- 按专题主线讲完 15 分钟版本
- 追问树至少走到第二层
- 卡点回链题库，不另编口径

#### 材料

- [Vue3 响应式与渲染](/interview/review/topics/05-vue-reactivity)
- [框架与数据速记](/interview/review/sheets/02-framework-data)
- 真源：[02 Vue3 题库](/interview/questions/02-vue3)

#### 必做输出

- 按专题「完整讲解」讲满 15 分钟主线；对照页末「15 分钟口述验收清单」勾选
- 追问树至少选 2 条主问走到 L2；卡点写回 [02 Vue3](/interview/questions/02-vue3) 对应 Q/D
- 用自己的项目填 1 个证据坑位（大列表 / 水合 / KeepAlive 任选），禁止抄示例数字
- 与 [02 速记](/interview/review/sheets/02-framework-data) 交叉核对版本红线（Suspense / KeepAlive / Vite 生产默认等）

#### 验收标准

15 分钟口述验收清单勾选过半。

---

### D3 — 工程、性能与质量

任务 ID：`r7-d3-eng-perf`

> **砍枝优先级：** ① 工程链路 3 分钟口述 + 性能/门禁主线口述 → ② 一条带数字的 STAR 提纲 → ③ 浏览器渲染补丁 / 更深 L2。超时先砍 ③，再缩短 ② 到关键词提纲。

#### 学习目标

- 工程与质量速记可讲一条交付链路
- 性能 / 测试专题建立入口与证据坑位
- 准备一个带数字的性能或门禁案例坑位

#### 材料

- [工程与质量速记](/interview/review/sheets/03-engineering-quality)
- [性能、测试与质量门禁](/interview/review/topics/08-perf-testing)
- [浏览器渲染与性能底座](/interview/review/topics/03-browser-rendering)
- 真源快链：[03 工程化](/interview/questions/03-engineering)、[20 性能](/interview/questions/20-performance-ux)、[21 测试](/interview/questions/21-testing-quality)

#### 必做输出

- 口述「规范 → 构建 → CI → 发布 / 回滚」3 分钟（材料：[03 工程速记](/interview/review/sheets/03-engineering-quality)）
- [08 性能 / 测试专题](/interview/review/topics/08-perf-testing) 讲 10～15 分钟入口主线（必做）
- 写下 **一条** 带自己数字的性能或门禁 STAR 提纲（基线 → 手段 → 验证 → 防护）
- **可选（预算有余）：** [03 浏览器渲染](/interview/review/topics/03-browser-rendering) 只补与性能相关的 ≤5 分钟；超时则跳过，卡点回链题库即可

#### 验收标准

流水线 + 性能 / 门禁各能口述 3 分钟。

---

### D4 — 专题二：按 JD 加深

任务 ID：`r7-d4-jd-topic`

#### 学习目标

- 从构建、微前端、全栈、Hybrid 四选一写满 15 分钟主线
- 版本口径与题库一致
- 准备工程取舍与故障案例模板一则

#### 材料（按 JD 四选一）

- [Vite 与 Webpack 构建器](/interview/review/topics/07-vite-webpack) + [工程与质量速记](/interview/review/sheets/03-engineering-quality)
- [微前端与前端架构](/interview/review/topics/09-microfrontend-architecture) + [架构与系统设计速记](/interview/review/sheets/06-architecture)
- [全栈数据与 Nest / Prisma](/interview/review/topics/10-fullstack-data) + [全栈、数据与 AI 速记](/interview/review/sheets/08-fullstack-ai)
- [Hybrid / 小程序 / H5](/interview/review/topics/11-hybrid-miniapp-h5) + [移动端与跨平台速记](/interview/review/sheets/05-mobile-cross)

#### 必做输出

- 选定一篇专题，按「战场 → 知识地图 → 完整讲解」讲满 15 分钟；勾选该页验收清单过半
- 写 1 则「约束 → 方案 → 取舍 → 验证」故障 / 选型案例（数字用自己的）
- 配套速记结论卡遮稿快讲 5 分钟，标出与专题冲突的口径（若有则回题库）
- 无相关经历时：只保留「边界叙事 + 够用边界」，并在笔记标明「不上深水区」

#### 验收标准

所选专题可独立讲 15 分钟主线。

---

### D5 — 薄弱域 + 主故事

任务 ID：`r7-d5-weak-story`

#### 学习目标

- 回炉 1～2 个薄弱域速记
- 压实主项目 STAR
- 故事与简历证据对齐

#### 材料

- 薄弱域自 [速记索引](/interview/review/00-overview#_9-篇速记册) 选取（常见： [04 后台业务](/interview/review/sheets/04-admin-business)、[06 架构](/interview/review/sheets/06-architecture)、[07 运维](/interview/review/sheets/07-devops)、[01 Web 基础](/interview/review/sheets/01-web-fundamentals)）
- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)
- [领导力与求职速记](/interview/review/sheets/09-leadership)
- [Lead、行为与项目答辩](/interview/review/topics/12-lead-behavioral)（预读战场句）

#### 必做输出

- 选 1～2 个薄弱域，各遮稿口述 5～8 分钟；卡点写回对应题库模块
- 按模板产出 5 分钟 STAR + 90 秒电梯版；录音第二遍只看提纲
- 准备失败 / 取舍两个追问分支，并与简历数字一一勾对
- [09 领导力速记](/interview/review/sheets/09-leadership) 扫结论卡，标出明日模拟要用的协作 / 决策钩子

#### 验收标准

薄弱域结论卡可讲；主故事可脱稿。

---

### D6 — 模拟与行为

任务 ID：`r7-d6-mock`

> **时长提醒：** 场次时长计入当日预算。本场优先 **60 分钟** 档脚本；Lead 追问树预算不够可砍到 1 条主问。

#### 学习目标

- 完成第 1 场完整模拟
- 行为 / Lead 追问有收口
- 用评分表记下卡点

#### 材料

- [模拟脚本](/interview/mocks/scripts)（推荐 60 分钟档：[脚本一](/interview/mocks/scripts#脚本一-业务型中小厂-可抽查-java-联调) / [脚本三](/interview/mocks/scripts#脚本三-lead-面-分工、质量、技术选型) / [脚本九 性能质量](/interview/mocks/scripts#脚本九-性能、测试与质量-60-分钟)）
- [评分表](/interview/mocks/scorecard)
- [Lead、行为与项目答辩](/interview/review/topics/12-lead-behavioral)
- [领导力与求职速记](/interview/review/sheets/09-leadership)
- 真源：[22 项目答辩与行为](/interview/questions/22-project-behavioral)

#### 必做输出

- 完整跑完 1 场 **60 分钟档**脚本（无搭档用单人自测版）；复盘用评分表打分（复盘限 5～10 分钟，计入预算）
- 写下本场 Top 5 卡点，并标注回炉材料（速记 / 专题 / 题库）
- [12 Lead / 行为专题](/interview/review/topics/12-lead-behavioral) 追问树：预算够则走 2 条到 L2；超时砍到 1 条主问即可
- 主故事电梯版在模拟开场再练 1 遍，修正超时与空话

#### 验收标准

模拟完成；卡点清单可进入 D7。

---

### D7 — 终检或第二场模拟

任务 ID：`r7-d7-final`

> **时长提醒：** 若选第二场模拟，**优先 60 分钟档**（脚本十等）；勿默认上 75 分钟脚本十一。场次时长计入当日预算。

#### 学习目标

- 按精力选：第二场模拟，或只回炉卡点
- 反问清单终检
- 不再新开专题

#### 材料

- [反问清单](/interview/mocks/reverse-questions)
- [评分表](/interview/mocks/scorecard)
- D1～D6 卡点对应速记 / 专题（见 [复习总览](/interview/review/00-overview)）
- 可选第二场：[模拟脚本](/interview/mocks/scripts)（**优先** [脚本十 · 60 分钟](/interview/mocks/scripts#脚本十-项目答辩与行为面试-60-分钟) / [脚本一](/interview/mocks/scripts#脚本一-业务型中小厂-可抽查-java-联调)；仅精力充足且目标 Staff/Lead 终场时再考虑 [脚本十一 · 75 分钟](/interview/mocks/scripts#脚本十一-综合终场-75-分钟)）

#### 必做输出

- **二选一：**（A）第二场完整模拟并评分（默认 60 分钟档）；或（B）只回炉 D6 Top 5 卡点，每条遮稿口述通过
- 合并一周卡点为「上场最高频 5 条」，全部口述勾选（若已做模拟且预算紧，可与模拟复盘合并，不重复两轮）
- 从 [反问清单](/interview/mocks/reverse-questions) 定 3～5 条上场版
- 禁止新开专题；睡眠优先于通宵背题

#### 验收标准

最高频 5 个卡点各口述通过；反问上场版已定。
