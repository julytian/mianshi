# 60 天完整复习主线

面向通用资深前端（Vue3 / 多端 / 全栈偏前）的默认完整路线。7 / 14 / 30 天是压缩方案，见 [7 天压缩版](/interview/plans/7-day)、[14 天冲刺版](/interview/plans/14-day)、[30 天强化版](/interview/plans/30-day)。先读 [总览与侧重点矩阵](/interview/00-overview)，按 JD 标出加重模块后再抽题。

**60 天不是 630 题顺序通刷。** 每天按岗位权重抽题：Q 题遮答案口述，D 题必须绑到你自己的项目证据。每日完成标准是「可口述 + 有输出 + 记录卡点」，不是把页面读完。

加练模块（不另开天数，按 JD 挂到邻近日）：[Nuxt](/interview/questions/23-nuxt) 并入 Vue SSR 日；[Vite](/interview/questions/24-vite) / [Webpack](/interview/questions/25-webpack) 并入 Vite 构建日；[Jenkins / Docker / k8s](/interview/questions/26-devops) 与 [部署教程](/interview/guides/devops/jenkins) 并入 CI / 发布日。

---

## 执行规则

| 规则 | 做法 |
| ---- | ---- |
| 时长 | 每天 **60～120 分钟**；超时就停，把没做完的题号记到次日，不靠通宵补进度 |
| Q / D | Q 题先想 90 秒再对答案；D 题必须落到项目约束、指标、故障或取舍 |
| 周节奏 | **5 天学习、1 天输出、1 天模拟 / 复盘** |
| 周输出 | 每周至少 **2 次** 手写或系统设计（限时写代码，或一页方案 + 口述） |
| 抽题 | 只做当日列出的题号范围或主题，禁止「把某库刷完」 |
| 记录 | 当天至少记下 2 个卡点：不会讲、讲不稳、或证据对不上简历 |

推荐材料入口（按需点开，不必每天全读）：

- 模拟：[模拟脚本](/interview/mocks/scripts) · [评分表](/interview/mocks/scorecard) · [反问清单](/interview/mocks/reverse-questions)
- 故事与简历：[故事模板](/interview/stories/template) · [故事示例](/interview/stories/examples) · [资深前端简历指南](/interview/resume/senior-frontend-guide)
- 全栈闭环：[NestJS + Prisma 教程](/interview/guides/backend/nestjs-prisma)
- 上线：[Jenkins 教程](/interview/guides/devops/jenkins) · [Docker 教程](/interview/guides/devops/docker) · [Kubernetes 教程](/interview/guides/devops/k8s)
- AI 工作流：[Cursor 工作流](/interview/guides/ai-coding/cursor-workflow) · [前端 Rules](/interview/guides/ai-coding/rules)

---

## 阶段总览

| 阶段 | 天数 | 主题 | 阶段输出日 |
| ---- | ---- | ---- | ---------- |
| 一 | D1–D8 | JS / TS、HTML、CSS、可访问性 | D8：HTML / CSS / A11y 审计清单 |
| 二 | D9–D16 | 浏览器、Web API、网络、安全、手写 | D16：浏览器、网络、安全和手写模拟 |
| 三 | D17–D24 | Vue3 响应式、调度、渲染、组件、状态、性能、SSR | D24：Vue 专项模拟 |
| 四 | D25–D32 | Vite、CI、测试、性能、可观测性 | D32：质量门禁与性能治理方案 |
| 五 | D33–D39 | 管理后台、Vant H5、业务场景 | D39：后台 / H5 业务案例 |
| 六 | D40–D46 | 小程序、uni-app、Hybrid App | D46：小程序 / Hybrid 选型与 Bridge 方案 |
| 七 | D47–D52 | MySQL、Prisma、NestJS、Java、AI | D52：NestJS + Prisma 最小闭环 |
| 八 | D53–D57 | 前端架构、系统设计、微前端、故障 | D57：端到端系统设计 |
| 九 | D58–D60 | Lead、行为、简历、综合模拟 | D60：75 分钟综合模拟和九维评分 |

建议按自然周平移：学习日做题，输出日交清单 / 方案，模拟日走脚本并填评分表。忙时优先保住当周输出日和模拟日，而不是把落下的 Q 题通宵补完。

---

## 第一阶段 · D1–D8 · 语言与页面底座

### D1 — JS 运行时与语言边界

<!-- id: d01-js-runtime -->

任务 ID：`d01-js-runtime`

#### 学习目标

- 把闭包、`this`、对象 / `Map` / `Set` 讲成「会在线上出什么事故」，不背定义
- 说清 `Proxy` 相对 `defineProperty` 的边界，以及隐藏类为什么不能当语言规范背
- 建立遮答案口述节奏：先 90 秒，再对 [JS / TS 题库](/interview/questions/01-js-ts)

#### 题库与材料

- [JS / TS](/interview/questions/01-js-ts)：Q4、Q6、Q17–Q21、Q27；D 题只选 **D1 或 D7** 一题
- [总览](/interview/00-overview)：标出你的加重岗位，后面抽题按这个权重

#### 必做输出

- 遮答案口述 4 道 Q，每题控制在 90 秒
- 用主项目一次卡顿或泄漏，3 分钟讲 D1 或 D7
- 写下 2 个卡点（术语不稳 / 证据对不上均可）

#### 验收标准

- 能不看答案讲清闭包泄漏、`this` 丢失、`Map` 与普通对象的选型
- 有当日卡点记录，而不是「这一章读完了」

---

### D2 — JS 异步、事件循环与取消

<!-- id: d02-js-async -->

任务 ID：`d02-js-async`

#### 学习目标

- 画出 `Promise` / `queueMicrotask` / `setTimeout` 与渲染机会的一条时间线
- 把并发池、`async/await` 错误处理和 `AbortController` 讲成可观察链路
- 本周第一次手写：限时完成并发相关题

#### 题库与材料

- [JS / TS](/interview/questions/01-js-ts)：Q5、Q9、Q10、Q22；D 题选 **D2、D3、D10** 中 1 题
- [手写题](/interview/questions/10-handwriting)：Q4 `Promise.all` 或 Q5 并发池，二选一限时 25 分钟

#### 必做输出

- 手写一题并讲时间复杂度与失败短路
- 口述「请求如何取消、错误如何上报」3 分钟，绑定你项目里的真实接口
- 错题收入本地错题本

#### 验收标准

- 能手画事件循环时间线，并指出长任务会卡在哪
- 手写有可运行思路，不是只看了参考实现

---

### D3 — TypeScript 类型系统

<!-- id: d03-ts-type-system -->

任务 ID：`d03-ts-type-system`

#### 学习目标

- 把 `unknown` / `any`、泛型约束、工具类型讲成生产约束
- 收窄、可辨识联合、`satisfies` 能举项目里的正反例
- D 题只深挖一处：条件类型 **或** 协变 / 逆变，不两头都做

#### 题库与材料

- [JS / TS](/interview/questions/01-js-ts)：Q1–Q3、Q23–Q26；D 题选 **D4 或 D5**

#### 必做输出

- 从主项目摘 1 个接口 / props，改写成「最小约束 + 边界收窄」伪代码
- 口述 3 分钟：类型在哪一次帮你拦住线上问题；拦不住时你怎么逃逸

#### 验收标准

- 能区分 `unknown`、`Record<string, unknown>` 和双断言
- 输出里有一份真实（可脱敏）类型片段，不是空口说「我们用了 TS」

---

### D4 — TypeScript 工程化与模块边界

<!-- id: d04-ts-engineering -->

任务 ID：`d04-ts-engineering`

#### 学习目标

- 讲清 ESM / CJS、tree-shaking、前后端类型同步的可靠方案
- Vue props / emits 的 TS 写法能给出口头推荐，并说清不适用场景
- 用 D6 把循环依赖和摇树失败连到一次真实排查

#### 题库与材料

- [JS / TS](/interview/questions/01-js-ts)：Q11–Q14、Q28；D 题做 **D6**
- 可选对照：[工程化](/interview/questions/03-engineering) Q20（只扫 pnpm / 锁文件标题）

#### 必做输出

- 画一张「类型从 OpenAPI / 手工 d.ts / 共享包进来」的现状图（半页即可）
- 列出你仓库里 1 处 `any` 逃逸点和治理顺序

#### 验收标准

- 能讲清「证明你会用 TS」靠的是边界与治理，不是堆工具类型
- 图上能指出谁拥有类型、谁可以断言

---

### D5 — HTML 语义与内容

<!-- id: d05-html-semantics -->

任务 ID：`d05-html-semantics`

#### 学习目标

- 用 landmark、标题层级和表单标签讲清「组件化不能切断文档语义」
- 图片 `srcset` / `sizes`、媒体字幕按内容职责选型，不背属性列表
- 为 D8 审计清单先收集你主站 1 个真实页面的结构问题

#### 题库与材料

- [HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y)：Q1–Q3；移动端安全区先扫 **D7** 标题，正文留到 D6 / D37

#### 必做输出

- 选简历上的一个后台页或 H5 页，列出 3 处语义问题（标题跳级、div 按钮、label 缺失等）
- 口述 Q2 表单错误关联 2 分钟

