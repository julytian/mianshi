# Vue3 响应式与渲染

> **真源：** [02 Vue3](/interview/questions/02-vue3)（主）；水合与 Nuxt 侧入口见 [23 Nuxt](/interview/questions/23-nuxt) Q9。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背 `ref` / `reactive` API，而是证明你能把一次用户可见更新讲成完整链路：

**读 → track → 写 → trigger → 调度批处理 → 编译提示缩小 patch → DOM 复用 / 重建 →（可选）SSR 水合对齐。**

面试官想听四类能力：

1. **边界感：** 什么时候响应式「故意不更新」（shallow、条件漏收集、Suspense 接管选项失效）。
2. **时序感：** `watch` flush、`nextTick`、组件更新队列与 DOM 读时机。
3. **身份契约：** `key`、KeepAlive 缓存身份、proxy / raw 混用。
4. **工程取舍：** 大列表 / 大表单如何降级响应式而不换正确性；水合失败如何定位而不是压警告。

口述红线（与题库冲突即扣分）：

- 停在「Proxy 比 `Object.defineProperty` 强」而不谈依赖面与调度；
- 把 Suspense 讲成已有正式错误槽，或接管后仍同时生效两套 loading / error UI；
- 把 KeepAlive 说成「缓存路由 path」；
- 把 Vite 8 生产默认说成 Rollup（即便本题主线是 Vue，口径也不能说错）；
- 堆内部未公开字段名当契约。

十年经验口径下，面试官还在听你能不能用「约束 → 方案 → 取舍 → 验证 → 防护」讲一个自己的事故，而不是只复述文档。

## 知识地图

```text
数据层                调度层                 编译 / 运行时              工程边界
ref / reactive   →   effect 栈          →   模板 → VNode            KeepAlive 实例缓存
Proxy track/trigger  job 队列批处理         静态提升 / PatchFlags     Suspense loading 边界
shallow / markRaw    watch flush            Block Tree / patch       SSR HTML ↔ 客户端 vnode
computed 惰性脏检查   nextTick               keyed diff / LIS         ClientOnly / 确定性
```

主线口诀：

1. **谁在读、读了什么**（依赖面）
2. **写了什么、谁被唤醒**（触发面）
3. **何时刷 DOM**（flush / nextTick）
4. **刷哪些节点**（PatchFlags / key / memo）
5. **实例是否还在**（KeepAlive / 强制换 key）
6. **首屏是否同构**（hydration）

## 完整讲解

### 1. Proxy / ref：身份、拆包与选型

`ref` 包 `{ value }`，适合基本类型，也适合「整个引用要被替换」的对象。`reactive` 直接对对象做深层 Proxy，属性读写更自然，但解构会丢掉代理身份，整表替换也不顺手。

底层都是 Proxy（再加 `RefImpl` 等封装）：读属性 track，写属性 trigger。相对 Vue 2，能监听属性增删、数组索引、`Map` / `Set`，且嵌套对象惰性代理。面试别背实现细节变量名，要讲公开语义。

实战习惯（与题库一致）：

- 组件局部状态多数用 `ref`（含对象）；
- 一组共同演进、很少整体替换的字段可用 `reactive`；
- 跨 composable 传出优先 `ref`，需要解构时用 `toRefs` / `toRef`；
- TS 下 `ref` 推断通常更稳。

模板会对渲染上下文顶层 ref 自动拆包；script 里必须 `.value`。数组 / 集合里的 ref、深层表达式并非处处自动拆包。

`toRaw` / `markRaw` 管「代理身份」：第三方实例、不可被代理的句柄应 `markRaw`，再常配合 `shallowRef` 只在句柄替换时更新。`markRaw` 只标记传入对象本身，未标记的嵌套仍可能进入响应式图。业务相等优先稳定 id，不要拿 proxy 与 raw 做 `===` 碰运气。

`toRef(obj, 'key')` 得到与属性相连的 ref；`toRefs` 只转换调用时已有可枚举属性；`toValue` / `unref` 统一取出 MaybeRef。对 props 的相连 ref **不建议写回**（单向数据流）。composable 参数接受 `MaybeRefOrGetter` 时，应在 computed / watch getter 内用 `toValue` 读取，避免先取成快照后丢失追踪。

