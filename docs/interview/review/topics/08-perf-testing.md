# 性能与测试质量

> **真源：** [20 性能与 UX](/interview/questions/20-performance-ux)、[21 测试与质量](/interview/questions/21-testing-quality)（主）；体积门禁、发布灰度与观测字段见 [03 工程化](/interview/questions/03-engineering)。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背 Lighthouse 分数或堆测试工具名，而是证明你能把「用户慢 / 发布慌」收成可执行闭环：

**指标口径 → Lab/RUM 分工 → 预算与门禁 → 分层诊断 → 风险驱动测试组合 → 灰度与回滚。**

面试官想听四类能力：

1. **口径感：** CWV（LCP / INP / CLS）阈值、p75、移动/桌面分端；INP 无合格交互不能填 0。
2. **诊断感：** 首屏拆 TTFB / 发现 / 下载 / 主线程 / 数据；INP 拆输入 / 处理 / 呈现；LoAF / Long Task 是线索不是指标本身。
3. **测试感：** unit / component / integration / E2E 按风险选层，不按固定金字塔比例凑数。
4. **工程取舍：** 预算例外、flaky 治理、契约与少量 E2E 的边界；相关性 ≠ 因果。

口述红线（与题库冲突即扣分）：

- 把一次桌面 Lighthouse 当全站通过；
- 普通加载模式 Lighthouse 声称测得 INP；
- 移动端与桌面端混成一个 p75；
- 规定所有项目必须 70% unit / 20% integration / 10% E2E；
- 用 `waitForTimeout` / 多重试粉饰 flaky；
- 把包体积下降直接说成 LCP 一定变好。

当前 CWV 口径：**LCP ≤ 2.5 s、INP ≤ 200 ms、CLS ≤ 0.1 为良好**；差的边界约 LCP > 4 s、INP > 500 ms、CLS > 0.25。以真实访问样本分端 p75 判定，三项都良好才算通过。

## 知识地图

```text
体验指标                 加载 / 运行时                测试证据链                 发布闭环
LCP / INP / CLS     →   Resource Hints / 图片字体 → unit / component      → Lab 门禁
p75 分端 + 样本量       Bundle / 第三方 / 长任务      integration + MSW         RUM 灰度
业务首屏 / 任务时间     虚拟列表 / 内存泄漏           Playwright E2E            告警 owner / 回滚
RUM ↔ Lab 互补          LoAF 归因                    契约 / 视觉 / a11y        错误预算
```

主线口诀：

1. **先定义用户何时感到可用，再选指标**
2. **Lab 复现，RUM 判决；二者不能互相替代**
3. **预算进 PR，例外写偿还日期**
4. **测试按风险选最便宜的可信证据**
5. **失败要能归因：代码 / 环境 / 数据 / 口径变更**
6. **优化一次只改一个因素，用分层分位数验收**

## 完整讲解

### 1. Core Web Vitals：定义、分端与采集边界

- **LCP：** 主要内容加载；良好 ≤ 2.5 s。差的边界约 > 4 s。
- **INP：** 合格 click / tap / keyboard 交互延迟的代表值；良好 ≤ 200 ms。无合格交互的访问**没有 INP 样本**，不能填 0 参与聚合；要分报 coverage 与缺失原因。
- **CLS：** 意外布局偏移；良好 ≤ 0.1。先排除 `hadRecentInput=true` 的 shift，再按 session window（间隔 < 1 s、最长 5 s）取最大累计。

三项都以真实访问样本**分端 p75**判定，都良好才算通过。移动端与桌面端混算会掩盖一端退化。优先用维护中的 `web-vitals` 库；自定义 `PerformanceObserver` 先查 `supportedEntryTypes`，`buffered: true` **不能**保证拿到生命周期全部条目。

**失败形态：** 无交互记 INP=0；一次桌面 Lighthouse 当全站通过；RUM 字段塞 Token/输入/自由文本导致 PII 与基数爆炸。

**验收：** 分端看板；INP eligible/coverage 分报；路由模板白名单、资源 URL 去 query/fragment、字段基数上限。行业 CWV 阈值是起点，不是所有内部 SLO 的唯一数字——内部任务时间与错误率可更严或更宽，但要写清窗口与样本量。