#### 验收标准

- 能说明 Card 标题为什么不能写死 `h3`
- 清单能指到具体页面，不是抽象原则

---

### D6 — CSS 布局机制

<!-- id: d06-css-layout -->

任务 ID：`d06-css-layout`

#### 学习目标

- 层叠、BFC、包含块、Flex / Grid、层叠上下文能用「失败模式」讲，不背轴名称
- 对着你项目里一块难布局，说明为什么选 Flex 或 Grid
- 本周第二次输出：一页布局诊断草图

#### 题库与材料

- [HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y)：Q4–Q8

#### 必做输出

- 手绘或用文字描述主项目一个布局：包含块、溢出、`z-index` 出过的坑
- 遮答案口述 Q6、Q7、Q8，各 90 秒

#### 验收标准

- 能解释「加了 `z-index` 却盖不住」时你先查哪个上下文
- 草图能指出 Flex 收缩失败或 Grid 隐式轨道溢出中的至少 1 个

---

### D7 — CSS 架构、主题与响应式

<!-- id: d07-css-architecture -->

任务 ID：`d07-css-architecture`

#### 学习目标

- 容器查询、逻辑属性、CSS 变量主题能讲清适用边界
- D 题只做架构向：作用域治理 **或** Token 体系，选一题深挖
- 为明天审计准备「样式重复 / 主题分叉」证据

#### 题库与材料

- [HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y)：Q9、Q10；D 题选 **D3、D5、D6** 中 1 题
- 渲染性能相关的 `contain` / `content-visibility`（D4）只扫结论，细节并入 D30

#### 必做输出

- 写出你项目主题方案 8 行：Token 分层、暗色如何切、哪里被硬编码颜色污染
- 口述「响应式到底听 viewport 还是容器」2 分钟

#### 验收标准

- 能区分「设计 Token」和「随便设几个 CSS 变量」
- 有一份可拿去 D8 的样式债条目

---

### D8 — HTML / CSS / A11y 阶段复盘（输出日）

<!-- id: d08-a11y-stage-review -->

任务 ID：`d08-a11y-stage-review`

#### 学习目标

- 把键盘、焦点、ARIA 原则收成可执行审计，而不是记属性表
- 对照 WCAG 2.2 做 **一份** 真实页面清单，作为本阶段交付物
- 复盘 D1–D7 卡点，只补今晚还讲不稳的 2 题

#### 题库与材料

- [HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y)：Q11、Q12；D 题做 **D2（复合组件）和 D8（审计流程）**
- 需要后台复杂布局时加读 **D1**，不要两篇 D 题都写长文

#### 必做输出

- **HTML / CSS / A11y 审计清单**（一页）：语义、对比度、键盘、焦点陷阱、表单错误、自动化 + 人工步骤
- 用清单走查你主项目 1 个页面，标出 P0 / P1
- 本周手写 / 设计输出已在 D2、D6 完成；今晚只交付清单

#### 验收标准

- 清单能被同事按步骤执行，不是「注意无障碍」一句话
- 能口述 ARIA 只补充语义、不负责焦点和行为
- D1–D7 卡点本有关闭或改期记录

---

## 第二阶段 · D9–D16 · 浏览器、网络、安全

### D9 — 浏览器渲染链路

<!-- id: d09-browser-rendering -->

任务 ID：`d09-browser-rendering`

#### 学习目标

- 从导航到可交互：解析、样式、布局、绘制、合成能串成一条链
- Event Loop、渲染机会和长任务能用来解释一次卡顿
- 不把 Vue 调度细节提前到本阶段（留给 D18）

#### 题库与材料

- [浏览器与 Web API](/interview/questions/17-browser-web-api)：Q1；D 题做 **D1、D2**（今天只深挖 D1，D2 先画时间线）
- 对照 [JS / TS](/interview/questions/01-js-ts) D2：只补和渲染机会重叠的那几句

#### 必做输出

- 画「URL → 像素」半页图，标出你项目里可插入的观测点（Performance、LCP 元素）
- 口述 Q1 2 分钟，不看答案

#### 验收标准

- 能指出样式计算、布局、绘制分别被什么 CSS / DOM 操作放大
- 图上没有把 HTTP 缓存和 Vue `nextTick` 混在同一层

---

### D10 — 事件、观察者与页面生命周期

<!-- id: d10-browser-events -->

任务 ID：`d10-browser-events`

#### 学习目标

- 事件传播、默认行为、监听器选项能讲清被动监听与内存
- Observer、History、Page Lifecycle、BFCache 按场景选型
- 本周第一次手写：发布订阅或事件委托相关

#### 题库与材料

- [浏览器与 Web API](/interview/questions/17-browser-web-api)：Q2、Q3、Q5–Q7；D 题选 **D6**
- [手写题](/interview/questions/10-handwriting)：Q6 发布订阅，限时 20 分钟

#### 必做输出

- 手写 EventEmitter，并说明卸载时必须对称取消
- 口述「从后台回到 BFCache 页，你恢复什么、绝不恢复什么」3 分钟

#### 验收标准

- 能区分 `pageshow` 持久导航与普通 `load`
- 手写包含 `off` / 一次性监听，不是只有 `on` + `emit`

---

### D11 — 存储、多标签与泄漏

<!-- id: d11-browser-storage -->

任务 ID：`d11-browser-storage`

#### 学习目标

- Web Storage、IndexedDB、Cookie 按配额、同步成本和隐私选型
- 多标签同步与内存泄漏有一套定位顺序
- D 题绑定一次真实「关不掉的定时器 / 没取消的订阅」

#### 题库与材料

- [浏览器与 Web API](/interview/questions/17-browser-web-api)：Q4、Q10；D 题选 **D3 或 D4**
- Cookie 安全细节留给 D15，今天只做存储选型

#### 必做输出

- 列出主项目 3 类数据分别该进哪种存储，以及过期 / 清理策略
- 用文字写 5 步内存泄漏排查（Performance / Heap 到代码）

#### 验收标准

- 能说明为什么登录态不该只塞 `localStorage` 明文 token
- 排查步骤能对上你自己仓库里的一个可疑模块

---

### D12 — Worker、Service Worker 与 PWA

<!-- id: d12-worker-pwa -->

任务 ID：`d12-worker-pwa`

#### 学习目标

- Worker 通信、Transferable、SW 更新和 PWA 安装条件讲清边界
- 离线缓存策略能画出「预缓存 vs 运行时 vs 版本」而不是「上一个 SW」
- 不把 Hybrid 热更新提前到本阶段（留给 D45）

#### 题库与材料

- [浏览器与 Web API](/interview/questions/17-browser-web-api)：Q8、Q9、Q11、Q12；D 题选 **D5 或 D7**
- 需要补 JS 侧 Worker 动机时看 [JS / TS](/interview/questions/01-js-ts) **D8** 标题即可

#### 必做输出

- 一页「是否值得上 SW / PWA」决策：流量、HTTPS、更新失败、回滚
- 口述结构化克隆失败的一种数据（函数、DOM、代理对象）

#### 验收标准

- 能讲 SW 更新后旧页与新页各看到哪份缓存
- 决策页写了「不上」的条件，不是默认全上

---

### D13 — 网络协议与交付

<!-- id: d13-network-protocol -->

任务 ID：`d13-network-protocol`

#### 学习目标

- DNS、TCP、TLS、HTTP/1.1 / 2 / 3 用「队头阻塞发生在哪一层」串起来
- 会用一条慢首屏，判断问题在解析、建连、还是应用层瀑布
- 本周第二次输出可以推到 D14 / D16；今天以口述 + 一张链路草图为主

#### 题库与材料

- [网络与 Web 安全](/interview/questions/18-network-security)：Q1–Q5；D 题做 **D1**

#### 必做输出

- 对着你站点 HAR 或记忆中的瀑布，标出 DNS / TLS / TTFB / 内容下载
- 口述「HTTP/2 仍可能队头阻塞」90 秒

#### 验收标准

- 能说明 HTTP/3 解决什么、不解决业务接口设计问题
- 草图能指向一个可下手的优化（合并、预连接、减少阻塞脚本）

---

### D14 — HTTP 缓存与 CDN

<!-- id: d14-http-cache -->

任务 ID：`d14-http-cache`

#### 学习目标

- 新鲜度、再验证、HTML / hashed 资源 / API 三套策略能分开讲
- CDN 缓存键、回源和误缓存 HTML 的风险能举例子
- 为 D16 模拟准备「一次错误缓存事故」叙事

#### 题库与材料

- [网络与 Web 安全](/interview/questions/18-network-security)：Q6、Q7；D 题做 **D2**
- 工程化对照：[工程化](/interview/questions/03-engineering) Q15（只补分层口径，不展开构建）

#### 必做输出

- 写一张缓存表：HTML、`index-xxxxx.js`、字体、GET 列表接口各怎么设
- 口述可回滚发布：hash 文件与 `index.html` 的顺序

#### 验收标准

- 能解释「用户还在用旧 JS」时你先查协商缓存还是 CDN 规则
- 表上有至少一处「故意不缓存」的理由

