# 浏览器渲染与性能底座

> **真源：** [17 Browser/Web API](/interview/questions/17-browser-web-api)（主：导航、渲染、事件循环、BFCache、Worker）；[20 性能与 UX](/interview/questions/20-performance-ux)（CWV、LCP/INP、长任务、内存）。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背「DOM → CSSOM → Render Tree」词条，而是证明你能把一次「慢 / 卡 / 泄漏」讲成可证伪链路：

**导航路径分叉 → 解析与关键资源 → 主线程任务 / 微任务 → 渲染机会 → 输入延迟三段拆解 →（可选）BFCache / Worker / 内存 owner。**

面试官想听四类能力：

1. **路径感：** 网络导航、HTTP 缓存、Service Worker、BFCache 会让真实路径分叉；可交互不是单一 DOM 事件。
2. **调度感：** task / microtask / rendering opportunity / update-the-rendering；长任务与 LoAF 是线索不是 INP 本身。
3. **指标感：** LCP / INP / CLS 的判定口径（含 p75、无交互无 INP）；Lab 与 RUM 分工。
4. **工程取舍：** preload 与 `fetchpriority` 何时帮倒忙；Worker 通信成本；泄漏 vs 缓存预热。

口述红线（与题库冲突即扣分）：

- 把资源加载画成严格串行瀑布；
- 把 `DOMContentLoaded` / `load` 当首屏完成或可交互；
- 普通加载 Lighthouse「测出 INP」或把无交互访问记 INP=0；
- 注册 `unload` 做关键清理还指望 BFCache；
- 把一次 rAF 说成「像素已画完」。

十年经验口径下，面试官还在听你能不能用「约束 → 方案 → 取舍 → 验证 → 防护」讲一个 LCP / INP / 内存案例，数字用自己的 〔填〕。

## 知识地图

```text
导航 / 分叉              主线程调度                 体验指标                 长期驻留
DNS/缓存/SW/BFCache →  task → microtask      →   LCP 候选与发现     监听/Observer owner
HTML 增量解析 + 预加载扫描  rendering opportunity     INP 三段延迟        Heap retaining path
脚本策略 defer/async/module update-the-rendering     CLS session window  Worker 协议与 Transfer
关键 CSS / 字体 / 图片     Long Task / LoAF          Lab timespan + RUM   pagehide / pageshow
```

主线口诀：

1. **这次是哪种导航？**（网络 / SW / BFCache）
2. **谁阻塞了解析或渲染？**（同步脚本、CSS、字体）
3. **主线程卡在算、样式还是布局？**
4. **慢交互是输入延迟、处理还是呈现？**
5. **恢复路径有没有重验令牌与数据？**
6. **增长是泄漏还是合法缓存？**

## 完整讲解

### 1. 从 URL 到可交互：阶段与分叉

导航经 URL 处理、网络获取与响应提交。是否复用连接、命中 HTTP 缓存、由 Service Worker 响应或恢复 BFCache，都会改变路径。HTML 字节到达后解析器增量建 DOM，并发现样式、脚本、图片、字体等子资源；预加载扫描器可并行发现，不能假设严格串行瀑布——把并行发现误判成串行，会错估「谁该 preload」。

经典同步脚本默认阻塞解析；`defer` 在文档解析后、`DOMContentLoaded` 前按序执行；模块脚本默认类似 defer 调度，静态依赖会先加载并进入求值；`DOMContentLoaded` 等待模块同步求值部分执行或让出，若 top-level await 暂停求值，则不等待其后的异步续体。`async` 下载完即可执行、不保证顺序。CSS 形成 CSSOM，与 DOM 一起算样式与布局，再绘制、栅格化、合成——引擎可增量并行。

DOM 可访问、首次内容绘制、`DOMContentLoaded`、`load`、业务可交互是不同里程碑。主线程被长脚本占用时，资源到了输入仍可能延迟。工程上减少关键路径阻塞，正确设脚本策略与资源优先级，并让 SSR / 静态 HTML 提供基础内容。验证用 Navigation Timing、Resource Timing、Performance 面板与真实设备；时间线只描述该次运行；跨浏览器能力先查兼容矩阵再提供回退。分别测冷启动、热缓存、SW 控制、BFCache 恢复与弱网。证据坑位：〔填〕四条路径对比与一次误用 preload 抢占关键资源的复盘。

