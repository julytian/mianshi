# JS 运行时与异步

> **真源：** [01 JS/TS](/interview/questions/01-js-ts)（主：事件循环、异步、模块、并发与引擎边界）。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背「宏任务比微任务晚」口令，而是证明你能把一次用户可感知卡顿或竞态讲成完整链路：

**同步执行 → 微任务检查点 →（可能）渲染机会 → 宏任务 / 事件 → 取消与写回纪律 →（可选）Worker / 切片让出。**

面试官想听四类能力：

1. **时序感：** `Promise` / `queueMicrotask` / `setTimeout` / `await` 续体如何排；微任务递归为何能饿死渲染。
2. **正确性感：** 防抖 / 节流、并发池、`AbortController` 如何防止旧响应覆盖新状态。
3. **边界感：** 闭包抓住过期值、深拷贝边界、`structuredClone` 不能做什么；隐藏类 / IC 是引擎假设不是语言规范。
4. **工程取舍：** 什么时候切片、什么时候上 Worker、什么时候接受串行；如何用 Performance 证据收口。

口述红线（与题库冲突即扣分）：

- 把「所有 Promise 都比 `setTimeout` 早」讲成绝对口号，不顾嵌套与 `await` 拆分；
- 把长循环改成一串 `Promise.resolve().then(...)` 当「让出主线程」；
- 把 `setTimeout(0)` 当精确时序或下一帧；
- 把 V8 隐藏类阈值编成固定数字背；
- 空 `catch`、fire-and-forget 不接拒绝却声称「错误处理完善」。

十年经验口径下，面试官还在听你能不能用「约束 → 方案 → 取舍 → 验证 → 防护」讲一个竞态或卡顿事故，而不是只复述事件循环示意图。

## 知识地图

```text
语言 / 作用域          调度层                    异步正确性              引擎 / 模块边界
闭包与过期值       →   同步任务              →   AbortSignal 取消     ESM live binding
this 绑定优先级        微任务检查点               并发池 + 保序          tree-shaking / 副作用
structuredClone 边界   渲染机会 / rAF            错误分层可观测         CJS 互操作副本
防抖 / 节流细节        宏任务 / 长任务切片        过期写回丢弃           Hidden Class / IC（非规范）
```

主线口诀：

1. **谁在跑、跑完清空什么**（同步 → 微任务）
2. **何时可能画**（rendering opportunity，不是「task 后必渲染」）
3. **谁该取消、谁禁止写回**（signal / 代次）
4. **错误在哪一层被捕获**（规范化 → 上下文 → UX）
5. **卡顿是算力还是布局**（trace 再切片 / Worker）
6. **模块为何摇不掉 / 环为何炸**（静态图 + 副作用 + TDZ）

## 完整讲解

### 1. 闭包、`this` 与「过期值」事故形态

闭包是函数带着定义时的词法环境跑。用途很普通：工厂私有状态、事件处理器记住配置、composable 里的实例级变量、柯里化配置。坑不在闭包本身，而在**抓住了已经过期的业务真相**：循环里 `var` + 异步；回调捕获旧 props / state；定时器没清，组件卸了还改状态；模块单例或全局 EventBus 挂着大对象导致泄漏。

口述结构固定：用途 → 抓住的是引用还是值 → 举一个过期闭包事故。`let` 在 `for` 里能「修好」经典题，是因为每次迭代有新的词法绑定，不是魔法复制；若闭包捕获对象，仍共享对象引用。模块顶层变量本身不叫闭包，但模块内导出函数若引用它，就形成对模块词法环境的闭包——模块环境通常长期存活，SPA 路由切换后更容易残留单例状态。排查泄漏要用 Heap Snapshot 的 retaining path 证明「业务生命周期已结束仍可达」，闭包只是路径上的一环；修复应找到 owner，建立注册与注销的对称关系。