相对 Vue 2 的「真会疼」差异也要能顺带一句：数组下标赋值在 Vue 3 可触发，但解构、shallow 原地改、raw / proxy 混用是新坑；新代码优先 composable 而非 mixin。

### 2. track / trigger、effect 栈与调度批处理

正在运行的渲染 effect、computed、`watchEffect` 在读取时建立依赖；写入时按依赖图调度。关键句：**没读到的属性不会建立依赖。**

```js
if (obj.a) {
  use(obj.b) // a 为假时不会追踪 b
}
```

条件从真变假后，旧分支依赖必须清理，否则改「已经不可见」的数据仍会叫醒 effect。`JSON.stringify` 一类全量扫描会过度收集。嵌套 computed / 组件渲染用 effect 栈恢复外层 effect。

`trigger` 通常把任务交给调度器：组件更新与 watcher 作为不同 job 入队，同一 job 在同一轮刷新中去重，微任务阶段按既定顺序执行。因此同一 tick 连续改多个 `ref`，组件侧常只 patch 一次。这不是「所有 watcher 自动合并」的保证——不同 watcher 或 `flush: 'sync'` 不在此保证内。

effect 内同步写回自身依赖可能递归；异步回调里第一次读取不会自动建依赖；把任意异步都当成同一批次会错判刷新次数。调试用 `onTrack` / `onTrigger`、Vue Devtools 与 Performance。口述结构固定为：**谁在读 → 读了什么 → 写了什么 → 谁被唤醒**，别堆源码私有变量名。

条件从真变假后，旧分支依赖必须清理，否则改「已经不可见」的数据仍会叫醒 effect。列表渲染只访问用到的字段；`JSON.stringify` 一类全量扫描会过度收集。嵌套 computed、组件渲染与 `watchEffect` 依赖 effect 栈恢复外层 effect——公开语义如此，具体栈实现细节不承诺变量名。

### 3. computed 脏检查与 watch flush

选型：

- **computed：** 纯派生 + 缓存；
- **watch：** 显式依赖、要 oldValue、要清理副作用；
- **watchEffect：** 简单自动依赖，副作用边界短。

computed 通常惰性：依赖变更先使缓存失效并通知消费者，真正读 `.value` 时才跑 getter；本轮无人读取可不计算。不要在 getter 里发请求或改状态。

`watch` flush：

| flush | 时机直觉 | 典型用途 |
| --- | --- | --- |
| `pre`（默认） | 父更新后、所属组件 DOM 更新前 | 多数业务副作用；此时读自身 DOM 常是旧值 |
| `post` | 所属组件 DOM patch 之后 | 测布局、聚焦、读更新后 DOM |
| `sync` | 依赖变更立即跑 | 极少数同步失效；损失批处理，易读中间态 |

`watchEffect` 只收集同步阶段读取；第一个 `await` 之后新读的 ref 不纳入该轮自动依赖。异步请求必须用清理回调取消旧请求，避免旧响应覆盖新状态。

`nextTick(fn)` 等的是 Vue 更新队列刷完（通常挂微任务，语义以「更新之后」为准）。`setTimeout(0)` 更靠后且与其他宏任务交错。能 `nextTick` 就别用定时器碰运气；链式多次仍读不到，先怀疑还有图片加载、子组件再次改状态等独立异步。与 `requestAnimationFrame` 搭配测布局时：先 `await nextTick()` 保证 patch 完成，若还需等下一帧样式计算再 await rAF。

`watchEffect` 只收集**同步执行阶段**读取的依赖；第一个 `await` 之后新读的 ref 不纳入该轮自动依赖。需要追踪的值应在 await 前读成快照，或改用显式 `watch` 依赖列表，并用清理回调取消旧请求，避免旧响应覆盖新状态。大对象 deep watch 会递归遍历，成本高且难控——能拆依赖就拆。

### 4. 编译优化与 patch：静态提升、PatchFlags、Block Tree

Vue 3 模板编译与运行时协作缩小更新范围：

