# 7 天压缩版

从 [14 天主线](/interview/plans/14-day) 裁剪而来。砍掉手写深挖、系统设计周更、第二场模拟与多端全覆盖；**保留 Vue3、工程化、主项目故事、AI + Java、1 场模拟**。

先读 [总览与侧重点矩阵](/interview/00-overview)，只加重与目标 JD 强相关的模块。每天默认投入更饱和：题库扫「考察点 + 踩坑」，答案不全背，主故事与模拟优先级最高。

---

## 阶段总览

| 天数 | 重心 |
| ---- | ---- |
| D1 | JS/TS 快扫 + Vue3 核心 |
| D2 | 主项目故事压实 |
| D3 | 工程化 + 性能案例一条 |
| D4 | 业务面补强（AntDV 或 Vant/多端二选一加重） |
| D5 | Java 边界 + AI vibe coding |
| D6 | Lead 要点（可弱化）+ 模拟彩排 |
| D7 | 正式模拟 ×1 + 反问终检 |

---

## D1 — Vue3 为主，JS/TS 托底

### 学习目标

- Vue3 响应式、组件通信、组合式复用能稳定口述
- JS/TS 只补高频坑：事件循环、`unknown`、泛型约束、Promise 并发
- 建立遮答案口述节奏，避免通读拖进度

### 题库链接

- [Vue3 题库](/interview/questions/02-vue3)
- [JS/TS 题库](/interview/questions/01-js-ts)（标题 + 踩坑扫一遍即可）

### 口述任务

选主项目一个复杂组件，4 分钟讲清状态、副作用与卸载；顺带点出 1 个 TS 约束收益。

---

## D2 — 主项目故事

### 学习目标

- 产出可上场的 5 分钟 STAR + 90 秒电梯版
- 量化结果；准备失败与取舍两个追问分支
- 简历主项目每一句都能落到故事里的证据

### 题库链接

- [故事模板](/interview/stories/template)
- [故事示例](/interview/stories/examples)
- 回链 [Vue3](/interview/questions/02-vue3)

### 口述任务

录音两遍主故事；第二遍只看提纲不看稿。写下「三句必说」。

---

## D3 — 工程化与性能

### 学习目标

- 一条完整交付链路：规范 → 构建 → CI → 发布 / 回滚
- 准备 **一个** 有数字的性能案例（比堆优化手段更重要）
- 质量门禁用「我们团队实际怎么做」叙述，避免空概念

### 题库链接

- [工程化题库](/interview/questions/03-engineering)

### 口述任务

3 分钟流水线 + 3 分钟性能 STAR；控制总时长，练抗追问。

---

## D4 — 业务栈快补（选加重面）

### 学习目标

- 按 JD：**中后台加重 AntDV**，或 **H5/多端加重 Vant / uni-app**
- 另一侧只扫标题与踩坑，上场够用即可
- 权限、列表性能、多端分包等各准备一个「够深」的点

### 题库链接

- [中后台 AntDV](/interview/questions/04-admin-antdv)
- [H5 / Vant](/interview/questions/05-h5-vant)
- [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)

### 口述任务

只练与目标岗位匹配的那条线，4 分钟讲透一个业务技术点（含踩坑）。

---

## D5 — AI + Java（差异化）

### 学习目标

- Java 叙事严格落在总览边界内：接口、联调、简单 CRUD、协作
- AI vibe coding：提效闭环 + 人工守关（安全、边界、可维护）
- 准备「Vue 管理页 + Spring Boot 接口」一日闭环口述

### 题库链接

- [AI vibe coding](/interview/questions/09-ai-vibe-coding)
- [Java 全栈](/interview/questions/07-java-fullstack)
- [总览 · Java 叙事边界](/interview/00-overview)

### 口述任务

5 分钟讲清：需求怎么拆给 AI、你怎么审、怎么测、哪些地方绝不盲信模型。

---

## D6 — Lead 要点 + 模拟彩排

### 学习目标

- Lead 面若相关：决策、带人、排期、门禁各准备一个短例子
- 非 Lead 岗：只保留「技术决策取舍」一段，不硬撑管理八股
- 过一遍模拟脚本结构，熟悉开场与转场

### 题库链接

- [架构 / Lead](/interview/questions/08-architecture-lead)（按需）
- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)

### 口述任务

彩排：自我介绍 90 秒 → 主故事 5 分钟 → 自问 3 个追问；计时录音。

---

## D7 — 正式模拟 ×1 + 反问终检

### 学习目标

- 按目标公司类型完整模拟一场（45–60 分钟）
- 用评分表定位弱点，只做「上场急救」不扩战线
- 反问与简历证据句终检

### 题库链接

- [模拟脚本](/interview/mocks/scripts)
- [评分表](/interview/mocks/scorecard)
- [反问清单](/interview/mocks/reverse-questions)
- [总览](/interview/00-overview)

### 口述任务

完成正式模拟并填评分表；准备 5 个反问；主故事 90 秒版再过一遍。

---

## 进度 Checklist

勾选写入 localStorage（键：`mianshi-plan:7-day`），与 14 / 30 天互不干扰。

<PlanChecklist planId="7-day" :items='[{"id":"d1-vue","label":"D1 Vue3 核心题遮答案口述完成"},{"id":"d1-js","label":"D1 JS/TS 高频坑扫完并记下卡壳点"},{"id":"d1-oral","label":"D1 完成复杂组件 4 分钟口述"},{"id":"d2-star","label":"D2 主项目 STAR 与指标写完"},{"id":"d2-oral5","label":"D2 5 分钟主故事录音通过"},{"id":"d2-oral90","label":"D2 90 秒电梯版练熟"},{"id":"d3-eng","label":"D3 工程化流水线口述完成"},{"id":"d3-perf","label":"D3 性能 STAR（含数字）准备好"},{"id":"d3-gate","label":"D3 质量门禁落地说法能讲清"},{"id":"d4-focus","label":"D4 按 JD 选定加重业务栈并读透"},{"id":"d4-oral","label":"D4 业务技术点 4 分钟口述完成"},{"id":"d4-skip","label":"D4 非加重侧仅扫标题与踩坑"},{"id":"d5-java","label":"D5 Java 边界内题库过完"},{"id":"d5-ai","label":"D5 AI+Vue+Java 闭环口述完成"},{"id":"d5-guard","label":"D5 说清人工质量关卡"},{"id":"d6-lead","label":"D6 Lead/决策短例子准备好（按需）"},{"id":"d6-rehearse","label":"D6 模拟彩排（介绍+故事+追问）完成"},{"id":"d6-timer","label":"D6 彩排全程计时并回听一遍"},{"id":"d7-mock","label":"D7 正式模拟 ×1 完成并填评分表"},{"id":"d7-fix","label":"D7 针对评分短板做上场急救"},{"id":"d7-reverse","label":"D7 5 个反问 + 简历证据句终检"}]' />