`this` 优先级口头版：`new` > `bind` / `call` / `apply` 显式 > 对象调用隐式 > 独立调用（严格模式 `undefined`，非严格指向全局）。箭头函数没有自己的 `this`，继承外层词法 `this`——适合回调，不适合需要动态 `this` 的方法。类字段箭头、Vue Options API 的 methods（别用箭头）、React class 里 bind，都是同一套规则的不同皮肤。解构出方法再调用会丢隐式绑定，这是追问常考皮。

### 2. 事件循环：同步 → 微任务 →（可能）渲染 → 宏任务

浏览器大致模型：执行同步 JS → 清空微任务队列（`Promise.then`、`queueMicrotask`、`MutationObserver`）→ 可能渲染 → 取一个宏任务（`setTimeout`、I/O、UI 事件等）→ 再清微任务……

经典口述：

```js
console.log('a')
setTimeout(() => console.log('b'), 0)
Promise.resolve().then(() => console.log('c'))
console.log('d')
// a d c b
```

`async/await` 在 `await` 之后的代码本质是微任务续体。面试给「同步 → 微任务清空 → 宏任务」就够用，再补一句「别用定时器做精确时序」。嵌套 `then`、多次 `await` 拆分、以及 Node 与浏览器细节会变，所以不要背「所有 Promise 永远早于所有定时器」的绝对口号；现场以「当前这段同步跑完后、微任务清空前，已排队的 reaction 会先跑完」为准。

更深一层（题库 D2）：普通 task 结束后做 microtask checkpoint，**不直接渲染**。rendering opportunity 由用户代理并行判断，再排入 update-the-rendering task；只有事件循环选中该任务时，才跑 `requestAnimationFrame` 与样式 / 布局 / 绘制。计时器、事件、消息、rendering task 分属不同 task source，不能假设全局 FIFO。ECMAScript 规定 Job / Promise 相关抽象，事件循环与渲染时机主要由 HTML 标准定义——面试官若追问「规范在哪」，按这句分层即可，不必背条款号。

微任务检查点会执行到队列清空：在微任务里递归追加微任务，可以长期占住主线程，已排队的 rendering task 也无法被选中——这就是「微任务饿死渲染」。把长循环改成一串 `Promise.then` **没有**让出主线程给渲染。`setTimeout(0)` 有最小延迟、节流与排队，不等于立即；嵌套定时器还可能受最小延迟限制。一次 rAF 回调发生在相关渲染更新前，像素何时呈现仍由用户代理决定，不能说「rAF 完就一定画完了」。需要「框架更新后的 DOM」用框架 `nextTick`；需要「下一帧样式计算」再叠 rAF；两者解决的问题不同，不要混用碰运气。

超过约 50 ms 的主线程任务会被 Long Tasks API 识别，但 50 ms 是观测口径，不是「低于就不卡」的保证。工程上用 Performance 面板同时看 Main、Long Task、Event Timing 与渲染轨道，先分清是解析、计算、布局还是绘制贵，再决定切片、降优先级或迁 Worker。大计算按帧或按时间预算切片；视觉更新走 rAF；非关键工作可用受支持的调度 API，并保留 `setTimeout` / 消息分片回退。证据坑位：〔填〕一次卡顿的 Performance 时间线与切片改造前后对比（含设备档位与是否节流）。

### 3. 防抖、节流与 `AbortController`

防抖盯「停下来再算」：搜索联想、resize 结束后重算。节流盯「周期内至多一次」：滚动埋点、拖拽跟手。实现细节比模板代码重要：`leading` / `trailing`、透传 `this` / `arguments`、返回 Promise 时如何取消前一次、组件卸载必 `cancel`，并与 `AbortController` 组合取消进行中的请求。

`AbortController` 把 `signal` 传给 `fetch` / axios；路由切换、新搜索发出前、卸载时 `abort()`，避免慢请求回写新页面。abort 通常是 `AbortError`，UI 别当失败 toast。取消后仍可能收到网络尾包，必须用代次或 signal 状态丢弃写回。证据坑位：〔填〕列表快翻页：旧响应不得覆盖新页的验收用例。

### 4. Promise 并发池、错误分层与可取消链路