采集实现要注意：自定义 observer 漏 `buffered` 或未检查 `supportedEntryTypes` 会静默少样本；维度用语义 id（如 `checkout_submit`）而不是文案；INP 目标点击要能在 Lab 脚本里稳定复现。把「没有样本」与「样本很差」分开治理，否则会用补零或删路由的方式刷绿。

### 2. RUM、Lab 与性能预算（含门禁表）

Lab 在可控设备与网络下复现路径，适合发布前对比瀑布；RUM 覆盖真实设备、缓存、长会话，适合 SLO。普通页面加载 Lighthouse **不产生 INP**——要用 timespan / user flow 或脚本执行真实交互。Lab 变快不保证用户 p75 变快。

预算从用户任务与 SLO 反推：体验预算（分端 LCP/INP/CLS、业务首屏、错误率）+ 资源预算（关键路径 JS/CSS/字体/图片、长任务、第三方占比）。每项明确窗口、分位数、冷暖缓存、最小样本量、owner 与回滚。只设 Bundle 大小不够：相同体积可有完全不同的解析/执行成本。

把预算与测试证据写成同一张表四列：用户任务、体验 SLI（分端分位）、资源/主线程预算、测试证据（哪一层、谁维护、失败产物）。例如「提交订单」：提交到可确认结果 p95、INP eligible p75、关键路径 JS、Playwright 支付回跳 + 契约 + 金额 unit。表上没有证据的优化不允许宣称完成；没有 owner 的红色指标不允许只挂大盘。例外机制：业务收益、增量成本、替代方案、偿还日期——过期自动升级为缺陷。

**验收：** PR 能指出触达哪几条预算；例外有偿还日；Lab 设备清单与 RUM 分层口径分开维护。

采样与隐私写进预算表附注：禁止自由文本、限制字段基数、INP 标签低基数。实验室满分但用户长尾崩，通常是设备/网络分层没进 SLO。缺人时先保住关键旅程的体验预算 + 一条分端看板，再扩第三方与字体细则。

### 3. 加载链路与首屏诊断口述

`dns-prefetch` / `preconnect` 只给极少数确定跨源；`preload` 是当前导航必需资源的强提示，要正确 `as` / 跨源。响应式图片 preload 须让 `imagesrcset`/`imagesizes` 与 `<img>` 的 `srcset`/`sizes` 匹配，避免固定 `href` 误预载再下另一个候选。`fetchpriority` 只调相对优先级，不能让浏览器提前发现尚未进入 HTML 的 URL。

图片：匹配槽位的 `srcset`/`sizes`，AVIF/WebP + 回退，预留宽高降 CLS；**首屏 LCP 图通常不要 `loading="lazy"`**。字体：WOFF2 + 子集；只 preload 首屏能匹配的字体；中文字体体积尤其要取舍。Bundle：分析器找未使用 / 重复 / 高执行成本模块；按路由动态导入；公共 chunk 基于真实复用与变更频率——过碎增加请求与瀑布。第三方：清单 + owner + kill switch；`async` 不保证不阻塞交互（下载后仍占主线程）。

**首屏诊断固定顺序：** 定义非占位关键内容 → 拉 RUM 长尾分层（移动/低端/慢网/冷缓存）→ Lab 复现资源链 → 分别打 TTFB、发现、下载、主线程、数据的预算 → 灰度看 p75/p95 与错误 → 超阈值回滚。

**假优化黑名单：** 只压图片忽略 TTFB；骨架当业务首屏；所有图 preload；LCP 图懒加载；只跑高配桌面 Lighthouse；SPA 自重置时间却宣称标准 CWV。传统 LCP 以硬导航为中心，**SPA soft navigation 不能直接冒充标准 CWV**——可自建「路由内容可见」并另命名。告警基于 SLO + 最小样本量 + 版本/实验桶，路由到 owner；全站一个 LCP 阈值通常不可操作。

资源发现顺序比「多 preload」更重要：HTML 尽早暴露 LCP 候选；校准 `fetchpriority`；非关键脚本别抢连接。第三方 kill switch 要能在灰度一键关掉 CPU 大户，而不是只写进文档。包体积下降必须对照关键路径瀑布——vendor 变小但 LCP 图发现更晚，用户仍慢。