资深收口：「先确认本次是网络导航、SW 响应还是 BFCache 恢复，再按响应、解析、关键资源、脚本和渲染拆解；每个阶段用 Timing / trace 定位，同时验证内容可见、输入响应与错误回退。」

### 2. 事件循环、渲染机会与长任务

事件循环选一个可运行 task 执行；普通 task 结束后通常做 microtask checkpoint。rendering opportunity 由用户代理并行判断，并据此向 rendering task source 排入 update-the-rendering；**只有选中该任务**才运行 rAF 与样式 / 布局 / 绘制。普通 task 后不存在「必然直达渲染」的阶段。

计时器、事件、消息、rendering task 分属不同 task source，选择策略 ≠ 开发者可依赖的全局 FIFO。Promise / `queueMicrotask` 属微任务；检查点不结束，当前 task 就不能完成，已排队 rendering task 也无法选中——递归微任务会饥饿渲染。后台页的 rAF 会被节流或暂停。

Long Tasks：主线程持续超过约 50 ms 的任务线索，归因粗。LoAF：duration 超过 50 ms 的长动画帧，能把脚本、样式、布局放进帧上下文；可能没有渲染阶段（`renderStart` 可为 0），不能把 0 当真实渲染起点。二者都不等于 INP。优化：减总工作量 → 分片让出 → 或 Worker；动画在 rAF 中批量读写，避免布局抖动。`setTimeout(0)` 有最小延迟，不等于立即。

### 3. Core Web Vitals 与测量分工

当前 CWV：LCP、INP、CLS。题库口径：LCP 良好 ≤ 2.5 s；INP 良好 ≤ 200 ms；CLS 良好 ≤ 0.1。需改进与差的边界分别为 LCP > 4 s、INP > 500 ms、CLS > 0.25。判定看真实访问样本按移动 / 桌面分别算 **p75**，三项都良好才算过；不是平均值，也不是一次 Lighthouse。CWV 之外，错误率、业务可用时间、动画流畅度与任务完成率仍需独立 SLI。

CLS：先排除 `hadRecentInput=true`（合格离散输入后 500 ms 内标记）的 shift；hover、scroll 等不一定触发该排除。其余按 session window（相邻 < 1 s，窗最长 5 s）取窗口累计最大。INP：合格 click / tap / keyboard 交互延迟代表值，并对交互很多的页面做离群处理，不是简单平均；一次交互可含多个事件。**没有合格交互就没有 INP 样本，不能填 0**。应单报 eligible、coverage 与缺失原因（无交互 / 不支持 / 上报失败）。

把慢交互拆成输入延迟、处理时长、呈现延迟，再关联交互目标、Long Task、LoAF、组件与版本。输入延迟来自前序主线程工作；处理时长来自事件回调；呈现延迟可能来自后续任务、样式、布局与绘制。先减总工作量，再分片、调度或移出主线程。反模式：只给 handler 加 debounce、把同步任务包进 Promise、把 100 ms 连续切成两个仍无渲染机会的任务、盲迁 Worker 却传巨大对象、用普通加载 Lighthouse 声称测得 INP。

Lab 可控复现；RUM 看真实设备 / 网络 / 长会话。两者不能互相替代：Lab 变快不保证用户 p75 变快。普通页面加载 Lighthouse **不产生 INP**，要用 timespan / user flow 跑真实交互。`PerformanceObserver.supportedEntryTypes` 做能力探测；`observe({ type, buffered: true })` 可收较早缓冲条目，但 `entryTypes` 不能与 `type` / `buffered` 混用。优先维护中的 `web-vitals` 算 CWV；自定义 Observer 做归因并记录库 / 浏览器 / 指标版本。遥测脱敏：路由模板白名单，资源与 LoAF URL 去 query / fragment，函数名与 selector 映射为低基数语义标签，设采样率与基数上限，禁 Token、用户输入与个人信息。证据坑位：〔填〕站点移动端 p75 与一次回归归因（含 eligible coverage）。

### 4. 首屏 LCP 与资源提示