- **静态提升：** 纯静态节点提到渲染函数外，每次 render 复用同一 vnode；
- **PatchFlags：** 标记动态点落在文本 / class / props 等，patch 走快速路径；
- **Block Tree：** 收集动态后代，跳过静态子树遍历。

`v-if` / `v-for` 等结构性指令会形成新的 block 边界，因为动态后代集合不再固定。JSX / 手写 render 也能工作，但通常吃不到同等密度的编译提示——所以「手写不一定更快」。

工程含义：先解释「为什么手写 render / 随意 JSX 不一定更快」——你丢掉了编译器写入的动态提示密度。热路径上先稳定 props、减少模板内临时对象与内联函数造成的子树更新扇出，再评估 `v-memo`。不要手写内部 PatchFlag 常量当公共 API，版本会变。

更新扇出口述抓手：父级每次新建对象 / 数组 / 函数传给子组件，子更难跳过；列表传同一个 `activeId` 会导致整表 prop 变化，父级先算每行 `isActive` 通常只动旧 / 新两行。用 Devtools 更新高亮找扩散源，用浏览器 Performance 区分「组件执行贵」还是「DOM / 布局贵」。过度拆单元格组件可能比一次简单渲染更贵——边界以职责和更新隔离为准。

### 5. keyed diff：身份契约与状态错位

同层新旧 vnode 用稳定且唯一的 `key` 表达身份。中间需要移动的序列，可用最长递增子序列减少**已匹配节点**的 DOM 移动；它不替业务数组排序，也不减少由匹配结果决定的创建 / 删除。

`key` 错误的典型后果：输入框值、焦点、子组件本地状态对到错误数据行——页面「看起来还能用」，但状态已错位。

实践：

- 优先业务 id；草稿用生命周期稳定的临时 id；
- 仅静态且永不重排的展示列表才审慎用 index；
- `Math.random()` 当 key = 每次卸载重建，性能与状态双杀；
- 强制换 key 只用于明确要重置子树（切换实体清空表单、重置无法增量更新的第三方组件）。

key 唯一性约束在**同一父节点的一组同级子节点**内；跨父同 key 不会跨容器复用实例。

列表优化口述顺序：数据量 → key 策略 → 组件拆分 / 虚拟列表 → 再谈 `v-memo` / `v-once`。`v-memo` 依赖漏写会显示旧 UI；多写则频繁失效。可与 `shallowRef` 大列表 + 不可变根替换组合：行用稳定 key，memo 依赖真正影响渲染的版本字段。

### 6. KeepAlive：缓存的是实例，不是 path 字符串

`keep-alive` 切走走 `deactivated`，回来走 `activated`，避免重复请求与滚动丢失（滚动位置仍常需自管）。用 `include` / `exclude` / 路由 `meta` 白名单，并用 `max` 控内存。

关键边界：

- 切走**不会**触发 `onUnmounted`；定时器 / 订阅若只在可见期需要，应挂 activated / deactivated；
- 缓存身份是组件类型 + vnode key，不是「路由 path」魔法；多路由复用同一页面组件时，要在 `RouterView` / 动态组件上给能区分实例的稳定 key（如路由名 + 实体 id），勿随机 key，也勿把无关 query 全拼进 key；
- 与 Pinia 分工：KeepAlive 保短期视图实例与本地状态（表单草稿、滚动上下文）；长期 / 跨入口 / 刷新恢复进 store；二者都不替代服务端缓存；
- key 变化会切换或创建新缓存项，但不会自动移除旧项，仍需 `max` 与产品过期策略。

内存与「过期数据」是两难：回来是否静默刷新，要产品策略。面试要能说出取舍，而不是只说「用了 keep-alive」。同一组件多路由复用时，缓存身份必须与期望保留的页面状态一致，无关 query 不要写进 key。

### 7. 异步组件与 Suspense

`defineAsyncComponent` 提供 loading / error / delay / timeout / `onError` 重试，适合页面内重块。路由懒加载是路由记录上的异步页面组件，通常不必再包一层 `defineAsyncComponent`。二者可叠加。

`<Suspense>` **目前仍是 experimental**：只有 `#default` / `#fallback`，**没有自身错误槽**。异步错误由父级 `onErrorCaptured`（或 Options `errorCaptured`）处理。