与构建器专题的接口：体积归因用同一 SHA 的生产制品；分包回收看请求数与主线程解析，不只看 gzip 总和。与 Vue 专题的接口：大列表卡顿先分四条链，再虚拟化与浅响应；水合后的长任务计入 INP 输入延迟排查。 留下分端基线、预算例外偿还日与关键旅程 E2E 的首轮失败证据，才有资格谈「质量门禁」。

### 4. 运行时：INP、长任务、内存、Vue 大列表

INP = 输入延迟 + 处理时长 + 呈现延迟。Long Task（>50 ms）与 LoAF（长动画帧，>50 ms）是诊断证据；LoAF 可能无渲染阶段（`renderStart=0`），不能当真实渲染起点。把 100 ms 切成两个连续 50 ms 且不给输入/绘制机会，不一定改善 INP。Worker 有克隆与回写成本，DOM 不能直接搬进去。

**INP 诊断固定顺序：** 只在 eligible 访问算分位并报 coverage → RUM 用路由模板与低基数语义标签定位 → Lab 脚本化真交互 → 按输入/处理/呈现三段结合 LoAF → 先减总工作量再分片/调度/Worker。

**假优化黑名单：** 只 debounce；把同步工作包进 Promise 当让出；连续切片不给绘制机会；无交互记 0；用普通加载 Lighthouse 声称有 INP。

内存：先定义可重复场景（进出 20 次），看 GC 后堆与 Detached DOM 是否持续涨；只比两次总量易误判。Vue 大列表：先分数据 / DOM / 响应式 / 布局；虚拟化 + 稳定 key + `shallowRef`/`markRaw`；保留键盘、读屏、复制、打印降级路径。细节链到 [05](/interview/review/topics/05-vue-reactivity)；验收仍用分端分位数，不拿开发机 FPS 交差。

输入延迟高时先查前序长任务、水合、第三方脚本，而不是先给提交按钮加 debounce——debounce 可能牺牲反馈且不治排队。呈现延迟高时查样式计算、布局抖动与同步渲染路径。Worker 只在纯计算且克隆成本可接受时划算；DOM 读写仍在主线程。

### 5. 测试分层与 Vue 单测

- **Unit：** 纯函数 / composable 最小行为。
- **Component：** 挂载组件，断言可观察 DOM / emits（语义查询优先；VTU 的 `find` 与 Testing Library 的 `getByRole` 不要混写成同一套能力）。
- **Integration：** 多真实模块 + MSW 网络边界。
- **E2E：** 真实浏览器关键旅程。

金字塔表达反馈速度与定位成本的取舍，**不是固定比例**（禁止背 70/20/10）。Vitest：参数化、固定时区/随机种子；分清 `clearAllMocks` / `resetAllMocks` / `restoreAllMocks`。不要首选 `wrapper.vm.submit()` 绕过用户入口。composable 依赖生命周期时用最小宿主挂载；结束要 `unmount` / `scope.stop()`，只清 Mock 不够。不为提高覆盖率测试 getter；不为「看起来测了导航」在窄单测 Mock 掉 Router/API 后宣称已证明。

fake timers 管宏任务时钟；`nextTick` 等 Vue 更新队列；`flushPromises` 推当前微任务——三者边界不同，按因果顺序驱动，不用「多 flush 几次」碰运气。

单测失败要能归因：是断言弱、环境漂，还是业务分支没覆盖。参数化表驱动把边界（空、最大、币种、时区）写进用例名；随机种子固定后 CI 才能复现。覆盖率是线索不是证明——金额/权限看分支与 mutation 抽样，UI 看可观察行为与少量 E2E。

### 6. MSW、契约、Playwright、视觉与 a11y

MSW 在 fetch/XHR 边界拦截，适合证明 HTTP 协议；窄单测 Mock client 只能证明调用者分支。Schema 契约管结构；consumer-driven contract 管真实依赖；业务语义仍需 provider 规则测试。破坏性变更走 expand-and-contract。