`Promise.all` 是全开火；并发池是「工人数固定，做完再取下一个」。实现直觉：维护执行中计数 + 等待队列，或 `await Promise.race(executing)` 腾出名额再取下一个。业务要问清：失败 fail-fast 还是 `allSettled`？失败是否仍占并发名额？结果是否按输入保序（占位数组按 index 回填）？重试退避如何分类（传输可重试、业务 4xx 不盲重试）？`AbortSignal` 如何传到每个任务，取消后旧结果为何不得写 UI？N 看后端限流与连接数，不是越大越快。管理后台批量导出、图片压缩上传、打一批详情接口，都是经典场景。证据坑位：〔填〕批量上传 / 批量详情的并发上限与取消验收。

错误处理分层（Q10 + D3）：底层把可预期业务错误收成统一类型（code / message），不可预期保留 `cause`；中层补订单号等上下文并继续抛；页面边界做 toast / 重试 / 降级。中间层该抛就抛，别到处吞。`async` 返回 Promise，调用方必须 `await` 或 `.catch()`。`.then(onFulfilled, onRejected)` 的 `onRejected` 捕不到同一 `then` 的 `onFulfilled` 新抛错，链尾 `.catch` 才能接住。`finally` 默认不改变原结果，除非自身抛错或返回拒绝。`Promise.all` 首拒不等于自动取消其他任务——取消要另传 signal，超时与用户取消用可区分的 `reason`。空 `catch`、拦截器 toast 后返回 `undefined`、`void doAsync()` 不接拒绝，都是静默事故或二次类型错误。`unhandledrejection` 只能兜底上报，不能替代局部恢复。循环里 `await` 是串行；故意并发要用 `map` + 限制。

资深收口句：「按可恢复边界捕获——底层规范化，中层补上下文，页面做 UX；并发失败不等于取消，AbortSignal 必须向下传；fire-and-forget 也必须显式消费拒绝。」

### 5. 深拷贝、`structuredClone` 与集合选型

「深拷贝」是产品决策：要不要函数、Symbol、Date、Map/Set、DOM、循环引用？`JSON` 往返只适合纯 JSON 快照。现代优先 `structuredClone`：能处理更多内建类型与循环引用；不能：函数、DOM、部分带方法的 class 实例。业务上更多要的是不可变局部更新，不是整树拷贝。

`Set` / `Map` 适合集合语义与任意键；固定形状记录仍用 object。`WeakMap` / `WeakSet` 不阻 GC，适合给 DOM / 第三方实例挂元数据，不能迭代。热点路径按 id 查，先建 `Map` / `Record`，别在渲染热路径 `find` 扫几千条。

### 6. ESM、tree-shaking 与引擎优化边界

CJS：`require` / `module.exports`，运行时加载，同步为主。ESM：`import` / `export`，静态可分析，浏览器原生友好。坑在互操作：`import x from 'cjs-pkg'` 拿到的是 `module.exports` 还是 `.default`，取决于打包器与 `esModuleInterop`；双包入口容易 `instanceof` 失效或加载两份拷贝。写库注意 `exports` 条件导出。

ESM import 是 live binding（实时只读视图），不是导入时复制值。live binding 不保证任意循环都安全——顶层副作用、TDZ、初始化顺序仍会炸。把循环只靠调整 import 顺序压住，升级打包器后可能再炸。tree-shaking 依赖静态图与可信副作用信息：命名导出、纯函数友好；`import *`、动态 `import()` 路径不确定、顶层改全局 / polyfill / CSS 副作用导入会保守保留。大 barrel `export *` 常让分析变钝。`sideEffects: false` 当瘦身开关可能删掉必须执行的样式或注册代码。排查拆三层：链接、求值、打包保留链——用构建分析图看保留链，把共享常量 / 协议类型下沉到无副作用模块，用依赖反转或显式初始化消业务环；库作者准确声明 `sideEffects`，并用消费方构建测 CSS / polyfill 没被误摇。

