# 30 天加练版

在 [14 天主线](/interview/plans/14-day) 骨架上拉长节奏：**隔日手写、每周系统设计、每周完整模拟**，可选叠加 **Spring Boot CRUD + Vue 口述闭环**。适合窗口 ≥ 一个月、或弱项较多需要回炉的资深同学。

先读 [总览与侧重点矩阵](/interview/00-overview)。执行原则：**14 天内容不加水稀释，用加练日做深度与肌肉记忆**；忙时优先保住主故事、Vue3、工程化与当周模拟。

---

## 节奏约定

| 节奏 | 做法 |
| ---- | ---- |
| 隔日手写 | 偶数日从 [手写题库](/interview/questions/10-handwriting) 抽 2～3 题，限时白板/编辑器 |
| 系统设计 | 每周固定半天：读 [前端系统设计](/interview/questions/11-frontend-system-design)，画一页方案口述 |
| 完整模拟 | 每周 1 场（建议周末），用 [模拟脚本](/interview/mocks/scripts) + [评分表](/interview/mocks/scorecard) |
| 可选 Java 闭环 | 第 3～4 周任选 2～3 个晚上：最小 Spring Boot CRUD + Vue 管理页，练 AI 协作口述 |

四周映射（可按入职日期平移）：

| 周次 | 对应 14 天阶段 | 加练重点 |
| ---- | -------------- | -------- |
| W1（D1–D7） | 底座 + 多端前半 | 手写打底、第 1 场模拟 |
| W2（D8–D14） | 多端收尾 + 工程/性能/Java | 系统设计 #1、第 2 场模拟 |
| W3（D15–D21） | Lead + AI + 回炉 | 系统设计 #2、可选 CRUD 闭环启动、第 3 场模拟 |
| W4（D22–D30） | 弱项收敛 + 终检 | 系统设计 #3、第 4 场模拟、反问与简历终检 |

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

### D18 —【加练】手写日 H + 弱项回炉 A

#### 学习目标

- 手写 2 题
- 按模拟评分回炉最弱模块半天

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- 弱项自选题库

#### 口述任务

弱项模块产出「够用答法」卡片 5 张。

---

### D19 — 弱项回炉 B（原理或工程）

#### 学习目标

- 继续挖评分第二弱项
- 主故事穿插新证据句（若本周项目/CRUD 有新素材）

#### 题库链接

- 自选；建议回看 [Vue3](/interview/questions/02-vue3) 或 [工程化](/interview/questions/03-engineering)

#### 口述任务

针对第二弱项做 3 轮自问自答。

---

### D20 —【加练】手写日 I +（可选）CRUD 闭环收口

#### 学习目标

- 手写 2 题
- **可选**：给 CRUD 补鉴权/校验/错误码，并整理口述稿

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [AI vibe coding](/interview/questions/09-ai-vibe-coding)
- [Java 全栈](/interview/questions/07-java-fullstack)

#### 口述任务

可选：完整讲一遍「表结构 → API → Vue 页 → 联调坑」。

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

### D22 — 多端 / 业务栈查漏

#### 学习目标

- 回看 AntDV、Vant、uni-app 三章踩坑，补缺口

#### 题库链接

- [AntDV](/interview/questions/04-admin-antdv)
- [Vant](/interview/questions/05-h5-vant)
- [uni-app](/interview/questions/06-uniapp-miniprogram)

#### 口述任务

按目标 JD 只深挖一条业务栈，其余保持「够用」。

---

### D23 —【加练】手写日 J + 系统设计 #3

#### 学习目标

- 手写 2～3 题（可复盘错题变体）
- 第三道系统设计，强调演进与降级

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [前端系统设计](/interview/questions/11-frontend-system-design)

#### 口述任务

系统设计口述加入「监控与回滚」段落。

---

### D24 — 性能与工程终检

#### 学习目标

- 流水线 + 性能案例再压一遍时间
- 对照大厂/ToB 矩阵确认加重项已覆盖

#### 题库链接

- [工程化](/interview/questions/03-engineering)
- [总览矩阵](/interview/00-overview)