Playwright：语义 Locator + web-first assertions；独立用户/租户/订单；storage state 默认不上传 artifact；失败用 `trace: 'retain-on-first-failure'` 留首轮证据。禁止 `waitForTimeout` 当等待。Flaky 是未受控状态证据；可设 `failOnFlakyTests`（Playwright v1.52+），retry 通过仍计 flaky——不把 flaky 永久 quarantine 却不设偿还日。

视觉回归：基线绑浏览器/OS/视口/DPR/字体；只 mask 最小无业务像素；基线更新当代码评审。axe 进 CI 能抓缺失名称、错误 ARIA；对比度与真实焦点放到浏览器模式——jsdom 无真实 layout。不能替代键盘/读屏。高 statement coverage ≠ 断言有效；`coverage.changed` 只限制收集范围不是 diff-line；mutation 抽样用在金额、权限、幂等更划算。

**失败形态：** E2E 共用 admin 账号互相踩数据；storage state 把会话上传到公开 artifact；契约只验 JSON shape 不验「库存为负应 409」；视觉基线随 OS 字体漂移却当业务回归。

**验收：** 首轮失败 trace 可下载；契约 diff 能解释破坏性变更；axe + 键盘路径进合并门禁的关键页。

### 7. 风险矩阵、竞态与结算页组合示例

先列影响 / 概率 / 可探测性，再为每项选最便宜可信层；同一 happy path 不必四层都测——留下反馈更快或真实性更需要的一层，预算留给异常与权限路径。缺人时优先保住关键旅程 E2E + 核心规则 unit + 一条 RUM 分端看板，而不是同时上齐视觉、mutation、全量契约。

竞态：用 deferred Promise 排列完成顺序，断言最新获胜、Abort 后仍防陈旧写回、卸载无副作用；AbortError 不当业务失败；debounce 用 fake timers 推到阈值再建请求，再 flush 微任务与 `nextTick`；随机退避固定种子，失败日志带种子以便 CI 复现。

**结算页组合：** 金额与优惠 → 表驱动 unit + 属性测试；表单错误与键盘 → component；登录过期/库存冲突/重试 → integration + MSW；API → schema + 消费者契约；Playwright 覆盖登录、下单、支付回跳（独立账号与订单，`retain-on-first-failure`）。PR 跑快速层与受影响契约；合并后跨浏览器 E2E/视觉/axe；灰度看真实错误。风险矩阵记录 owner、门禁、最后验证时间。

交叉证明：分包优化要 manifest + 关键旅程 E2E + 生产分位数；灰度 INP 变差时，普通加载 E2E 断言「按钮可见」抓不住主线程排队——INP 要用真交互 Lab 与 RUM eligible 样本。把证明责任设计进流水线，而不是事后解释。

### 8. 发布闭环：Lab 门禁 → 灰度 RUM → 回滚

发布前：Lab 固定设备/网络/脚本路径，挡住明显膨胀（关键 JS、LCP 资源、长任务）。合并后：灰度看 RUM 分端 p75 与错误率，附版本、实验桶、样本量。超阈值：页面 owner 决策回滚或停灰；平台 owner 保证采集口径没漂。

性能优化与测试失败要用同一套「证据」语言——瀑布、trace、契约 diff、首轮 Playwright trace——避免一边说「感觉快了」，一边说「重试就绿了」。证明优化有效：同一生产构建、代表设备与网络、足够样本量的分位数，并跑正确性回归；一次只改一个因素。Lab 负责定位，RUM 负责判决，灰度负责风险控制。体积下降不能直接说成 LCP 一定变好——先看关键路径是否真变。

对 Vue 应用：缩小更新扇出、computed、虚拟化 + 正确 key、shallow/markRaw、异步拆包、点状 memo、稳定 props。排查：Performance 分清 JS 还是布局 → Devtools 看谁在更新 → 再改数据契约。与工程化题库衔接：体积归因、制品晋级、Source Map 权限与灰度回滚必须接到同一发布系统。

**验收：** 每次优化有分位数前后对比 + 正确性回归；失败产物能区分代码/环境/数据/口径变更；回滚指针可切。