默认 `suspensible: true`：存在父级 Suspense 时，loading 由 Suspense 接管，组件自己的 `loadingComponent`、`errorComponent`、`delay`、`timeout` **会被忽略**。需要组件自治时显式 `suspensible: false`。不能同时期待两套 UI 生效，也不要设计不存在的 `#error` 槽。

重试：在 `onError(error, retry, fail, attempts)` 中分类——离线 / 瞬时网络可指数退避并限次；404、语法错误、版本不兼容立即 fail。发布后旧页面持有旧 chunk hash、CDN 立刻删旧资源会导致集中 404：应保留旧资产窗口 + 受控刷新一次，禁止无条件同步 retry 打成风暴。fallback 尽量复用最终内容尺寸与骨架，降低 CLS；嵌套 Suspense 要选稳定边界，防止多层占位依次抖动。

`async setup` / `<script setup>` 顶层 await 拒绝进入组件错误处理链；处于 Suspense 下时 Suspense 管等待，错误 UI 仍靠父级边界。可预期业务失败应转成明确状态，不全扔给全局 handler。与 React lazy + Suspense 对比时：都能异步加载并由边界显示等待 UI；Vue 的 `defineAsyncComponent` 另有超时 / 错误 / 重试，但被 Vue Suspense 接管后自治选项失效；两边都不能把等待态与错误态混为一谈。

### 8. SSR 水合：确定性优先于「消警告」

SSR 产出 HTML，客户端用同一棵 vnode 树粘上去叫 hydration。两边结构不一致会警告，甚至事件绑错节点——有时「只是警告」却已埋下交互错位。

高频原因（与题库一致）：

- 服务端没有、客户端有的分支（`window`、`localStorage`、时区、随机 id）；
- 非法 HTML 被浏览器改写（如 `p` 内塞块级）；
- 第三方只认浏览器的组件在 SSR 直接渲染；
- 文案 / i18n / 首屏数据两端源不同（Nuxt 里 setup 裸 `$fetch` 是典型）。

收敛：

- 浏览器 API 延后到 `onMounted` 或 `ClientOnly`（只包无法同构的小组件，不要整页包）；
- 每请求隔离 app / router / store；状态安全序列化（防 XSS，凭证留 HttpOnly Cookie）；
- 随机值传种子；关键块服务端拉齐数据；
- Vue 3.5+ 的 `data-allow-mismatch` 只用于不可避免局部差异，不是全局静音。

定位顺序：保存原始 SSR HTML → 看浏览器规范化后的 DOM → 对比客户端首棵 vnode → 再验证点击、输入、焦点与后续更新。水合「恢复成功」仍应修复：可能已丢弃服务端 DOM、重建子树，造成闪烁、长任务与事件绑错。把控制台 mismatch 当测试失败，而不是用 `ssr: false` 或整页 `ClientOnly` 刷掉。

序列化状态要防 XSS：不要把任意 JSON 直接拼进可执行 script；至少转义 `<`、`</script>` 等危险序列，并配合 CSP。只传公开且必要的首屏状态，凭证留 HttpOnly Cookie。Pinia 在 SSR 中必须按请求隔离，细节见题库 D4。

SEO 内容页看抓取与分享预览，SSR / SSG 收益明确；登录后强交互后台 SEO 弱，SSR 可能增加服务端成本与水合复杂度。按路由选策略，不靠全站一刀切。Nuxt 的 `routeRules`、payload、Nitro 细节链到 [Nuxt 专题](/interview/review/topics/06-nuxt-ssr) / [23-nuxt](/interview/questions/23-nuxt)。

### 9. 大表单 / 大表格：虚拟化 + 响应式降级

先区分四条链：数据规模、DOM 规模、更新频率、交互要求（题库 D14）。

大表单：状态按区块拆 composable / 子表单，避免单对象千字段 deep watch；校验防抖、失焦校验与提交总校验分层；能 `shallowRef` 整表替换时再触发；昂贵预览用 `computed` 缓存，别每个 keystroke 全量重算。