把首屏拆成服务端、网络、发现、下载、主线程、渲染、业务数据，以用户可见的非占位关键内容为终点。LCP 从导航起算，候选随更大内容更新；通常首次用户输入后停止新候选。原生 API 与 CWV 在 iframe、后台、预渲染等仍有差异。传统 LCP 以硬导航为中心，SPA soft navigation 标准识别仍有限制，不能简单把路由后最后一个候选当新页面 LCP，也不能自行重置时间却宣称等同标准 CWV。首屏可能被 TTFB、渲染阻塞 CSS、LCP 资源发现延迟、JS 水合或业务接口共同限制。

`dns-prefetch` 只解析域名；`preconnect` 还建连——只给极少数确定跨源，过多浪费 socket / CPU / 电。`preload` 是当前导航必需资源的强提示，`as` / 类型 / 跨源要正确，否则可能重复下载或抢占更关键资源。响应式图片 preload 必须让 `imagesrcset` / `imagesizes` 与 `<img>` 的 `srcset` / `sizes` 匹配，使浏览器走同一候选逻辑；禁止固定 `href` 误预载另一候选。后续页可能用的资源更适合谨慎 `prefetch`，浏览器可忽略。`fetchpriority` 只表达相对优先级，常用于提高已在 HTML 中发现的 LCP 图或降低非关键图，不替代发现顺序与懒加载策略，也不能全标 high。RUM 记录 TTFB、FCP、LCP 候选低基数标签、发现 / 请求时刻、关键 Chunk 与页面版本；按设备与网络分层设预算，灰度看 p75 / p95、错误与业务任务，超阈值回滚。常见坑：首屏 LCP 图懒加载、只压图忽略 TTFB、骨架当业务首屏、仅跑高配桌面 Lighthouse。

### 5. 事件、Observer、BFCache 与 Worker

事件分为捕获、目标和冒泡；传播路径在分发开始时确定，并受 Shadow DOM 重定向影响。`event.target` 是 retargeting 后暴露的目标，`currentTarget` 是当前监听器所在节点；`composedPath()` 可查看允许暴露的路径。并非所有事件都冒泡，也不能把点击经验套给所有事件。`preventDefault()` 取消可取消事件的默认行为，不停止传播；`stopPropagation()` 停传播，`stopImmediatePropagation()` 还阻止同目标后续监听器。`passive: true` 承诺不取消默认，其中 `preventDefault()` 无效并可能警告。确需取消滚动应显式 `{ passive: false }`，并优先评估 CSS `touch-action`；不能依赖各浏览器对 touch / wheel 的被动默认值一致。`once` 自动移除，`signal` 可统一清理。事件委托利用冒泡在稳定祖先处理动态子项，用 `closest()` 与容器边界确认合法目标，并考虑键盘、非冒泡与 Shadow。用真实输入验证，不要只调 `.click()`。

`MutationObserver` 观察 DOM 变化，通知偏微任务时机，适合整合第三方 DOM，不适合替代应用状态。`ResizeObserver` 在渲染更新相关阶段通知；回调里继续改变被观察尺寸可能形成 loop，浏览器会限制。`IntersectionObserver` 默认只异步报告几何交叉，适合懒加载与曝光候选，不提供逐像素同步保证，也不证明未被遮挡。实验性 `trackVisibility` / `isVisible` 属 Limited Availability，不能当精确曝光或安全依据。曝光统计还需叠可见时长、页面可见性与业务去重。回调应轻量，卸载 `disconnect` / `unobserve`。无能力时提供回退，正确性不能依赖「某毫秒必触发」。

页面生命周期：`visibilitychange` 进入 hidden 是暂停动画、停轮询与提交轻量遥测的重要信号；`pagehide` 适合处理被替换或进入 BFCache，比 `unload` 更可靠。移动端进程可能被直接终止，离开事件不是必达。`beforeunload` 只在确有未保存数据时动态注册。少量遥测可用 `sendBeacon()` 或 keepalive，但不能当事务保证。正确做法是持续幂等保存草稿。

BFCache：离开页连同 JS 堆冻结，后退快速恢复；`pageshow.persisted === true` 表示来自该缓存。恢复**不重跑**入口脚本，旧闭包、DOM 与内存状态仍在，但网络、锁、令牌、服务端数据可能已变——在 persisted pageshow 里恢复监听并重验时效，避免无条件整页 reload 抵消收益。`pagehide.persisted` 只表示可能被缓存。把资源分为可冻结保留、需暂停恢复、必须重验三类，用 pagehide / pageshow 驱动幂等状态机。用 DevTools BFCache 诊断看阻止原因；资格规则持续演进。证据坑位：〔填〕一次后退命中 / 未命中对比与修复。