发布红线（嵌进闭环，不另开清单节）：不把无交互写成 INP=0；不把 soft navigation 自建指标冒充标准 LCP；不为覆盖率测 getter；不在窄单测 Mock 掉 Router/API 后宣称已证明导航与 HTTP；不把 flaky 永久 quarantine 却不设偿还日；不用加载 Lighthouse 冒充交互。把拒绝写进规范，比多引入一个监控 SaaS 更有杠杆。

优化与测试的共同目标是降低用户损失与发布风险，不是追求工具链完整度。收口句：「性能没有证据就是感觉，测试没有归因就是运气；门禁与 owner 把两者变成工程。」

若时间只够一分钟：报 CWV 分端口径、强调 Lab/RUM 分工、用风险矩阵点名测试层级、甩一个带分位数与回归证据的优化故事。 工具细节回题库深挖，不现场编配置。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 关键任务、设备层、流量、合规采样、发布窗口 |
| **方案** | 指标 / 预算 / 优化点 / 测试层级组合 |
| **取舍** | Lab 成本 vs RUM 覆盖；测试真实度 vs 反馈速度 |
| **验证** | 分端 p75、错误率、trace/首轮失败证据 |
| **复发防护** | 门禁、owner、例外偿还日、口径版本标记 |

用同一模板讲故事，避免堆工具名：约束说清设备层与流量；方案说清改了哪一环；验证必须是分位数而非单次 Lab；防护落到门禁与偿还日。

**案例 A — 「体积小了但 LCP 不动」**

- 约束：详情页 LCP 是头图；移动端慢网占比高。
- 方案：HTML 尽早发现图 + 正确 preload/fetchpriority；修 TTFB；非关键异步 JS 减负次要；核对 `imagesrcset` 与 `<img>` 一致。
- 取舍：图片管道改造 vs 只砍 vendor。
- 验证：RUM LCP 子阶段 + 瀑布；移动端冷缓存 p75；Lab 同设备复现。
- 防护：LCP 元素标签进 RUM；PR 资源预算含图片；禁止 LCP 图懒加载。

**案例 B — 「INP 差，给 handler 加了 debounce」**

- 约束：提交按钮点击慢。
- 方案：先看输入延迟是否被前序长任务/水合/第三方占用；再减处理与呈现工作。
- 取舍：debounce 可能牺牲反馈，不治排队。
- 验证：三段耗时 + LoAF；Lab user flow。
- 防护：第三方 kill switch；长任务预算。

**案例 C — 「E2E 全绿，线上仍挂」**

- 约束：支付回跳偶发。
- 方案：补契约 + 少量真实部署 E2E；worker 数据隔离；保留首轮 trace。
- 取舍：流水线变慢换真实接线信心。
- 验证：can-I-deploy + 灰度错误率。
- 防护：风险矩阵回填；禁止共用 admin 账号。

**案例 D — 「覆盖率 90% 仍漏严重缺陷」**

- 约束：金额计算分支。
- 方案：表驱动 unit + 边界；mutation 抽样；E2E 只留关键旅程。
- 取舍：mutation 成本。
- 验证：杀死变异体比例；线上逃逸缺陷回填。
- 防护：覆盖率是线索不是证明。

**案例 E — 「灰度 INP 变差，E2E 全绿」**

- 约束：分包后主线程排队变长。
- 方案：补真交互 Lab user flow；RUM 看 eligible 样本；关键旅程加 INP 相关长任务断言或 Performance 标记。
- 取舍：流水线变慢换交互真实性。
- 验证：分端 INP p75 + 首轮 trace。
- 防护：普通加载 E2E 不得宣称覆盖 INP。

证据坑位（填你的数）：核心路由移动端 LCP/INP/CLS p75〔填〕；预算例外未偿还数〔填〕；第三方 CPU 占比〔填〕；E2E flaky 率〔填〕；契约阻断发布次数〔填〕。

## 追问树

**主问：如何判定站点 CWV 是否达标？**

- L1：三指标阈值 + 分端 p75。  
  - L2：INP 无交互怎么办？CLS session window？  
    - L3：RUM 字段如何防 PII？收口：web-vitals + 白名单维度 + 最小样本量。

**主问：首屏慢你怎么拆？**

- L1：TTFB → 发现 → 下载 → 主线程 → 数据。  
  - L2：为何 soft nav 不能直接当 LCP？  
    - L3：如何避免 preload 优先级反转？收口：瀑布证据 + 阶段预算灰度。