大表格：虚拟列表只保留可视窗口附近 DOM；固定行高简单，动态行高要测量缓存与锚点补偿（锚点上方高度变化要补偿 `scrollTop`）；列配置稳定，单元格组件轻量化；行数据用不可变更新或版本号；选择态、编辑态与源数据分离——源数据 `shallowRef`，编辑中的行按业务 id 建小型 draft，提交再合并；`key` 用业务 id。

验收：滚动稳定性、输入延迟、长任务、峰值内存；每个浅响应 / memo 优化都要有正确性回归与退出条件。开发 profile 不能直接当生产绝对值；收益用同一生产构建、设备与节流条件看分位数。Vue 特有抓手：缩小更新扇出、computed、虚拟化 + 正确 key、shallow / markRaw、异步拆包、点状 `v-memo`、稳定 props。排查顺序：Performance 分清 JS 还是布局 → Devtools 看谁在更新 → 再改数据契约。

## 工程取舍与故障案例模板

用同一模板讲故事，避免堆概念：

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 数据量 / 交互 / SEO / 内存 / 发布窗口等硬条件 |
| **方案** | 深响应 vs shallow、KeepAlive vs store、Suspense 边界、SSR vs ClientOnly |
| **取舍** | 牺牲了什么（调试成本、更新协议纪律、运维面） |
| **验证** | 渲染次数、INP / 长任务、mismatch 为零、焦点与草稿行为 |
| **复发防护** | lint / 约定、回归用例、容量上限、发布保留旧 chunk |

**案例骨架 A — 「改了列表某字段，偶发不刷新」**

- 约束：大列表必须可编辑，不能整表深代理。
- 方案：行数据 `shallowRef` + 不可变替换；或少数原地改后 `triggerRef`。
- 取舍：团队不能再随手 `row.x = 1`。
- 验证：单测覆盖「只改一行」；Devtools 看触发面。
- 防护：封装 `updateRow(id, patch)`，禁止业务直接 mutate。

**案例骨架 B — 「水合警告被当成噪音」**

- 约束：公开详情页要 SSR。
- 方案：去掉首屏 `Date.now()`；第三方播放器进 `ClientOnly`；首屏走 `useAsyncData`。
- 取舍：部分小组件首屏是占位。
- 验证：固定 HTML fixture + 水合后点击 / 输入。
- 防护：CI 将 mismatch 当失败；禁止整页 `ClientOnly`。

**案例骨架 C — 「KeepAlive 回来数据过期」**

- 约束：返回列表要保留滚动，但价格可能变。
- 方案：实例缓存 + `onActivated` 静默刷新策略（产品定）。
- 取舍：多一次请求 vs 展示旧价风险。
- 验证：弱网下激活次数、请求合并、滚动位置。
- 防护：`max` + include 白名单；过期策略写进路由 meta。

**案例骨架 D — 「发布后懒加载 chunk 404」**

- 约束：用户长时间停留旧页，新版本已上线并删除旧 hash 资源。
- 方案：CDN 保留旧资产窗口；加载失败受控刷新一次并保留草稿；区分离线与真实 404。
- 取舍：存储成本 vs 用户中断成本。
- 验证：旧 HTML 跨版本发布的端到端用例。
- 防护：版本化部署清单 + 禁止 `onError` 无条件同步 retry。

## 追问树

**主问：从改一个 `ref` 到屏幕变化，中间发生了什么？**

- L1：track / trigger 如何建立？条件分支漏收集怎么办？  
  - L2：同一 tick 多写为何常一次 patch？`flush: 'sync'` 代价？  
    - L3：`nextTick` 与 `flush: 'post'` 如何选？收口：用渲染计数与 DOM 断言，不背私有队列名。

**主问：列表输入框错位，你怎么查？**

- L1：key 是否稳定唯一？是否用了 index / random？  
  - L2：keyed diff / LIS 优化的是什么、不是什么？  
    - L3：强制换 key 的合法重置场景？收口：重排后测焦点、草稿、子组件本地状态。

**主问：异步页加载失败，Suspense 怎么讲？**

- L1：声明 experimental + 无错误槽。  
  - L2：接管后哪些 async 选项失效？`suspensible: false` 何时用？  
    - L3：chunk 404 与重试风暴如何防？收口：父级 `onErrorCaptured` + CDN 窗口 + 受控刷新。