Worker：独立全局环境，无 DOM / `window`，适合 CPU 密集的解析、编码与计算，不能让本就异步的网络请求神奇变快。`postMessage` 默认结构化克隆（支持循环引用等多种内建类型，不能克隆函数与 DOM）；大 `ArrayBuffer`、`MessagePort` 等可 Transfer 转移所有权，发送方缓冲会 detached。`SharedArrayBuffer` 是共享内存，要求跨源隔离等条件，还需 Atomics 协调。先测主线程阻塞再拆；估算「计算收益 − 通信与调度成本」；小任务频繁往返可能更慢。协议带 request id、版本、取消与过期丢弃；Worker 崩溃可重建；低端设备按硬件并发限制池大小。不支持时降级主线程分片。不要为每个列表项建 Worker，不要转移后仍复用缓冲。

### 6. 内存：泄漏 vs 预热

先定义「操作 → 回基线 → GC → 看保留量」的可重复流程。内存波动或缓存增长 ≠ 泄漏；关键是生命周期结束后是否仍可达。根常见于全局集合、监听、定时器、Observer、闭包、detached DOM、Worker、未关通道。垃圾回收只处理不可达对象；DOM 已移除但仍被监听或缓存引用就不会释放。BFCache 冻结页面也会保留堆，测试要区分预期缓存与泄漏。JS 堆只是浏览器内存一部分，图片、Canvas、GPU、第三方原生分配未必完整反映在普通堆快照中。

长期会话（客服台等）应独立做耐久脚本：循环路由 / 表格 / 弹窗 / 上传，记录版本、设备、JS heap、DOM、Worker、任务与崩溃，看 GC 后斜率。实验室用 Heap Snapshot 的 dominator / retaining path、Allocation instrumentation 与 Detached DOM 定位所有者。修复明确 owner 与 dispose：`AbortSignal`、停 watcher / Observer / timer、撤销对象 URL、缓存 LRU。发布前耐久测试，灰度观察内存趋势、页面失效与任务耗时。反模式：看到上涨就每分钟强制刷新；只在 `beforeUnmount` 清 DOM 不取消全局监听；用 WeakMap 代替所有缓存却不检查 value 仍被强引用；拿一次快照总量宣称修复。线上内存 API 支持与精度有限，只做分层趋势与异常采样。证据坑位：〔填〕长会话脚本时长与修复后斜率。

把渲染专题与性能题库串起来的最后一句：「先证明路径与调度，再用 CWV / 长任务 / 堆斜率验收；优化若换正确性或不可观测，就不算完成。」

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 设备档位、弱网、SEO / SSR、长会话 |
| **方案** | 脚本策略、preload、分片 / Worker、BFCache 状态机 |
| **取舍** | 首屏字节 vs 功能；命中 BFCache vs 实时性 |
| **验证** | RUM p75、Lab timespan、BFCache 诊断、堆斜率 |
| **复发防护** | 性能预算、禁 unload、disposal 清单、遥测脱敏 |

**案例骨架 A — 「LCP 差，但本地 Lighthouse 还行」**

- 约束：移动弱网长尾。
- 方案：HTML 早暴露 LCP 图；校准 preload / fetchpriority；优化 TTFB。
- 取舍：少预载非关键资源。
- 验证：〔填〕移动 p75 LCP 分层（冷暖缓存）。
- 防护：字节与阶段预算 + 灰度回滚。

**案例骨架 B — 「点击卡，Promise 切片后仍卡」**

- 约束：交互必须 〔填〕 ms 级反馈。
- 方案：按 INP 三段拆；真分片让出渲染机会或 Worker；LoAF 归因。
- 取舍：实现复杂度上升。
- 验证：timespan 复现 + RUM eligible INP。
- 防护：禁止伪 Promise 让出；交互回归门禁。

**案例骨架 C — 「后退白屏 / 重复监听」**

- 约束：列表要秒回，数据可能过期。
- 方案：pagehide 暂停；persisted pageshow 幂等恢复 + 静默刷新策略。
- 取舍：偶发多一次请求。
- 验证：DevTools BFCache 阻止原因 + 真实后退。
- 防护：禁 unload；集中 suspend/resume。