V8 隐藏类与内联缓存是引擎实现策略，**不属于 ECMAScript 语义**。形状相同可能复用内部类，热点访问从单态走向多态乃至超多态；形状频繁变化或同一访问点混入许多无关对象，收益下降。阈值与退化方式随 V8 版本变，不能编固定数字，也不能用微基准宣称「某写法永远快」（JIT 预热、死代码消除会骗人）。工程上先用 Performance / 采样 Profiler 确认属性访问真是瓶颈，再统一 DTO 构造顺序、避免热循环反复增删属性、字典语义交给 `Map`。把所有字段预填 `undefined` 可能只增内存。资深口径：「隐藏类和 IC 是性能假设，不是编码教条；业务语义优先，且明确这是实现细节。」

### 7. 口述时如何把「运行时」收成一条故事

面试官常从事件循环跳到卡顿，再跳到竞态。你的主线应始终能回到三句话：

1. **调度：** 同步与微任务何时让出渲染机会；
2. **正确性：** 取消、代次、错误分层如何保证旧结果不污染 UI；
3. **证据：** Performance / 竞态单测 / 体积分析，而不是口号。

若被追问 Vue 的 `nextTick`，明确它等的是框架更新队列，不是浏览器「下一帧画完」；与本专题的 rAF / 长任务诊断衔接即可，细节回 Vue 专题。若被追问手写题，优先讲清边界（循环引用、取消、leading/trailing），再写代码骨架——边界讲不清，写对也容易被加压问倒。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 交互延迟预算、并发上限、取消语义、设备档位 |
| **方案** | 切片 vs Worker、并发池 N、防抖参数、错误分层 |
| **取舍** | 延迟 vs 吞吐、主线程 vs 通信成本、可观测复杂度 |
| **验证** | Performance / Long Task、竞态用例、拒绝覆盖率 |
| **复发防护** | 卸载 cancel 约定、signal 向下传、lint 禁空 catch |

**案例骨架 A — 「搜索联想旧结果盖新词」**

- 约束：输入极快，弱网下响应乱序。
- 方案：防抖 + 每次请求新 `AbortController`；写回前校验 signal / 代次。
- 取舍：多几次取消与重试观测成本。
- 验证：快速输入「ab → abc」断言 UI 只显示 abc。
- 防护：请求封装强制传 signal；单测覆盖竞态。

**案例骨架 B — 「页面偶发卡死，Promise 改写后更卡」**

- 约束：大计算必须在交互中完成初步反馈。
- 方案：按时间预算切片或迁 Worker；动画走 rAF；禁止微任务递归当让出。
- 取舍：Worker 有克隆 / Transfer 成本。
- 验证：trace 看渲染机会是否回来；〔填〕INP / 长任务分位数。
- 防护：热点路径 checklist；禁止「全改 Promise」伪优化。

**案例骨架 C — 「批量导出打爆网关」**

- 约束：后端限流，浏览器连接有限。
- 方案：并发池 + 失败策略 + 共享 / 分层 AbortSignal。
- 取舍：总耗时变长换稳定性。
- 验证：同时飞行数不超过 N；取消后无写回。
- 防护：N 可配置并观测 429；默认 fail 分类重试。

**案例骨架 D — 「发版后体积暴涨 / 循环依赖上线炸」**

- 约束：要摇树又要 CSS / polyfill 副作用保留。
- 方案：拆无副作用契约层；纠正 `sideEffects`；消灭业务环。
- 取舍：少写大 barrel，开发体验略降。
- 验证：构建分析保留链；产物体积与运行冒烟。
- 防护：CI 体积预算 + 环检测。

## 追问树

**主问：从点击到屏幕更新，事件循环里发生了什么？**

- L1：同步 handler → 微任务检查点 → 是否可能渲染？  
  - L2：微任务递归为何饿死渲染？`setTimeout(0)` 为何不等于下一帧？  
    - L3：rAF 与「像素已呈现」差在哪？收口：用 Performance 轨道说话，不背私有队列名。

**主问：列表快翻页数据错乱，你怎么查？**

- L1：是否缺 Abort / 代次？旧响应是否仍写 store？  
  - L2：防抖与请求取消如何叠加？AbortError 如何对待？  
    - L3：并发池场景如何保序又取消？收口：写回门闩 + 单测竞态。