**主问：SSR 水合失败你怎么定位？**

- L1：确定性来源清单（时间 / 随机 / HTML / 数据源）。  
  - L2：为什么「恢复成功」仍要修？  
    - L3：序列化 XSS 边界？收口：三方 DOM 对比 + 交互回归，不用全局静音。

**主问：大列表又卡又偶发不刷新，你怎么拆？**

- L1：先分数据规模 / DOM 规模 / 依赖面 / 布局四条链。  
  - L2：何时上虚拟列表？何时 `shallowRef`？编辑态如何与源数据隔离？  
    - L3：如何证明优化没换正确性？收口：生产分位数 + 回归矩阵 + 退出条件。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| ref / reactive / Proxy | [02-vue3 Q1](/interview/questions/02-vue3) |
| KeepAlive | [02-vue3 Q10](/interview/questions/02-vue3) |
| 异步组件与 Suspense | [02-vue3 Q11](/interview/questions/02-vue3)、[D8](/interview/questions/02-vue3) |
| key / memo | [02-vue3 Q14](/interview/questions/02-vue3)、[D1](/interview/questions/02-vue3) |
| SSR / hydration | [02-vue3 Q15](/interview/questions/02-vue3)、[D3](/interview/questions/02-vue3)；Nuxt：[23-nuxt Q9](/interview/questions/23-nuxt) |
| nextTick / flush | [02-vue3 Q21](/interview/questions/02-vue3)、[D12](/interview/questions/02-vue3) |
| shallow / markRaw | [02-vue3 Q22](/interview/questions/02-vue3)、[D6](/interview/questions/02-vue3) |
| track / trigger / 批处理 | [02-vue3 D11](/interview/questions/02-vue3) |
| 编译优化 | [02-vue3 D13](/interview/questions/02-vue3) |
| 大表虚拟化与降级 | [02-vue3 D14](/interview/questions/02-vue3) |
| 更新扇出与应用性能 | [02-vue3 Q34](/interview/questions/02-vue3)、[D7](/interview/questions/02-vue3)、[D10](/interview/questions/02-vue3) |
| Nuxt 侧水合 / 首屏数据 | [23-nuxt Q3](/interview/questions/23-nuxt)、[Q9](/interview/questions/23-nuxt) |

相关复习页：[框架与数据速记](/interview/review/sheets/02-framework-data)、[Nuxt SSR / 同构专题](/interview/review/topics/06-nuxt-ssr)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 能说出「读 track → 写 trigger → 调度 → patch →（可选）水合」主线，并声明不背私有 API 名。
2. **（2 分钟）ref / reactive / Proxy：** 选型、解构陷阱、模板拆包；能举一个 shallow / markRaw 场景。
3. **（2 分钟）调度与 flush：** 批处理直觉、`pre` / `post` / `sync`、`nextTick` vs `setTimeout(0)`。
4. **（2 分钟）编译与 patch：** 静态提升 / PatchFlags / Block Tree 各解决什么；为何手写 render 未必更快。
5. **（2 分钟）keyed diff：** 稳定 key、LIS 优化边界、状态错位诊断步骤。
6. **（2 分钟）KeepAlive + Suspense：** 激活钩子、缓存身份、Suspense experimental / 无错误槽 / 接管后选项失效。
7. **（2 分钟）SSR 水合：** 至少四个 mismatch 原因 + 三方对比定位 + 不用全局静音。
8. **（2 分钟）工程收口：** 用「约束 → 方案 → 取舍 → 验证 → 防护」讲一个自己的大列表或水合案例（数字用自己的）。

自检口令（必须能脱口而出）：

- 「Vite 生产是否一定是 Rollup？」→ **否；Vite 8 默认 Rolldown（本题可不展开，但口径不能说错）。**
- 「Suspense 有没有错误槽？」→ **没有；experimental；错误走父级 `onErrorCaptured`。**
- 「KeepAlive 切走会不会 `onUnmounted`？」→ **不会；走 deactivated。**
- 「水合警告能否忽略？」→ **不能；可能已绑错节点。**