**案例骨架 D — 「开一天后台内存爬升」**

- 约束：长会话不崩溃。
- 方案：retaining path 找 owner；统一 dispose；缓存上限。
- 取舍：少一点「全局方便缓存」。
- 验证：耐久脚本斜率收敛。
- 防护：disposal checklist 进 CR。

## 追问树

**主问：从输入 URL 到可点，你怎么拆？**

- L1：有哪些路径分叉？  
  - L2：脚本策略与 CSS 如何影响？  
    - L3：为何 DCL ≠ 可交互？收口：分阶段 Timing + 真实设备。

**主问：为何说 task 结束后不保证渲染？**

- L1：microtask checkpoint 与 rendering task。  
  - L2：微任务饥饿机制。  
    - L3：rAF 与像素呈现？收口：用轨道证据，不背固定帧率神话。

**主问：INP 差你怎么查？**

- L1：三段延迟分别是什么。  
  - L2：Long Task / LoAF 与 INP 关系？  
    - L3：为何普通 Lighthouse 不够？收口：eligible + timespan + 灰度 p75。

**主问：BFCache 恢复要做什么？**

- L1：persisted 语义；为何不用 unload。  
  - L2：哪些要暂停 / 重验？  
    - L3：一律 reload 的代价？收口：两条路径共享正确性契约。

**主问：内存上涨就是泄漏吗？**

- L1：预热平台期 vs GC 后持续增长。  
  - L2：如何跑可重复流程？  
    - L3：WeakMap 能否替代所有缓存治理？收口：owner + 斜率。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| 导航到可交互 | [17-browser Q1](/interview/questions/17-browser-web-api)、[D1](/interview/questions/17-browser-web-api) |
| DOM 事件 | [17-browser Q2](/interview/questions/17-browser-web-api) |
| Observer | [17-browser Q3](/interview/questions/17-browser-web-api) |
| Page Lifecycle | [17-browser Q6](/interview/questions/17-browser-web-api) |
| BFCache | [17-browser Q7](/interview/questions/17-browser-web-api)、[D6](/interview/questions/17-browser-web-api) |
| Worker | [17-browser Q8](/interview/questions/17-browser-web-api)、[D7](/interview/questions/17-browser-web-api) |
| Event Loop / 长任务 | [17-browser D2](/interview/questions/17-browser-web-api) |
| 内存泄漏 | [17-browser D3](/interview/questions/17-browser-web-api)、[20-perf Q10](/interview/questions/20-performance-ux)、[D5](/interview/questions/20-performance-ux) |
| CWV | [20-perf Q1](/interview/questions/20-performance-ux) |
| RUM / Lab | [20-perf Q2](/interview/questions/20-performance-ux) |
| Resource Hints | [20-perf Q4](/interview/questions/20-performance-ux) |
| Long Task / LoAF | [20-perf Q9](/interview/questions/20-performance-ux) |
| 首屏治理 | [20-perf D2](/interview/questions/20-performance-ux) |
| INP 诊断 | [20-perf D3](/interview/questions/20-performance-ux) |

相关复习页：[Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)、[性能与质量专题](/interview/review/topics/08-perf-testing)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 路径分叉 + 调度 + CWV；可交互不是单一事件。
2. **（2 分钟）导航链路：** 解析、脚本策略、里程碑差异。
3. **（2 分钟）渲染调度：** checkpoint、rendering opportunity、微任务饥饿。
4. **（2 分钟）CWV 口径：** LCP/INP/CLS 阈值与 p75；无交互无 INP。
5. **（2 分钟）首屏手段：** preload / fetchpriority 边界与反模式。
6. **（2 分钟）BFCache + Worker：** persisted、禁 unload、克隆 vs Transfer。
7. **（2 分钟）内存：** 可重复流程与 owner；泄漏 ≠ 上涨。
8. **（2 分钟）案例收口：** 用五步模板讲 LCP 或 INP 案（〔填〕）。

自检口令（必须能脱口而出）：

- 「普通 Lighthouse 有 INP 吗？」→ **没有合格交互就没有；需 timespan / user flow。**
- 「task 后一定渲染吗？」→ **不一定；要等 rendering task 被选中。**
- 「unload 可以做清理吗？」→ **不可靠，还可能毁掉 BFCache 资格。**
- 「无交互 INP 记 0？」→ **不能；应记缺失原因。**