**主问：`async/await` 错误你怎么分层？**

- L1：throw 在 async 里变成拒绝；await 重新抛出。  
  - L2：`then` 双回调与链尾 `catch` 差异？`all` 不自动取消？  
    - L3：可观测字段与脱敏？收口：规范化 → 上下文 → UX，禁止空 catch。

**主问：主线程算不动，上不上 Worker？**

- L1：先证明 CPU 密集且 IO 边界清晰。  
  - L2：结构化克隆 vs Transferable？小任务频繁往返是否更慢？  
    - L3：取消与过期结果？收口：算收益减通信成本，保留分片回退。

**主问：tree-shaking 为何摇不掉？**

- L1：是否 ESM 静态、有无副作用？  
  - L2：live binding 与循环初始化？`sideEffects: false` 风险？  
    - L3：如何证明保留链？收口：分析图 + 消费方构建测试。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| 闭包与作用域 | [01-js-ts Q4](/interview/questions/01-js-ts) |
| 事件循环基础 | [01-js-ts Q5](/interview/questions/01-js-ts) |
| this 绑定 | [01-js-ts Q6](/interview/questions/01-js-ts) |
| 深拷贝 / structuredClone | [01-js-ts Q7](/interview/questions/01-js-ts)、[Q21](/interview/questions/01-js-ts) |
| 防抖节流 | [01-js-ts Q8](/interview/questions/01-js-ts) |
| 并发池 | [01-js-ts Q9](/interview/questions/01-js-ts) |
| async 错误惯例 | [01-js-ts Q10](/interview/questions/01-js-ts) |
| AbortController | [01-js-ts Q22](/interview/questions/01-js-ts) |
| ESM / CJS / tree-shaking | [01-js-ts Q11](/interview/questions/01-js-ts)、[Q12](/interview/questions/01-js-ts)、[D6](/interview/questions/01-js-ts) |
| 渲染机会与长任务 | [01-js-ts D2](/interview/questions/01-js-ts) |
| Promise 可观测与取消 | [01-js-ts D3](/interview/questions/01-js-ts) |
| 隐藏类 / IC | [01-js-ts D1](/interview/questions/01-js-ts)、[Q27](/interview/questions/01-js-ts) |
| Map / Set / Weak* | [01-js-ts Q17](/interview/questions/01-js-ts)、[Q18](/interview/questions/01-js-ts) |

相关复习页：[Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)、[浏览器渲染专题](/interview/review/topics/03-browser-rendering)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 同步 → 微任务 →（可能）渲染 → 宏任务；声明不把 Promise 包装当让出主线程。
2. **（2 分钟）经典时间线：** 能手画 `a d c b` 例子，并说明 `await` 续体。
3. **（2 分钟）渲染与饥饿：** microtask checkpoint 与 rendering task 关系；递归微任务后果。
4. **（2 分钟）防抖 / 节流 / Abort：** 场景拆分 + 卸载 cancel + 旧响应不写回。
5. **（2 分钟）并发与错误：** 池化 N、`all` vs 池、错误三层、signal 向下传。
6. **（2 分钟）拷贝与集合：** `structuredClone` 边界；何时 Map/Set/WeakMap。
7. **（2 分钟）模块与引擎：** live binding ≠ 循环安全；摇树条件；隐藏类非规范。
8. **（2 分钟）工程收口：** 用「约束 → 方案 → 取舍 → 验证 → 防护」讲自己的竞态或卡顿案（数字用 〔填〕）。

自检口令（必须能脱口而出）：

- 「长循环改成 Promise 链能让出渲染吗？」→ **不能；微任务仍占住检查点。**
- 「`setTimeout(0)` 是下一帧吗？」→ **不是；有延迟与排队，且不等于渲染完成。**
- 「50 ms 长任务是硬门槛吗？」→ **是观测口径，不是「低于就不卡」。**
- 「取消后还可能写回吗？」→ **网络尾包可能到达；必须丢弃写回。**