**主问：INP 差怎么查？**

- L1：三段延迟。  
  - L2：Long Task / LoAF 角色；拆任务为何可能无效？  
    - L3：Worker 何时无收益？收口：eligible/coverage 分报 + 真交互 Lab。

**主问：测试金字塔比例怎么定？**

- L1：按风险不按固定比例。  
  - L2：MSW vs Mock client 边界？  
    - L3：何时加 E2E 而非 integration？收口：失败可归因 + owner。

**主问：Flaky 怎么办？**

- L1：数据/身份隔离；禁固定 sleep。  
  - L2：storage state 与 artifact 安全。  
  - L3：retry 后如何计门禁？收口：首轮证据 + flaky 预算 + 限期修复。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| CWV / RUM / 预算 | [20-performance Q1](/interview/questions/20-performance-ux)–[Q3](/interview/questions/20-performance-ux)、[D1](/interview/questions/20-performance-ux) |
| Hints / Bundle / 图片 / 字体 / 第三方 | [20-performance Q4](/interview/questions/20-performance-ux)–[Q8](/interview/questions/20-performance-ux) |
| Long Task / INP / 内存 / 大列表 | [20-performance Q9](/interview/questions/20-performance-ux)–[Q11](/interview/questions/20-performance-ux)、[D3](/interview/questions/20-performance-ux)、[D4](/interview/questions/20-performance-ux) |
| 首屏治理 / 告警 | [20-performance D2](/interview/questions/20-performance-ux)、[Q12](/interview/questions/20-performance-ux) |
| 测试分层 / Vitest / VTU | [21-testing Q1](/interview/questions/21-testing-quality)–[Q5](/interview/questions/21-testing-quality) |
| Pinia/Router / MSW / 契约 | [21-testing Q6](/interview/questions/21-testing-quality)–[Q8](/interview/questions/21-testing-quality)、[D4](/interview/questions/21-testing-quality) |
| Playwright / 视觉 / a11y | [21-testing Q9](/interview/questions/21-testing-quality)–[Q11](/interview/questions/21-testing-quality) |
| 风险组合 / 竞态 / Flaky | [21-testing D1](/interview/questions/21-testing-quality)–[D3](/interview/questions/21-testing-quality) |
| 体积与发布门禁 | [03-engineering Q4](/interview/questions/03-engineering)、性能相关追问 |

相关复习页：[工程与质量速记](/interview/review/sheets/03-engineering-quality)、[Vue3 响应式专题](/interview/review/topics/05-vue-reactivity)（大列表节）。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 口径 → 预算 → 诊断 → 测试证据 → 灰度回滚。
2. **（2 分钟）CWV：** 三阈值、分端 p75、INP 不填 0、CLS 窗口直觉。
3. **（2 分钟）Lab/RUM：** 分工；为何加载 Lighthouse 无 INP。
4. **（2 分钟）首屏/资源：** 发现顺序、LCP 图不懒加载、preload 匹配 srcset。
5. **（2 分钟）INP/运行时：** 三段；LoAF；大列表虚拟化+浅响应。
6. **（2 分钟）测试分层：** 风险驱动；MSW 边界；禁固定比例。
7. **（2 分钟）E2E/Flaky：** 语义 Locator、隔离数据、首轮 trace、flaky 门禁。
8. **（2 分钟）工程收口：** 模板讲一次性能或质量事故（数字〔填〕）。

自检口令：

- 「INP 没有交互记 0？」→ **否；保持无样本并报 coverage/缺失原因。**
- 「Lighthouse 加载模式有 INP？」→ **通常没有；要用真交互 flow。**
- 「测试一定要 70/20/10？」→ **否；按风险选层。**
- 「体积降了 LCP 一定好？」→ **否；先看关键路径是否真变。**
- 「soft nav 自建指标能叫标准 LCP 吗？」→ **不能；另命名，勿冒充 CWV。**
- 「flaky 永久 quarantine 可以吗？」→ **否；必须设偿还日并留首轮证据。**
- 「覆盖率多少算够？」→ **按风险，不按统一百分比；金额权限看分支与 mutation。**