---

### D15 — Web 安全

<!-- id: d15-web-security -->

任务 ID：`d15-web-security`

#### 学习目标

- Cookie / Token、CORS、CSRF、XSS、CSP、OAuth + PKCE 按「成立条件 + 防护组合」讲
- D 题只深挖一条：登录刷新 **或** XSS/CSP **或** CSRF，不要一天扫完所有 D
- 业务 RBAC 细节留给 D35 / D53，今天停在浏览器安全边界

#### 题库与材料

- [网络与 Web 安全](/interview/questions/18-network-security)：Q8–Q14 中抽 **5 道**（建议 Q8、Q9、Q10、Q11、Q13）；D 题选 **D3、D4、D5** 中 1 题
- 供应链 / 上传 / 实时通道（D6–D8）只扫标题，弱网实时留给 D38

#### 必做输出

- 对照主项目登录：Access / Refresh 存哪、谁防 CSRF、XSS 出口在哪
- 列出 3 个安全响应头你线上实际有没有，没有的就写「为什么还没有」

#### 验收标准

- 能讲清带 cookie 的跨站请求为什么会触发预检
- 叙事里有防护组合，不是只说「我们用了 JWT」

---

### D16 — 浏览器 / 网络 / 安全 / 手写阶段模拟（模拟日）

<!-- id: d16-web-stage-mock -->

任务 ID：`d16-web-stage-mock`

#### 学习目标