#### 口述任务

计时：流水线 3 分钟 + 性能 3 分钟，连续录。

---

### D25 —【加练】手写日 K + Java/AI 终检

#### 学习目标

- 手写 2 题
- Java 边界话术 + AI 关卡话术连练

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [Java](/interview/questions/07-java-fullstack)
- [AI](/interview/questions/09-ai-vibe-coding)

#### 口述任务

连说：接口约定 2 分钟 → AI 闭环 3 分钟，中间不停顿。

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

### D27 —【加练】手写日 L + 模拟彩排

#### 学习目标

- 轻量手写 1～2 题保手感
- 按正式流程彩排半场（介绍 + 故事 + 5 问）

#### 题库链接

- [手写](/interview/questions/10-handwriting)
- [模拟脚本](/interview/mocks/scripts)

#### 口述任务

彩排计时；调整睡眠与表达节奏，不为刷题熬夜。

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

勾选写入 localStorage（键：`mianshi-plan:30-day`），与 7 / 14 天互不干扰。条目覆盖每日核心动作；可选 CRUD 单独勾选。

<PlanChecklist planId="30-day" :items='[{"id":"d1-read","label":"D1 JS/TS 核心口述与卡壳点记录"},{"id":"d2-hand","label":"D2 手写日 A 完成 2～3 题"},{"id":"d3-vue","label":"D3 Vue3 核心与页面口述完成"},{"id":"d4-hand","label":"D4 手写日 B + 主故事大纲"},{"id":"d5-story","label":"D5 主故事 5 分钟/90 秒定稿"},{"id":"d6-hand","label":"D6 手写日 C + AntDV 权限口述"},{"id":"d7-mock","label":"D7 周模拟 #1 完成并填评分表"},{"id":"d8-uni","label":"D8 uni-app/小程序口述完成"},{"id":"d9-hand","label":"D9 手写日 D 完成"},{"id":"d9-sd","label":"D9 系统设计 #1 方案口述完成"},{"id":"d10-eng","label":"D10 工程化流水线口述完成"},{"id":"d11-hand","label":"D11 手写日 E 完成"},{"id":"d11-perf","label":"D11 性能 STAR（含数字）定稿"},{"id":"d12-java","label":"D12 Java 边界与联调口述完成"},{"id":"d13-hand","label":"D13 手写日 F 完成"},{"id":"d13-crud","label":"D13 可选：CRUD+Vue 闭环启动"},{"id":"d14-mock","label":"D14 周模拟 #2 完成"},{"id":"d15-lead","label":"D15 Lead/决策故事口述完成"},{"id":"d16-hand","label":"D16 手写日 G 完成"},{"id":"d16-sd","label":"D16 系统设计 #2 口述完成"},{"id":"d17-ai","label":"D17 AI vibe coding 闭环口述完成"},{"id":"d18-hand","label":"D18 手写日 H + 弱项回炉 A"},{"id":"d19-weak","label":"D19 弱项回炉 B 完成"},{"id":"d20-hand","label":"D20 手写日 I 完成"},{"id":"d20-crud","label":"D20 可选：CRUD 闭环收口口述"},{"id":"d21-mock","label":"D21 周模拟 #3 完成"},{"id":"d22-biz","label":"D22 业务栈查漏按 JD 完成"},{"id":"d23-hand","label":"D23 手写日 J 完成"},{"id":"d23-sd","label":"D23 系统设计 #3 口述完成"},{"id":"d24-eng","label":"D24 工程+性能终检计时通过"},{"id":"d25-hand","label":"D25 手写日 K 完成"},{"id":"d25-ai","label":"D25 Java/AI 连练口述完成"},{"id":"d26-resume","label":"D26 简历证据句与主故事联调"},{"id":"d27-hand","label":"D27 手写日 L + 半场彩排"},{"id":"d28-mock","label":"D28 周模拟 #4 终场完成"},{"id":"d29-reverse","label":"D29 反问定稿与弱项够用答法"},{"id":"d30-final","label":"D30 材料与 90 秒故事终检"}]' />