- 用 [脚本七 · Web 基础与安全（60 分钟）](/interview/mocks/scripts#脚本七-web-基础与安全-60-分钟) 跑一场；无搭档时改 [单人自测版](/interview/mocks/scripts#单人自测版-无搭档时)，抽题仍覆盖浏览器 + 网络 + 安全 + 1 道手写
- 用 [评分表](/interview/mocks/scorecard) 记九维里今天实际考到的维度
- 本周第二次手写在正式计时下完成

#### 题库与材料

- [模拟脚本 · 脚本七](/interview/mocks/scripts#脚本七-web-基础与安全-60-分钟)
- [评分表](/interview/mocks/scorecard)
- 抽题池：[浏览器](/interview/questions/17-browser-web-api) D1/D2 任一口述、[网络与安全](/interview/questions/18-network-security) D1 或 D3、[手写](/interview/questions/10-handwriting) Q1 或 Q2（防抖 / 节流，20 分钟）

#### 必做输出

- 完整自测录音或计时笔记
- 填写评分表；只针对最低两项写回炉题号
- 手写限时交卷

#### 验收标准

- 模拟按时结束，没有「再看 10 分钟答案」
- 回炉清单不超过 4 题，避免把第二阶段重刷一遍

---

## 第三阶段 · D17–D24 · Vue3

### D17 — Vue 响应式

<!-- id: d17-vue-reactivity -->

任务 ID：`d17-vue-reactivity`

#### 学习目标

- `ref` / `reactive` / `shallow*` / `toRef` 按「会不会丢失响应」选型
- 能口述 `track` / `trigger` 与身份问题（`toRaw` / `markRaw`）
- 每个结论绑到你仓库里一个 store 或表单对象

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q1、Q22–Q24；D 题选 **D6，并预读 D11 标题**

#### 必做输出

- 选一个真实组件，画出「哪些是 ref、哪些被 markRaw、谁在 watch」
- 口述 4 分钟：一次响应式丢失事故或险些丢失

#### 验收标准

- 能说明为何大列表原始数据有时必须 `shallowRef`
- 图上能指出卸载后还会不会触发 effect

---

### D18 — Vue 调度与 watch 时机

<!-- id: d18-vue-scheduler -->

任务 ID：`d18-vue-scheduler`

#### 学习目标

- `nextTick`、调度批处理、`computed` 脏检查、`watch` flush 能讲正确性影响
- 本周第一次手写：简易 `reactive`
- 不把渲染器 PatchFlags 提前做完（留给 D19）

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q21；D 题做 **D11、D12**（D11 抓主链路，D12 只抓 flush 边界）
- [手写题](/interview/questions/10-handwriting)：Q9 简易 `reactive`，限时 30 分钟

#### 必做输出

- 手写依赖收集 + 触发，并口述和 Vue 正式实现差在哪
- 举项目里一个 `watch` 写成 `flush: 'sync'` 会出事的例子（可假设后对照代码）

#### 验收标准

- 能区分 `nextTick` 与 `setTimeout(0)`
- 手写能演示「改两个属性只触发一次」或明确写明你为何没做成批

---

### D19 — Vue 渲染器与更新范围

<!-- id: d19-vue-renderer -->

任务 ID：`d19-vue-renderer`

#### 学习目标

- keyed diff、`key` 错位、静态提升 / PatchFlags / Block Tree 能解释「为什么少更新」
- 用 D7 或列表页讲更新扇出，不空谈编译器
- 渲染函数 / JSX 只扫选型，不改技术栈

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q14、Q32；D 题做 **D1**，并抽读 **D13** 结论段
- 更新扇出治理看 **D7** 标题，正文若超时并入 D22

#### 必做输出

- 对照一个 `v-for` 列表，写「错误 key 会导致什么状态错位」
- 口述 3 分钟：编译优化帮你省了什么，什么情况下你必须自己降响应式

#### 验收标准

- 能讲清 key 复用节点时局部 state 为什么会「跟着错行」
- 不把虚拟列表细节提前到 D22 / D34 以外

---

### D20 — Vue 组件模型

<!-- id: d20-vue-component -->

任务 ID：`d20-vue-component`

#### 学习目标

- 通信选型、生命周期清理、`Teleport`、`v-model` / 插槽 / 透传能画一张图
- `effectScope` 与指令 / composable 边界能说清
- 卸载清单必须对上你项目里的真实订阅

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q4–Q7、Q12、Q18、Q25–Q29 中抽 **6 道**（必含 Q4、Q6、Q29）；D 题选 **D2 或 D8**

#### 必做输出

- 列出「必须对称清理」的 8 项（监听、观察者、定时器、Bridge、SSE 等）并勾你项目实际有的
- 4 分钟口述一个复杂组件：状态、副作用、卸载

#### 验收标准

- 能说明 `provide/inject` 何时不该代替 props
- 清理清单没有「我们会注意」这种空话

---

### D21 — Vue 状态、路由与表单上下文

<!-- id: d21-vue-state -->

任务 ID：`d21-vue-state`

#### 学习目标

- Pinia 拆分、路由守卫、composable 设计、表单上下文能落到可维护边界
- SSR 隔离只预告，正文在 D23
- 本周第二次输出：一页状态分层图（组件 / 应用 / 服务端 / URL）

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q8、Q9、Q13、Q31；D 题选 **D4 或 D9**
- 架构向对照：[前端架构](/interview/questions/14-frontend-architecture) Q4（只读题干，深化留 D53）

#### 必做输出

- 画主项目状态分层，并指出 1 个「不该进全局 store」的状态
- 口述权限路由：刷新恢复、白名单、按钮权限从哪来

#### 验收标准

- 能讲清 Pinia 在 SSR 中为何必须隔离请求（即使你没上 SSR，也要能讲）
- 分层图能用于明天性能讨论

---

### D22 — Vue 性能

<!-- id: d22-vue-performance -->

任务 ID：`d22-vue-performance`

#### 学习目标

- `keep-alive`、`v-memo`、应用级抓手、大表虚拟化 + 响应式降级有一条主线
- 优化必须带「如何证明没换掉正确性」
- 通用 CWV 指标细节留给 D29，今天聚焦 Vue 特有抓手

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q10、Q14、Q34；D 题做 **D10、D14**（D14 为主，D10 作验收口径）
- [性能与用户体验](/interview/questions/20-performance-ux) Q11：只看 Vue 大列表结论

#### 必做输出

- 写一个 6 行性能 STAR：问题、假设、验证、手段、数字、回退
- 说明虚拟化后键盘 / 焦点 / 动态行高你怎么守（没有实践就写「未做 + 风险」）

#### 验收标准

- STAR 里有可核对的口径（时间窗、页面、设备）
- 能举一个「优化后反而错」的反例

---

### D23 — Vue SSR 与异步边界

<!-- id: d23-vue-ssr -->

任务 ID：`d23-vue-ssr`

#### 学习目标

- 水合失败原因、Suspense、异步组件重试、微前端子应用卸载能讲边界
- 没做 SSR 也要能讲「若要上，先守住确定性」
- 为明天模拟准备 2 个追问分支

#### 题库与材料

- [Vue3](/interview/questions/02-vue3)：Q11、Q15；D 题选 **D3**，有微前端经历再加 **D5** 标题
- Pinia SSR 安全边界：D4 若 D21 没做则今天补结论段

#### 必做输出

- 列出 5 个水合失败常见原因，并标注你项目中了哪几条
- 口述异步组件 loading / error / retry 2 分钟

#### 验收标准

- 能区分「警告被压掉」和「真定位到不一致 DOM」
- 没有 SSR 时，能诚实说证据来自阅读与局部实验，不编造上线案例

---

### D24 — Vue 专项模拟（模拟日）

<!-- id: d24-vue-stage-mock -->

任务 ID：`d24-vue-stage-mock`

#### 学习目标

- 完成一场 **Vue 专项**：响应式 → 组件 → 状态 → 一问性能 / SSR
- 开场用 90 秒自我介绍，主故事压到 5 分钟内
- 用评分表只打今天覆盖到的维度

#### 题库与材料

- [模拟脚本](/interview/mocks/scripts#单人自测版-无搭档时)：用「单人自测版」或「[脚本一](/interview/mocks/scripts#脚本一-业务型中小厂-可抽查-java-联调)」前半，问题替换为 Vue 抽题
- [评分表](/interview/mocks/scorecard)
- 抽题：[Vue3](/interview/questions/02-vue3) Q1、Q21、D11、D14 四选三口述；[故事模板](/interview/stories/template) 主项目 5 分钟版

#### 必做输出

- 45～60 分钟计时模拟 + 评分
- 「上场三句」：响应式身份、卸载清理、一次带数字的列表 / 表单优化
- 回炉不超过 3 个题号

#### 验收标准

- 能脱离题库标题把原理讲回你的页面
- 模拟中至少被自己追问一次「证据在哪」

---

## 第四阶段 · D25–D32 · 工程、测试与性能

### D25 — Vite 构建与分包

<!-- id: d25-vite-build -->

任务 ID：`d25-vite-build`

#### 学习目标

- 预构建 vs 生产构建、插件 / HMR、chunk 划分、构建性能能分开讲
- 包体积归因有顺序：分析器 → 责任人 → 是否该拆
- 本周第一次输出：一页 chunk 策略（或手写无关的构建决策）

#### 题库与材料

- [工程化](/interview/questions/03-engineering)：Q4、Q5；D 题抽 **D1、D5**，有余力扫 D2 / D12 / D13 标题
- 微前端是否上马（Q17、D14）只标「留给 D55」

#### 必做输出

- 写出当前仓库：首屏 chunk、异步路由、第三方怎么拆，以及 1 个错误拆法
- 口述「HMR 保状态却漏清理」2 分钟

#### 验收标准

- 能说明开发依赖预构建解决什么
- chunk 页上有长期缓存与首屏的取舍，不是「越碎越好」

---

### D26 — CI、发布与回滚

<!-- id: d26-ci-release -->

任务 ID：`d26-ci-release`

#### 学习目标

- 从 MR 到生产：门禁、灰度、Source Map、多环境配置、回滚动作能画一条链
- 供应链与 lockfile 只抓你能推动的部分
- Feature Flag 与分支策略点到「谁能紧急关」

#### 题库与材料

- [工程化](/interview/questions/03-engineering)：Q8、Q11、Q16、Q21–Q24 中抽 **5 道**；D 题选 **D3 或 D4**，回滚相关扫 **D11**
- Docker / Nginx（Q21）按你是否真负责部署决定深浅

#### 必做输出

- 3 分钟口述你负责过的流水线：卡点、你推动的改进、一次回滚
- 写下停止线：哪些指标红灯必须回滚

#### 验收标准

- 链路里有人、有环境、有观测窗口，不是只写工具名
- 能区分「构建一次、多环境注入」和「每个环境打一次包」

---

### D27 — 单元与组件测试

<!-- id: d27-testing-unit -->

任务 ID：`d27-testing-unit`

#### 学习目标

- 测试金字塔按风险分层，而不是按目录分层
- Vitest、Vue Test Utils、composable、Pinia / Router 隔离能讲「测什么不测什么」
- 本周可把「补 1 个失败单测思路」当作手写等价输出

#### 题库与材料

- [测试与质量保障](/interview/questions/21-testing-quality)：Q1–Q7；D 题选 **D1 或 D2**
- 工程化里的单测策略：[工程化](/interview/questions/03-engineering) Q9（只对齐口径）

#### 必做输出

- 为你一个 composable 或纯函数写出测试大纲：用例、假时间、不测的实现细节
- 口述 Mock / Stub / Fake / MSW 各举一个你用过或明确没用过的场景

#### 验收标准

- 能解释为何不该断言「调用了某个内部函数名」
- 大纲在 20 分钟内能开工，不是「以后补测试」

---

### D28 — E2E、契约与质量门禁

<!-- id: d28-testing-e2e -->

任务 ID：`d28-testing-e2e`

#### 学习目标

- Playwright 隔离、视觉回归噪声、a11y 自动化边界、契约测试能讲清
- Flaky、数据清理、紧急放行例外要有团队说法
- 为 D32 方案预留「门禁红黄灯」条目

#### 题库与材料

- [测试与质量保障](/interview/questions/21-testing-quality)：Q8–Q11；D 题抽 **D3、D4、D7** 中 2 题（D7 必做）
- D5 / D6（视觉 + 属性测试）只扫结论

#### 必做输出

- 画你团队真实（或目标）门禁：lint / 单测 / 类型 / E2E / 覆盖率各卡什么
- 写 3 条 Flaky 治理动作

#### 验收标准

- 能说明覆盖率高为什么仍可能没信心
- 门禁图上有「谁有权破例、事后怎么补」

---

### D29 — 性能指标与预算

<!-- id: d29-performance-metrics -->

任务 ID：`d29-performance-metrics`

#### 学习目标

- CWV、RUM / Lab、性能预算、告警可行动，先统一口径再谈手段
- 体验 SLI / SLO 能用业务语言讲
- 工程化 Q13 / Q14 只用来对齐名词，主体留在本模块

#### 题库与材料

- [性能与用户体验](/interview/questions/20-performance-ux)：Q1–Q3、Q12；D 题选 **D1**
- [工程化](/interview/questions/03-engineering) Q13、Q14：对照口径，不重复写优化清单

#### 必做输出

- 为你主站点写 4 行预算：LCP / INP / 包体 / 第三方脚本，缺基线就写「如何补测」
- 口述 RUM 与实验室数据如何互相打脸

#### 验收标准

- 指标有设备、分位、页面，不报一个平均值冒充治理
- 预算能被下周诊断日引用

---

### D30 — 性能诊断与治理手段

<!-- id: d30-performance-diagnosis -->

任务 ID：`d30-performance-diagnosis`

#### 学习目标

- 资源优先级、图片字体、第三方、长任务、内存、Vue 大表按「先诊断后动手」
- 只深挖与你项目最相关的 **2** 条 D 题
- 本周第二次输出：一页诊断记录（可当作迷你系统设计）

#### 题库与材料

- [性能与用户体验](/interview/questions/20-performance-ux)：Q4–Q11 中按项目抽 **4 道**；D 题从 **D2–D6** 选 2 题
- CSS `contain` 对照：[HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y) D4 结论段

#### 必做输出

- 写诊断记录：假设 → Performance / Network 证据 → 手段 → 预期数字 → 回退
- 口述 INP 或内存其中一条 4 分钟

#### 验收标准

- 记录能让同事复现你的测量步骤
- 没有「全面优化一下」这种无主词方案

---

### D31 — 可观测性与回归门禁

<!-- id: d31-observability -->

任务 ID：`d31-observability`

#### 学习目标

- 日志 → 指标 → SLO → 告警，能讲到「谁值班、看什么看板」
- 性能回归门禁和灰度与 D26 发布链对接
- 端到端故障定位只做前端视角的最小闭环

#### 题库与材料

- [工程化](/interview/questions/03-engineering) **D9**
- [性能与用户体验](/interview/questions/20-performance-ux) **D7、D8** 选 1
- [前端架构](/interview/questions/14-frontend-architecture) Q10、D10：只取「最小闭环」表述，架构展开留 D53

#### 必做输出

- 列出你能讲的 5 个前端事件：错误、空页、接口失败、长任务、业务转化
- 写告警误报的一条处理原则

#### 验收标准

- 能说明告警如何对应回滚或降级，而不是只发群消息
- 不编造不存在的监控平台，缺什么就写缺口

---

### D32 — 质量门禁与性能治理方案（输出日）

<!-- id: d32-quality-stage-mock -->

任务 ID：`d32-quality-stage-mock`

#### 学习目标

- 把 D25–D31 收成 **一份可评审的治理方案**，并做 30 分钟口述答辩
- 方案必须含门禁、预算、诊断顺序、灰度、回滚和人力
- 用评分表里的工程落地 / 故障治理维度自打

#### 题库与材料

- 回看当日方案会引用的题：[工程化](/interview/questions/03-engineering) D3/D4、[测试](/interview/questions/21-testing-quality) D7、[性能](/interview/questions/20-performance-ux) D1/D7
- [评分表](/interview/mocks/scorecard) · [脚本九 · 性能、测试与质量](/interview/mocks/scripts#脚本九-性能、测试与质量-60-分钟)（或 [单人自测版](/interview/mocks/scripts#单人自测版-无搭档时) 用「讲方案」代替通关脚本）

#### 必做输出

- **质量门禁与性能治理方案**（1～2 页）：现状缺口、90 天动作、红黄灯、成功指标
- 30 分钟计时口述 + 自问 3 个「排期不够先砍什么」
- 本周两次输出：D25 chunk 策略 + 本日方案

#### 验收标准

- 方案能直接贴进周会，不依赖题库编号也能读懂
- 有明确不做的项（例如不上微前端、不先上全站 E2E）

---

## 第五阶段 · D33–D39 · 后台与 H5 业务

### D33 — 中后台表单

<!-- id: d33-admin-form -->

任务 ID：`d33-admin-form`

#### 学习目标

- Schema 表单与手写表单的分界、弹层 / 抽屉选型能讲维护成本
- D1 只深挖你真正做过的配置化深度，没做过就讲「为何不上」
- 每个规则绑到 Ant Design Vue 的一次真实踩坑

#### 题库与材料

- [Ant Design Vue](/interview/questions/04-admin-antdv)：Q5、Q12；D 题做 **D1**
- 表单无障碍对照：[HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y) Q2（只补错误关联）

#### 必做输出

- 写「何时禁止 Schema」的 4 条标准
- 口述一个联动表单：校验时机、草稿、提交幂等

#### 验收标准

- 能说明配置化把复杂度挪到了哪里
- 有项目字段级例子，不是只谈组件 API

---

### D34 — 中后台表格

<!-- id: d34-admin-table -->

任务 ID：`d34-admin-table`

#### 学习目标

- ProTable 边界、查询 / URL / 竞态、虚拟滚动与可访问性一起讲
- 本周第一次手写：虚拟列表核心计算 **或** 权限树过滤
- 列插槽泛滥要有治理，而不是再封一层

#### 题库与材料

- [Ant Design Vue](/interview/questions/04-admin-antdv)：Q3、Q4、Q11、Q14；D 题选 **D2 或 D3**
- [手写题](/interview/questions/10-handwriting)：D1 定高虚拟列表 或 D2 权限树，选一题 35 分钟

#### 必做输出

- 限时手写核心逻辑并口述复杂度
- 写表格请求竞态：取消、序号、URL 同步各怎么做

#### 验收标准

- 能区分「表体 overflow 滚动」和真正虚拟化
- 手写有窗口计算，不是只写了 `slice`

---

### D35 — 中后台权限

<!-- id: d35-admin-permission -->

任务 ID：`d35-admin-permission`

#### 学习目标

- RBAC 讲到数据范围与审计就收，不把后端 IAM 论文展开
- 动态路由、按钮权限、操作列批量动作能画刷新恢复
- 前端权限是展示与拦截，最终授权在服务端

#### 题库与材料

- [Ant Design Vue](/interview/questions/04-admin-antdv)：Q1、Q2、Q7、Q13；D 题做 **D4**
- 系统设计预告：[前端系统设计](/interview/questions/11-frontend-system-design) Q5（只看题干）

#### 必做输出

- 口述「后端菜单 → 路由表 → 刷新 → 404 / 403」4 分钟
- 列出前后端权限码不一致时的 3 种暴露方式

#### 验收标准

- 能说明按钮隐藏不等于接口安全
- 恢复流程里有白名单与动态路由的顺序

---

### D36 — 中后台平台化能力

<!-- id: d36-admin-platform -->

任务 ID：`d36-admin-platform`

#### 学习目标

- 上传下载、多页签与 `keep-alive`、主题 Token、字典缓存、导入导出任务化
- 只按你项目真实有的选 **2** 个 D 题
- 无障碍与稳定性指标能接到 D8 / D32 的清单语言

#### 题库与材料

- [Ant Design Vue](/interview/questions/04-admin-antdv)：Q6、Q8–Q10 中抽 3 道；D 题从 **D5–D8** 选 2 题
- 二次封装对照 Q 可不做完，扫 D7 结论即可

#### 必做输出

- 写字典缓存：来源、TTL、失效、旧语义如何不进生产
- 口述大文件导入的可恢复设计（没有就写「当前同步导出的风险」）

#### 验收标准

- 平台能力有「谁运维失败任务」的答案
- 不把所有后台功能都说成你一个人做的

---

### D37 — Vant 与移动适配

<!-- id: d37-vant-mobile -->

任务 ID：`d37-vant-mobile`

#### 学习目标

- 适配单位、安全区、滚动穿透、软键盘、返回栈、List / 表单能点名踩坑
- H5 与中后台在状态和路由上的差异用你两个项目对比
- WebView Bridge 只预告，深度留给 D38 / D43

#### 题库与材料

- [Vant H5](/interview/questions/05-h5-vant)：Q1–Q3、Q5、Q6、Q10–Q12 中抽 **5 道**；D 题选 **D1 或 D2**
- 安全区对照：[HTML / CSS / 可访问性](/interview/questions/16-html-css-a11y) D7

#### 必做输出

- 整理 8 条移动端踩坑（必须含安全区、穿透、键盘、返回）
- 口述一个活动页或业务页的首屏与返回栈 3 分钟

#### 验收标准

- 能说明 rem / vw / 组件库内部单位如何对齐
- 踩坑清单能对上具体机型或 WebView，不编造也可以写「未覆盖机型」

---

### D38 — H5 弱网、埋点与 WebView 边界

<!-- id: d38-h5-weak-network -->

任务 ID：`d38-h5-weak-network`

#### 学习目标

- 弱网提交、离线恢复、埋点与 CWV、图片手势、SSE 按「能用不是能演示」
- JSBridge 在 H5 模块只讲协议意识，实现细节留给 Hybrid 库
- 本周第二次输出可推到 D39；今天交出弱网状态机草稿

#### 题库与材料

- [Vant H5](/interview/questions/05-h5-vant)：Q4、Q7–Q9；D 题从 **D3–D8** 选 2 题（弱网 D3 必做，Bridge 选 D4 或留给 D43）

#### 必做输出

- 画提交状态机：可点、禁用、重试、防重、回显
- 口述埋点如何避免拖垮 INP（没有治理就写现状风险）

#### 验收标准

- 状态机含断网恢复，不是只有 `loading`
- 能区分普通移动浏览器问题与 App WebView 问题

---

### D39 — 后台 / H5 业务案例（输出日）

<!-- id: d39-business-stage-mock -->

任务 ID：`d39-business-stage-mock`

#### 学习目标

- 交付 **一个** 可上场的业务案例（后台或 H5 选加重面，另一面只保留对比句）
- 案例必须含约束、方案、指标、踩坑、若重来
- 用模拟脚本练 20 分钟追问

#### 题库与材料

- [故事模板](/interview/stories/template) · [故事示例](/interview/stories/examples)
- 案例证据回链：[Ant Design Vue](/interview/questions/04-admin-antdv) D2/D4 或 [Vant H5](/interview/questions/05-h5-vant) D3
- [模拟脚本 · 脚本一](/interview/mocks/scripts#脚本一-业务型中小厂-可抽查-java-联调) 的业务追问段 · [评分表](/interview/mocks/scorecard)

#### 必做输出

- **后台 / H5 业务案例**一页：背景、你的动作、数字、失败分支
- 5 分钟录音；再压一版 90 秒
- 本周输出：D34 手写 + 本日案例

#### 验收标准

- 数字有口径；没有数字就写测量缺口，不编造
- 加重面能扛 3 个追问，非加重面能 1 分钟收住

---

## 第六阶段 · D40–D46 · 小程序与 Hybrid

### D40 — 小程序 / uni-app 运行时

<!-- id: d40-mini-runtime -->

任务 ID：`d40-mini-runtime`

#### 学习目标

- 条件编译、双线程、生命周期差异、rpx、原生组件、Vue3 在 uni 里的坑
- 能对面试官讲「和 H5 同一套代码时，哪些语义不能泄漏」
- 不把审核与支付一次做完（留给 D42）

#### 题库与材料

- [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)：Q1、Q2、Q6、Q7、Q11、Q12；D 题选 **D1 或 D3**

#### 必做输出

- 画逻辑层 / 渲染层通信，并标出你项目里一次 setData 或等价更新过重
- 列出 5 个 `#ifdef` 必须存在的理由，以及 2 个不该用条件编译的点

#### 验收标准

- 能说明原生组件为什么破坏文档流 / 层级
- 不把微信运行时说成浏览器 DOM

---

### D41 — 小程序性能与包体

<!-- id: d41-mini-performance -->

任务 ID：`d41-mini-performance`

#### 学习目标

- 主包、分包、预下载、长列表、存储限制按首开和二跳一起决策
- 本周第一次输出：分包策略半页
- 真机口径优先，不报开发者工具分数

#### 题库与材料

- [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)：Q3、Q9、Q15；D 题做 **D2**，扫 **D5** 结论

#### 必做输出

- 写当前主包组成与拟拆分包，标预下载时机
- 口述本地存储配额满了怎么办

#### 验收标准

- 策略同时服务首开和二跳，不是只砍图片
- 有「量过 / 没量过」标注

---

### D42 — 小程序登录、发布与合规

<!-- id: d42-mini-release -->

任务 ID：`d42-mini-release`

#### 学习目标

- 登录态、隐私、审核灰度、支付分享、合法域名、订阅消息能讲能力边界
- D 题只做你能举证的 1 条主链（登录 **或** 发布供应链）
- 为 D46 选型准备「小程序做不到的 3 件事」

#### 题库与材料

- [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)：Q4、Q5、Q8、Q13、Q14、Q16、Q17 中抽 **5 道**；D 题选 **D4 或 D6**，支付相关扫 D7 标题

#### 必做输出

- 画登录 + session 续期状态机（含拒绝授权）
- 写发布质量卡点：体验版谁验、审核被拒你怎么改

#### 验收标准

- 能区分「前端能做」和「必须用户手势 / 服务端」
- 不承诺微信文档已收回的能力

---

### D43 — Hybrid JSBridge

<!-- id: d43-hybrid-bridge -->

任务 ID：`d43-hybrid-bridge`

#### 学习目标

- Hybrid 架构、两端 WebView 差异、Bridge 协议字段、版本协商
- D 题做可演进协议，安全隔离可并入明天
- H5 题库里的 Bridge 只作对照，不重复写两套答案

#### 题库与材料

- [Hybrid App](/interview/questions/19-hybrid-app)：Q1–Q4；D 题做 **D1**
- 对照 [Vant H5](/interview/questions/05-h5-vant) Q9 / D4：只比「H5 页 vs 容器协议」差在哪

#### 必做输出

- 写一份最小 Bridge 报文：id、方法、版本、超时、取消、错误码
- 口述能力探测失败时的降级 2 分钟

#### 验收标准

- 协议有超时和取消，不是只有 `callback`
- 能说明 Android / iOS WebView 至少 2 个行为差异

---

### D44 — Hybrid 生命周期与原生能力

<!-- id: d44-hybrid-lifecycle -->

任务 ID：`d44-hybrid-lifecycle`

#### 学习目标

- 前后台、返回栈、Cookie / SSO、相机定位文件、上传下载按平台边界讲
- 进程回收后的状态恢复要有设计，不假装 Web 路由够用
- 权限拒绝路径必须能讲

#### 题库与材料

- [Hybrid App](/interview/questions/19-hybrid-app)：Q5–Q9；D 题做 **D4**

#### 必做输出

- 画 Native 返回栈与前端路由同步（含物理返回）
- 列出 3 个权限：首次、拒绝、设置页返回后的重试

#### 验收标准

- 能说明进程被杀时哪些状态不能只放内存
- SSO / Cookie 讲到平台差异即可，不展开整套 IAM

---

### D45 — Hybrid 性能、热更新与选型预研

<!-- id: d45-hybrid-performance -->

任务 ID：`d45-hybrid-performance`

#### 学习目标

- 白屏、WebView 池、资源缓存、插件灰度、热更新合规、跨端监控
- 框架选型（uni-app App / Capacitor / Cordova / RN / Flutter / PWA）只建材料，拍板在 D46
- 本周第二次大输出在明天，今天交性能与合规要点

#### 题库与材料

- [Hybrid App](/interview/questions/19-hybrid-app)：Q10–Q13；D 题从 **D3、D5、D8、D9** 选 2 题（白屏 D3 建议必做）

#### 必做输出

- 写启动白屏治理 6 步（容器、资源、Bridge 就绪、降级页）
- 列出热更新「能做 / 合规不能做」

#### 验收标准

- 不把热更新说成「随便补丁线上 JS」
- 选型表有组织与发布成本，不只比渲染性能

---

### D46 — 小程序 / Hybrid 选型与 Bridge 方案（输出日）

<!-- id: d46-cross-platform-mock -->

任务 ID：`d46-cross-platform-mock`

#### 学习目标

- 交付 **选型一页 + Bridge 方案一页**，并做 40 分钟答辩
- 明确主路径：纯 H5、小程序、Hybrid、RN / Flutter 各在什么约束下赢
- 用评分表打架构约束与演进

#### 题库与材料

- [Hybrid App](/interview/questions/19-hybrid-app) **D9** · [uni-app / 小程序](/interview/questions/06-uniapp-miniprogram) D3
- [前端系统设计](/interview/questions/11-frontend-system-design) Q6（跨端治理题干）
- [模拟脚本 · 脚本八](/interview/mocks/scripts#脚本八-hybrid-app-与跨端-60-分钟) · [评分表](/interview/mocks/scorecard)

#### 必做输出

- **小程序 / Hybrid 选型与 Bridge 方案**：场景、候选、否决项、协议演进、故障降级、发布
- 40 分钟口述（含 10 分钟自追问）
- 本周输出：D41 分包 + 本日方案

#### 验收标准

- 方案写了「当前团队为什么不选 Flutter」这类否决句
- Bridge 有版本与安全，不只是方法列表

---

## 第七阶段 · D47–D52 · 数据、BFF 与全栈交付

### D47 — MySQL 索引与查询

<!-- id: d47-mysql-index -->

任务 ID：`d47-mysql-index`

#### 学习目标

- 类型、键、JOIN、索引结构、最左匹配、覆盖索引、分页用「查询模式」讲
- D 题只做设计索引或读 `EXPLAIN`，不一天学完事务
- 前端要能把慢列表回推到 SQL，而不是只会让后端「优一下」

#### 题库与材料

- [数据库与 Prisma](/interview/questions/15-database-prisma)：Q1–Q9 中抽 **5 道**（必含 Q5–Q8）；D 题选 **D1 或 D2**
- 深分页对照 D5 标题，正文若超时并入明天

#### 必做输出

- 拿你后台最慢的一个列表（或假想筛选），写出拟用联合索引与排序
- 口述回表 / 覆盖索引 2 分钟

#### 验收标准

- 索引来自查询条件，不是「给所有字段都建索引」
- 承认你不是 DBA，但能读 `type` / `key` / `Extra` 的决策含义

---

### D48 — MySQL 事务与并发

<!-- id: d48-mysql-transaction -->

任务 ID：`d48-mysql-transaction`

#### 学习目标

- ACID、隔离级别、MVCC、锁、连接池用事故语言讲
- 库存扣减 / 死锁只选你能讲完的 1 条 D
- 事务边界要连到前端重复点击

#### 题库与材料

- [数据库与 Prisma](/interview/questions/15-database-prisma)：Q10–Q14；D 题选 **D3 或 D4**
- 对照 [Java 全栈](/interview/questions/07-java-fullstack) Q10、Q11（只对齐前后端分工）

#### 必做输出

- 写「提交按钮 → 接口幂等 → 事务」三段各自防什么
- 口述一种隔离级别下你见过或能推理的异常读

#### 验收标准

- 能说明幻读不是靠前端禁用按钮解决的
- 连接池耗尽只要求会描述症状和协作动作，不背参数默认值

---

### D49 — Prisma 建模与迁移

<!-- id: d49-prisma -->

任务 ID：`d49-prisma`

#### 学习目标

- Schema、查询、迁移、N+1、事务边界、expand-and-contract
- 跟教程走「能讲清步骤」，不要求当天把仓库跑通（闭环在 D52）
- 原生 SQL 与多租户安全只扫风险句

#### 题库与材料

- [数据库与 Prisma](/interview/questions/15-database-prisma)：Q15–Q17；D 题选 **D6 或 D7**，扫 **D8**
- [NestJS + Prisma 教程](/interview/guides/backend/nestjs-prisma)：§1 环境与依赖、§3 Schema（User / Role / Order）、§4 生成 Client 和迁移（按目录读你当天能消化的两节）
- Nest 里的 ORM 选型对照：[NestJS](/interview/questions/13-nestjs) D8 标题

#### 必做输出

- 为你熟悉的一张业务表草拟 Prisma model（字段、关系、索引意图）
- 写一次兼容发布：先加列、再双写或回填、最后删旧列

#### 验收标准

- 能区分 `select` / `include` 与 N+1
- 教程命令能复述，不把 Prisma 8 预发布流程混进来

---

### D50 — NestJS 请求链路

<!-- id: d50-nestjs -->

任务 ID：`d50-nestjs`

#### 学习目标

- Module / DI、请求五件套顺序、DTO、异常契约、鉴权分页缓存的最小集
- 一天只建立「能画请求路径」的深度，微服务 / CQRS 留给加练
- 本周第一次设计输出：请求时序半页

#### 题库与材料

- [NestJS](/interview/questions/13-nestjs)：Q1–Q8 中抽 **5 道**；D 题必做 **D4**，再选 D1 / D5 / D7 之一
- Q9 以后、D9 以后默认不做，除非目标岗是重 BFF

#### 必做输出

- 画一次 GET 列表：Middleware → Guard → Interceptor → Pipe → Controller → Filter
- 口述 JWT / Session 你怎么选（结合你真实后端，可以是 Java）

#### 验收标准

- 五类组件职责不串岗（Guard 不做转换，Pipe 不做鉴权）
- 时序图能用来讲超时与异常映射

---

### D51 — Java 协作与 AI 交付

<!-- id: d51-java-ai-delivery -->

任务 ID：`d51-java-ai-delivery`

#### 学习目标

- Java 叙事严守 [总览边界](/interview/00-overview)：接口、联调、简单 CRUD、协作
- AI vibe coding：拆任务、审查、测试、绝不盲信
- 准备「Vue 管理页 + 后端接口」一日闭环口述，供明天使用

#### 题库与材料

- [Java 全栈](/interview/questions/07-java-fullstack)：Q1–Q3、Q6、Q10；D 题选 **D2 或 D4**
- [AI / vibe coding](/interview/questions/09-ai-vibe-coding)：Q1、Q4、Q6、Q8；D 题选 **D2 或 D4**
- 实践：[Cursor Rules](/interview/guides/ai-coding/rules) · [Vue 项目示例](/interview/guides/ai-coding/vue-project-example)（只做 1 个小动作）

#### 必做输出

- 5 分钟讲清：需求怎么拆给 AI、你怎么审、怎么测、哪些地方不交给模型
- 写 AI 审查清单 8 条（越权、幻觉 API、依赖许可证）

#### 验收标准

- Java 部分不主动展开 JVM / 分布式事务
- AI 叙事有失败案例或明确「没用过的部分」

---

### D52 — NestJS + Prisma 最小闭环（输出日）

<!-- id: d52-fullstack-stage-mock -->

任务 ID：`d52-fullstack-stage-mock`

#### 学习目标

- 交付 **最小闭环答辩**：一张表、一个 Nest 资源、Prisma 迁移、Vue 列表联调、错误码
- 能对照教程讲你卡在哪，不要求生产级部署
- 用 NestJS 脚本或自测版练 30 分钟追问

#### 题库与材料

- [NestJS + Prisma 教程](/interview/guides/backend/nestjs-prisma)（按目录把「从模型到接口」走通口头步骤）
- [NestJS](/interview/questions/13-nestjs) Q6、Q7、D16
- [数据库与 Prisma](/interview/questions/15-database-prisma) Q17、D7
- [模拟脚本 · 脚本五](/interview/mocks/scripts#脚本五-全栈偏前-nestjs-60-分钟) · [评分表](/interview/mocks/scorecard)

#### 必做输出

- **NestJS + Prisma 最小闭环**一页：模块划分、model、DTO、迁移命令、前端联调、回滚
- 若本地已按教程敲过，附 3 条你实际踩到的版本坑；没敲过就走查教程步骤并标「未执行」
- 本周输出：D50 时序图 + 本日闭环

#### 验收标准

- 闭环有错误码与校验分工，不是只有 happy path
- 能说明 Prisma 事务里为什么不要打外部 HTTP

---

## 第八阶段 · D53–D57 · 架构与系统设计

### D53 — 前端架构约束与分层

<!-- id: d53-frontend-architecture -->

任务 ID：`d53-frontend-architecture`

#### 学习目标

- 从业务、规模、团队、合规、存量识别约束，再用质量属性反推方案
- 分层、依赖方向、状态划分、权限边界能落到你现有仓库
- 不先选微前端或框架

#### 题库与材料

- [前端架构](/interview/questions/14-frontend-architecture)：Q1–Q6；D 题抽 **D1、D2** 中 1 题深挖，另一题只读结论
- [架构 / Lead](/interview/questions/08-architecture-lead) Q1、Q15：只取决策框架

#### 必做输出

- 写主项目约束 8 行：用户量、团队、发版、合规、不能动的历史包
- 口述「共享模块大泥球」你怎么拆 3 分钟

#### 验收标准

- 方案句句能回溯到约束
- 不出现「先上 Monorepo 再看业务」这种倒置

---

### D54 — 前端系统设计

<!-- id: d54-system-design -->

任务 ID：`d54-system-design`

#### 学习目标

- 按 45 分钟结构画 **一页** 系统：后台框架 / 监控 / 权限 / 配置化 四选一
- 本周第一次系统设计正式计时
- 范围管理：先目标与约束，再模块，再失败模式

#### 题库与材料

- [前端系统设计](/interview/questions/11-frontend-system-design)：Q1–Q7 中按岗位选 **1 道 Q + 1 道相关 D 的题干**（不要两套题一起设计）
- 画图时回链 [故事模板](/interview/stories/template) 里的指标口径

#### 必做输出

- 25 分钟画方案 + 10 分钟口述 + 10 分钟自追问
- 方案必须含：流量假设、模块、数据流、降级、演进下一步

#### 验收标准

- 一页能讲完，不写微服务论文
- 有明确非目标（例如不做低代码编辑器）

---

### D55 — 微前端

<!-- id: d55-microfrontend -->

任务 ID：`d55-microfrontend`

#### 学习目标

- 适用边界、隔离、通信、shared、故障降级按「组织问题优先」
- 按你可能被问到的栈深挖 **一条** 实现（qiankun / MF / Wujie），不要四框架通背
- JD 完全不碰微前端则改做 D14「坚决不上」+ 用省下时间回炉 D54

#### 题库与材料

- [微前端](/interview/questions/12-microfrontend)：Q1、Q2、D1、D2 必做；实现栈再抽 Q3–Q13 中 **3 题** 或 D15 选型答辩
- 工程化 D14 只作组织指标对照

#### 必做输出

- 写「上 / 不上微前端」决策表：团队数、发布独立性、样式隔离成本
- 口述一次卸载泄漏或 remote 失败 3 分钟（无经历就推理 + 标明）

#### 验收标准

- 能把微前端和组件库 / Monorepo 区分开
- 选型表有否决项

---

### D56 — 架构故障、降级与演进

<!-- id: d56-architecture-failure -->

任务 ID：`d56-architecture-failure`

#### 学习目标

- 稳定性目标、错误预算、降级灾备、ADR、评审、演进触发器
- Lead 事故指挥只取前端可讲的部分
- 为明天端到端设计准备故障注入段

#### 题库与材料

- [前端架构](/interview/questions/14-frontend-architecture)：Q9、Q14、Q15；D 题抽 **D9、D11、D14** 中 2 题
- [架构 / Lead](/interview/questions/08-architecture-lead) Q8、**D5**（只抓指挥与复盘结构）

#### 必做输出

- 写一份一页 postmortem 骨架（可用脱敏真实事故，或「若发生」标注）
- 列出 3 个演进触发器（团队规模、错误预算耗尽、合规）

#### 验收标准

- 复盘有时间线、影响、根因、动作、跟进，不甩锅
- 降级有用户可感知结果，不是只写「降级开关」

---

### D57 — 端到端系统设计（输出 / 模拟日）

<!-- id: d57-architecture-mock -->

任务 ID：`d57-architecture-mock`

#### 学习目标

- 完成一场 **端到端系统设计**：从约束到模块、发布、观测、故障、演进
- 时长 60 分钟画 + 讲，或直接走 [脚本六](/interview/mocks/scripts#脚本六-高级前端架构-75-分钟) 中系统设计段并补全前后
- 九维里架构约束、故障、演进必须打分

#### 题库与材料

- [前端系统设计](/interview/questions/11-frontend-system-design) D6（BFF）或 D5（跨端工程）或 Q2（监控）三选一作为题面
- [前端架构](/interview/questions/14-frontend-architecture) D10
- [模拟脚本 · 脚本六](/interview/mocks/scripts#脚本六-高级前端架构-75-分钟) · [评分表](/interview/mocks/scorecard)

#### 必做输出

- **端到端系统设计**一页（可两面）：上下文、容器、关键链路、SLO、失败模式、90 天演进
- 60 分钟计时 + 评分
- 本周输出：D54 专题设计 + 本日端到端

#### 验收标准

- 听的人能复述你的最大风险和回滚
- 不把 Nest / 微前端硬塞进没有约束的方案

---

## 第九阶段 · D58–D60 · Lead、简历与终场

### D58 — Lead 行为与协作

<!-- id: d58-lead-behavior -->

任务 ID：`d58-lead-behavior`

#### 学习目标

- 带人、门禁、排期、冲突、反馈用 STAR-L，证据与方法论分开
- 行为题不编造经历；没有 Lead 头衔就讲非正式影响力
- 自我介绍按目标岗改一版

#### 题库与材料

- [架构 / Lead](/interview/questions/08-architecture-lead)：Q3–Q6、Q9 中抽 3 道；D 题选 **D2 或 D3**
- [项目答辩与行为面试](/interview/questions/22-project-behavioral)：Q1、Q6、Q7；D 题选 **D4 或 D6**
- [反问清单](/interview/mocks/reverse-questions) 先圈 8 个候选

#### 必做输出

- 写 3 个行为故事提纲：冲突、失败、带人 / 影响他人（各 8 行）
- 口述自我介绍 90 秒，录一遍

#### 验收标准

- 每个故事能区分「我做的 / 我们做的」
- 没有业绩的地方改成机制或教训，不补假数字

---

### D59 — 简历、项目答辩与证据终检

<!-- id: d59-resume-project -->

任务 ID：`d59-resume-project`

#### 学习目标

- 简历每一行能在 30 秒落到证据；ATS 与项目改写清单走完
- 主项目 3 / 5 / 10 分钟三个版本齐备
- 反问缩到上场 5 个

#### 题库与材料

- [项目答辩与行为面试](/interview/questions/22-project-behavioral)：Q2–Q5、Q8–Q10；D 题做 **D1、D2**
- [资深前端简历指南](/interview/resume/senior-frontend-guide) · [模板](/interview/resume/senior-frontend-template) · [示例](/interview/resume/senior-frontend-example)
- [项目改写清单](/interview/resume/project-rewrite-checklist) · [ATS 检查清单](/interview/resume/ats-checklist)
- [故事模板](/interview/stories/template) · [故事示例](/interview/stories/examples)

#### 必做输出

- 对着简历逐行写证据句（本地笔记）
- 录 3 分钟与 90 秒项目答辩
- 确定 5 个反问，删除可能让你显得在套情报的问题

#### 验收标准

- ATS 清单无 P0 红灯（联系方式、岗位词、空指标）
- 10 分钟版有结构，不需要真讲满 10 分钟也能收

---

### D60 — 75 分钟综合模拟与九维评分（终场）

<!-- id: d60-final-interview -->

任务 ID：`d60-final-interview`

#### 学习目标

- 按 [脚本十一 · 综合终场（75 分钟）](/interview/mocks/scripts#脚本十一-综合终场-75-分钟) 完整走场，并做九维评分；目标岗偏业务时用该脚本的 Senior 映射，不要改走脚本六
- 用 [评分表](/interview/mocks/scorecard) 做 **九维评分**；未考察维度从分母移除
- 只做上场急救，不再开新模块

#### 题库与材料

- [模拟脚本 · 脚本十一](/interview/mocks/scripts#脚本十一-综合终场-75-分钟)
- [评分表](/interview/mocks/scorecard)
- [反问清单](/interview/mocks/reverse-questions)
- 弱项回炉仅限 D16 / D24 / D32 / D57 留下的题号

#### 必做输出

- **75 分钟综合模拟**（可找搭档或自问自答录音）
- 填完整评分表：各维证据、总分、红线是否触发
- 一页「上场纸条」：三句必说、两个绝不主动展开的话题、5 个反问

#### 验收标准

- 时间盒打满：介绍、项目、原理、设计、故障、行为、反问都出现
- 正确性或诚信若触红线，不能用总分稀释——先改叙事再投简历
- 60 天卡点本有一份最终状态：关闭 / 带病上场 / 放弃展开

---

## 进度 Checklist

勾选写入 localStorage（键：`mianshi-plan:60-day`），与 7 / 14 / 30 天互不干扰。下列 ID 仅用于本路线，不复用压缩路线旧 ID。

<PlanChecklist planId="60-day" :items='[{"id":"d01-js-runtime","label":"D1 JS 运行时：可口述 + 有输出 + 记录卡点"},{"id":"d02-js-async","label":"D2 JS 异步与手写：可口述 + 有输出 + 记录卡点"},{"id":"d03-ts-type-system","label":"D3 TS 类型系统：可口述 + 有输出 + 记录卡点"},{"id":"d04-ts-engineering","label":"D4 TS 工程化：可口述 + 有输出 + 记录卡点"},{"id":"d05-html-semantics","label":"D5 HTML 语义：可口述 + 有输出 + 记录卡点"},{"id":"d06-css-layout","label":"D6 CSS 布局：可口述 + 有输出 + 记录卡点"},{"id":"d07-css-architecture","label":"D7 CSS 架构：可口述 + 有输出 + 记录卡点"},{"id":"d08-a11y-stage-review","label":"D8 交付 HTML/CSS/A11y 审计清单"},{"id":"d09-browser-rendering","label":"D9 浏览器渲染：可口述 + 有输出 + 记录卡点"},{"id":"d10-browser-events","label":"D10 事件与生命周期：可口述 + 有输出 + 记录卡点"},{"id":"d11-browser-storage","label":"D11 存储与泄漏：可口述 + 有输出 + 记录卡点"},{"id":"d12-worker-pwa","label":"D12 Worker/PWA：可口述 + 有输出 + 记录卡点"},{"id":"d13-network-protocol","label":"D13 网络协议：可口述 + 有输出 + 记录卡点"},{"id":"d14-http-cache","label":"D14 HTTP 缓存：可口述 + 有输出 + 记录卡点"},{"id":"d15-web-security","label":"D15 Web 安全：可口述 + 有输出 + 记录卡点"},{"id":"d16-web-stage-mock","label":"D16 完成浏览器/网络/安全/手写模拟"},{"id":"d17-vue-reactivity","label":"D17 Vue 响应式：可口述 + 有输出 + 记录卡点"},{"id":"d18-vue-scheduler","label":"D18 Vue 调度与手写 reactive"},{"id":"d19-vue-renderer","label":"D19 Vue 渲染器：可口述 + 有输出 + 记录卡点"},{"id":"d20-vue-component","label":"D20 Vue 组件：可口述 + 有输出 + 记录卡点"},{"id":"d21-vue-state","label":"D21 Vue 状态：可口述 + 有输出 + 记录卡点"},{"id":"d22-vue-performance","label":"D22 Vue 性能：可口述 + 有输出 + 记录卡点"},{"id":"d23-vue-ssr","label":"D23 Vue SSR：可口述 + 有输出 + 记录卡点"},{"id":"d24-vue-stage-mock","label":"D24 完成 Vue 专项模拟"},{"id":"d25-vite-build","label":"D25 Vite 构建：可口述 + 有输出 + 记录卡点"},{"id":"d26-ci-release","label":"D26 CI 发布：可口述 + 有输出 + 记录卡点"},{"id":"d27-testing-unit","label":"D27 单元测试：可口述 + 有输出 + 记录卡点"},{"id":"d28-testing-e2e","label":"D28 E2E 与门禁：可口述 + 有输出 + 记录卡点"},{"id":"d29-performance-metrics","label":"D29 性能指标：可口述 + 有输出 + 记录卡点"},{"id":"d30-performance-diagnosis","label":"D30 性能诊断：可口述 + 有输出 + 记录卡点"},{"id":"d31-observability","label":"D31 可观测性：可口述 + 有输出 + 记录卡点"},{"id":"d32-quality-stage-mock","label":"D32 交付质量门禁与性能治理方案"},{"id":"d33-admin-form","label":"D33 后台表单：可口述 + 有输出 + 记录卡点"},{"id":"d34-admin-table","label":"D34 后台表格与手写：可口述 + 有输出 + 记录卡点"},{"id":"d35-admin-permission","label":"D35 后台权限：可口述 + 有输出 + 记录卡点"},{"id":"d36-admin-platform","label":"D36 后台平台化：可口述 + 有输出 + 记录卡点"},{"id":"d37-vant-mobile","label":"D37 Vant 移动端：可口述 + 有输出 + 记录卡点"},{"id":"d38-h5-weak-network","label":"D38 H5 弱网：可口述 + 有输出 + 记录卡点"},{"id":"d39-business-stage-mock","label":"D39 交付后台/H5 业务案例"},{"id":"d40-mini-runtime","label":"D40 小程序运行时：可口述 + 有输出 + 记录卡点"},{"id":"d41-mini-performance","label":"D41 小程序性能：可口述 + 有输出 + 记录卡点"},{"id":"d42-mini-release","label":"D42 小程序发布：可口述 + 有输出 + 记录卡点"},{"id":"d43-hybrid-bridge","label":"D43 Hybrid Bridge：可口述 + 有输出 + 记录卡点"},{"id":"d44-hybrid-lifecycle","label":"D44 Hybrid 生命周期：可口述 + 有输出 + 记录卡点"},{"id":"d45-hybrid-performance","label":"D45 Hybrid 性能：可口述 + 有输出 + 记录卡点"},{"id":"d46-cross-platform-mock","label":"D46 交付小程序/Hybrid 选型与 Bridge 方案"},{"id":"d47-mysql-index","label":"D47 MySQL 索引：可口述 + 有输出 + 记录卡点"},{"id":"d48-mysql-transaction","label":"D48 MySQL 事务：可口述 + 有输出 + 记录卡点"},{"id":"d49-prisma","label":"D49 Prisma：可口述 + 有输出 + 记录卡点"},{"id":"d50-nestjs","label":"D50 NestJS：可口述 + 有输出 + 记录卡点"},{"id":"d51-java-ai-delivery","label":"D51 Java+AI 交付：可口述 + 有输出 + 记录卡点"},{"id":"d52-fullstack-stage-mock","label":"D52 交付 NestJS + Prisma 最小闭环"},{"id":"d53-frontend-architecture","label":"D53 前端架构：可口述 + 有输出 + 记录卡点"},{"id":"d54-system-design","label":"D54 系统设计：可口述 + 有输出 + 记录卡点"},{"id":"d55-microfrontend","label":"D55 微前端：可口述 + 有输出 + 记录卡点"},{"id":"d56-architecture-failure","label":"D56 架构故障：可口述 + 有输出 + 记录卡点"},{"id":"d57-architecture-mock","label":"D57 交付端到端系统设计"},{"id":"d58-lead-behavior","label":"D58 Lead 行为：可口述 + 有输出 + 记录卡点"},{"id":"d59-resume-project","label":"D59 简历与项目答辩终检"},{"id":"d60-final-interview","label":"D60 完成 75 分钟综合模拟和九维评分"}]' />
