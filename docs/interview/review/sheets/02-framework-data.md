# 框架与数据速记

> **真源：** [02 Vue3](/interview/questions/02-vue3)、[23 Nuxt](/interview/questions/23-nuxt)、[24 Vite](/interview/questions/24-vite)、[25 Webpack](/interview/questions/25-webpack) 为唯一真源；冲突时以题库为准。
>
> **用法：** 面试前遮住口述稿先自讲，再对结论卡与追问速答。证据坑位请填入你自己的项目指标，勿背他人数字。

## 一句话定位

本域讲清「Vue 3 响应式与更新边界 + Nuxt 渲染策略与水合 + Vite 8 / Rolldown 口径 + Webpack 5 何时还该留」。资深前端面试要的是**选型证据、失败模式与验收方式**，不是 API 清单背诵。你应能在五分钟内把四条主线串成一条交付故事：状态怎么更新、页面怎么缓存与异步拆分、首屏 HTML 怎么与客户端对齐、构建器在当前仓库为何这样选。

## 核心结论卡

1. **结论：** `ref` 适合基本类型与「整个值要被替换」的引用；`reactive` 适合一组共同演进、很少整表替换的字段。  
   **边界：** `reactive` 解构丢响应；跨 composable 优先 `ref` / `toRefs`；TS 下 `ref` 推断通常更稳。  
   **证据坑位：** 〔填〕组件局部状态选型约定与一次解构事故复盘。

2. **结论：** Proxy 读时 track、写时 trigger；相对 Vue 2 能监听增删、数组索引、`Map` / `Set`，嵌套对象惰性代理。  
   **边界：** **没读到的属性不建依赖**；条件分支漏收集与 `JSON.stringify` 式过度收集都是实战坑。  
   **证据坑位：** 〔填〕用 Devtools / `onTrack` 定位过的一次「改了不刷」根因。

3. **结论：** 同一 tick 多次同步写入，组件更新 job 常去重为一次 patch；`nextTick` 等的是 Vue 更新队列刷完。  
   **边界：** `flush: 'sync'` 不吃常规批处理；`setTimeout(0)` 不保证刚好在 patch 后；不同 watcher 不会自动合并成一个。  
   **证据坑位：** 〔填〕改数据后读布局用 `nextTick` / `flush: 'post'` 的验收用例。

4. **结论：** `shallowRef` / `shallowReactive` / `markRaw` 是大对象、图表 option、第三方实例的响应式降级手段。  
   **边界：** 原地 mutate 默认不刷新，除非 `triggerRef` 或整值替换；团队必须统一更新协议，否则静默错误。  
   **证据坑位：** 〔填〕大列表 / 图表 option 用浅响应前后的更新耗时与正确性回归。

5. **结论：** `keep-alive` 缓存的是组件**实例**；切走走 `deactivated`、回来走 `activated`，避免重复请求与滚动丢失（滚动常仍需自管）。  
   **边界：** 切走不触发 `onUnmounted`；用 `include` / `max` / 路由 meta；key 决定缓存身份，勿全局无脑缓存所有页面。  
   **证据坑位：** 〔填〕列表 ↔ 详情返回保留滚动 / 草稿的策略与内存上限。

6. **结论：** `defineAsyncComponent` 管组件级懒加载（可配 loading / error / delay / timeout / 重试）；路由懒加载管页面 chunk；二者可叠加。  
   **边界：** `<Suspense>` **仍是 experimental，无错误槽**；默认 `suspensible: true` 时父级接管后，组件自身 loading / error / delay / timeout **失效**；需自治则 `suspensible: false`。  
   **证据坑位：** 〔填〕异步块 loading / 错误边界与发布后 chunk 404 处理窗口。

7. **结论：** SSR 水合要求服务端 HTML 与客户端首轮 vnode **结构确定一致**；不一致可能只是警告，却已绑错节点。  
   **边界：** `window` / 随机 / 时区 / 非法嵌套 / 两端数据源分裂都会 mismatch；Vue 3.5+ `data-allow-mismatch` 只用于不可避免局部差异，不是全局静音。  
   **证据坑位：** 〔填〕一次水合告警的三方对比（SSR HTML / 规范化 DOM / 客户端 vnode）。

8. **结论：** Nuxt 4.5 默认 universal rendering + Nitro + **Vite 8** builder，卖的是渲染策略与约定，不是「带目录的 Vue SPA」。  
   **边界：** 登录后重度交互、几乎无索引、已有独立 BFF 时可不该上 Nuxt；webpack / rspack 仅可选；服务端始终是 Nitro。  
   **证据坑位：** 〔填〕选型表：SEO / Cookie / 部署形态 / 运维面。

9. **结论：** 渲染模式是**路由属性**：`routeRules` 可按路径混用 SSR / CSR / SSG（`prerender`）/ SWR / ISR。  
   **边界：** 整站 `ssr: false` + `nuxt generate` ≠ SSG（只是 SPA 壳）；无运行中服务器则 hybrid / ISR 不可用；`swr` 与 `isr` 差别主要在缓存位置。  
   **证据坑位：** 〔填〕公开页 / 后台路径的 `routeRules` 与爬虫首跳可见性验证。

10. **结论：** 首屏数据用 `useFetch` / `useAsyncData` 写入 payload 并去重；setup 里直接 `$fetch` 会服务端 + 客户端各打一次，还易水合不一致。  
    **边界：** payload 去重 ≠ 永不允许客户端重拉；鉴权 Cookie 与私密字段不得泄漏进客户端 payload；`lazy` 与「漏写 await」语义不同。  
    **证据坑位：** 〔填〕首屏 payload 字段清单与一次误序列化事故。

11. **结论：** Vite **2–7** 默认 esbuild 做依赖预构建与 TS / JSX 转译、**Rollup** 做生产构建；Vite **8** 默认 **Rolldown + Oxc**。  
    **边界：** **不要说「生产一定是 Rollup」**；Vite 7 的 `rolldown-vite` 只是可选预览，不是 Vite 8 默认口径。  
    **证据坑位：** 〔填〕当前主版本号、构建日志中的 bundler 身份与弃用警告清零清单。

12. **结论：** Vite 8 长期配置入口迁到 `optimizeDeps.rolldownOptions`、`oxc`、`build.rolldownOptions` / `worker.rolldownOptions`；分包只讲 `output.codeSplitting`。  
    **边界：** 兼容层能改写旧 `esbuild` / `rollupOptions` / 部分 `manualChunks` ≠ 应长期混写两代入口；对象形式 `manualChunks` 应删除。  
    **证据坑位：** 〔填〕升级前后同一 SHA 的产物清单与 preview 烟测。

13. **结论：** 即便 Vite 8 统一 bundler，开发（原生 ESM + 按需转译 + 预构建）与生产（整图打包 / tree-shake / 压缩 / `apply: 'build'` 插件）仍是两条消费路径。  
    **边界：** 「开发过、生产挂」仍可能来自条件导出、仅构建期插件、SSR `external` / `noExternal` 差异。  
    **证据坑位：** 〔填〕dev / build / preview 三路径对照失败模块解析记录。

14. **结论：** Webpack 5 编译图：loader 只变换**单个模块**（配置数组右→左），plugin 经 Tapable 改图 / chunk / 资源；资源模块替代常见 url/file-loader。  
    **边界：** `mode: 'production'` 才代表可发布产物；dev server 内存产物不能当体积 / 哈希证据；ESM 摇树要副作用信息可信。  
    **证据坑位：** 〔填〕同一 CI 生产命令的 manifest / 体积基线。

15. **结论：** 新项目无 Webpack 专有插件或联邦硬约束时**优先 Vite**；存量先问痛点是冷启动、HMR 还是 CI，再选留下 / Rspack / 迁 Vite。  
    **边界：** **Rspack** 走 Webpack 兼容换速度；**Rolldown** 走 Vite 管线，**不接受**一份 Webpack 配置当输入；两条路不要混谈。  
    **证据坑位：** 〔填〕冷启动 / HMR / CI 分钟数 / 插件锁定对照表。

16. **结论：** Webpack 5 **内置** Module Federation 与独立 **MF 2.0** 必须分开讲；本域只谈打包选型，运行时 `shared` 协商见微前端题库。  
    **边界：** 不为简历迁栈；无产物对照、运行时烟测与回滚方案的大爆炸迁移风险高于收益；Webpack 4 应先升到干净的 5 再换引擎。  
    **证据坑位：** 〔填〕联邦版本口径与一次可回滚入口迁移记录。

17. **结论：** Vue 更新扇出治理优先「稳定 props / 收窄依赖」，再谈 `v-memo`；模板热路径少造临时对象与内联函数。  
    **边界：** 过度拆单元格组件可能更贵；`v-memo` 漏依赖会显示旧 UI；模块全局缓存对象会跨实例污染。  
    **证据坑位：** 〔填〕Devtools 更新高亮定位到的一次列表扇出治理前后对比。

18. **结论：** Vite `server.proxy` 只服务开发期同源转发，不写入生产静态资源；生产需网关 / BFF 对齐路由、Cookie 域与 TLS。  
    **边界：** 开发代理通 ≠ 预发 Cookie 不丢；客户端入口应用相对 `/api` 或运行时 origin，勿写死 `localhost`。  
    **证据坑位：** 〔填〕预发 Set-Cookie 与文档域名对照记录。

## 高频追问速答

1. **为什么 `reactive` 解构会丢响应？**  
   依赖追踪发生在 Proxy 属性访问上，`const { count } = state` 只把当时裸值赋给局部变量，后续读写不再经过代理。`toRefs` 可为调用时已有的可枚举属性创建相连 ref，解构后仍能追踪和写回；但它不恢复普通副本，也不覆盖事后新增属性，更不能用来写回只读 props。跨 composable 更稳妥的是直接传 `ref` 或单个 `toRef`。

2. **`nextTick` 和 `setTimeout(0)` 差在哪？**  
   `nextTick` 语义是「Vue 刷完本轮更新队列之后」，通常挂微任务；`setTimeout(0)` 是更靠后的宏任务，会与浏览器渲染及其他宏任务交错，不保证刚好在 patch 后第一时间执行。读 `scrollHeight`、聚焦输入框应优先 `nextTick` 或 `flush: 'post'`。默认 `pre` watcher 里直接读所属组件 DOM 常仍是旧值，别用定时器碰运气。

3. **KeepAlive 里定时器挂哪？**  
   仅页面可见时运行的轮询，应在 `onActivated` 启动、`onDeactivated` 停止，并防止重复激活叠加多个定时器。`onMounted` 对缓存实例通常只执行一次，挂在那里会在切走后继续轮询改状态。最终 `onUnmounted` 再清一次作兜底；必须后台持续的应用级任务应交给有明确 owner 的 store 或 service，而不是页面组件。

4. **Suspense 接管后为什么看不到 `errorComponent`？**  
   先声明 `<Suspense>` 仍是 experimental，且没有自身 `#error` 槽。默认 `suspensible: true` 时，只要存在父级 Suspense，就会接管该异步组件的 loading 态，于是组件自己配置的 `loadingComponent`、`errorComponent`、`delay`、`timeout` 都会被忽略。错误展示必须靠父级 `onErrorCaptured`（或 Options 的 `errorCaptured`）收口；若要坚持组件自治 loading / error，就显式设 `suspensible: false`，绝不能同时期待两套等待与错误 UI 一起生效。

5. **Nuxt 里整站 `ssr: false` 再 `generate` 算 SSG 吗？**  
   不算。那是静态托管的 SPA 壳：往往只剩壳 HTML，正文仍等浏览器拉接口，爬虫首跳看不到内容。真正的 SSG 是构建期把具体路由渲染成带数据的 HTML，并带上 `_payload.json`。没有运行中的服务器也就没有 ISR / SWR；需要按需再生或 `server/api` 时应走 `nuxt build`，并用 `routeRules` 给目标路径设 `prerender` 等策略。

6. **Vite 8 升级后构建能过，算迁移完成吗？**  
   不算。Vite 8 默认已是 Rolldown + Oxc，但兼容层仍可能把旧的 `esbuild`、`rollupOptions` 和部分 `manualChunks` 改写过去，所以「能构建」只说明没立刻炸。真正完成迁移要看：长期配置已迁到 `optimizeDeps.rolldownOptions` / `oxc` / `build.rolldownOptions`、弃用警告清零、对象形式 `manualChunks` 已删除，并且用同一 git 提交完整回归开发态、生产构建、SSR、Worker 与 preview。

7. **什么时候还必须用 Webpack（或先别迁 Vite）？**  
   存量仓库若有大量 Webpack 专有 loader / plugin、联邦协议硬锁定，或短期不能换开发模型，可先留干净的 Webpack 5；若主要痛点是构建速度且要保留配置心智，再评估 Rspack。新应用没有这些约束应优先 Vite。用冷启动、HMR、CI 分钟数和插件锁定对照表决策，不为简历迁栈，也避免无回滚的大爆炸重写。

8. **Rspack 和 Rolldown 怎么一句分清？**  
   Rspack 瞄准 Webpack 兼容：尽量吃现有 `webpack.config`、loader 链与团队对模块图 / `splitChunks` 的心智，用 Rust 换构建时间，适合「还要 Webpack API、但受不了 JS 打包器速度」的仓库。Rolldown 瞄准 Rollup 兼容，是 Vite 8 默认统一 bundler 方向，进入的是 Vite / Rolldown 插件接口与 `output.codeSplitting`，不接受一份 Webpack 配置当输入。要留 Webpack API 就评 Rspack；要换开发模型就评 Vite 8，两条路径不要混谈。

9. **为什么 setup 里不能直接 `$fetch` 首屏数据？**  
   `$fetch` 没有 Nuxt 的 payload 去重与转发：服务端渲染会打一次，客户端水合往往再打一次，既慢又容易两侧数据不一致导致 hydration mismatch。首屏应走 `useFetch` / `useAsyncData`；点击、提交等事件里的交互请求才直接 `$fetch`。服务端内部请求要用框架封装转发 Cookie，并排除 `host` 等不安全头。

10. **水合「恢复成功」为什么还要修？**  
    恢复只代表 Vue 尝试把页面带回可运行状态，不代表首次内容、节点身份和交互无损；可能丢弃服务端 DOM、重建子树，造成闪烁、焦点丢失甚至事件绑错节点。生产不能只屏蔽警告，应复现 SSR HTML、浏览器规范化 DOM 与客户端首棵 vnode 的差异，并做点击与输入回归。

## 反例 / 红线

- 把 Vite 8 说成「生产一定是 Rollup」；或把 Vite 7 `rolldown-vite` 当成默认生产口径。
- 声称 Suspense 已有正式 `#error` 槽，或接管后仍期待 `loadingComponent` / `errorComponent` 同时生效。
- 全局无脑 `keep-alive`、用随机 `key`「强制刷新」、用 index 掩盖可排序 / 可插入列表身份。
- 首屏模板直接读 `Date.now()` / `Math.random()` / `localStorage`；用整页 `ClientOnly` 或关 SSR「消」mismatch。
- 把 CSR + 静态托管口头包装成「已经做了 SSG」。
- 把 `server.proxy` 或开发 Cookie 行为当成生产网关已对齐。
- 给业务包一刀切 `sideEffects: false` 导致样式丢失；用 dev server 体积当发布证据。
- 无产物对照、烟测与回滚的「整仓一次迁完」；Webpack 与 Rspack 共用同一缓存目录。

## 必链题库

| 主题 | 题库入口 |
| --- | --- |
| Vue 响应式选型 / 调度 / 编译更新 | [02-vue3](/interview/questions/02-vue3) Q1、Q21、Q22；D11、D12、D13 |
| KeepAlive / Suspense / 列表 key / 扇出 | [02-vue3](/interview/questions/02-vue3) Q10、Q11、Q14、Q34；D1、D7、D8 |
| SSR 水合与确定性 | [02-vue3](/interview/questions/02-vue3) Q15、D3；[23-nuxt](/interview/questions/23-nuxt) Q9 |
| Nuxt 渲染模式与数据获取 | [23-nuxt](/interview/questions/23-nuxt) Q1、Q3、Q4、Q5；D1 |
| Vite 8 / Rolldown / Oxc | [24-vite](/interview/questions/24-vite) 文首口径、Q1、Q7、Q11、Q12；D5 |
| Webpack 5 与选型边界 | [25-webpack](/interview/questions/25-webpack) Q1、Q4、Q6、Q10、Q11；D7 |

专题深挖：[Vue3 响应式与渲染](/interview/review/topics/05-vue-reactivity)、[Nuxt SSR / 同构](/interview/review/topics/06-nuxt-ssr)、[Vite 与 Webpack 构建器](/interview/review/topics/07-vite-webpack)。

## 5 分钟口述稿

「我先报版本口径：Vue 3 响应式是 Proxy + 调度批处理；Nuxt 4.5 默认 universal rendering + Nitro + Vite 8 builder；构建器上 Vite 2 到 7 才是 esbuild 预构建加 Rollup 生产，**Vite 8 默认 Rolldown + Oxc，不能再说生产一定是 Rollup**；Webpack 5 仍是存量与联邦场景的选项，和独立 MF 2.0 要分开讲。

响应式我讲三条边界：第一，`ref` 与 `reactive` 怎么选，解构为什么丢响应；第二，没读到的属性不建依赖，条件分支会漏收集；第三，大对象用 `shallowRef` / `markRaw` 时，团队必须统一『根替换或显式 trigger』协议。更新侧强调同一 tick 批处理、`nextTick` 语义，以及 `watch` 的 pre / post / sync——默认 pre 里读自身 DOM 往往还是旧的。

组件层：KeepAlive 缓存的是实例不是 path，要白名单和 `max`，定时器挂 activated 生命周期；异步块用 `defineAsyncComponent`，路由懒加载管页面 chunk。Suspense 我先声明仍是 experimental、没有错误槽，默认接管后组件自己的 loading / error 选项会失效，错误走父级 `onErrorCaptured`。SSR 水合的核心是确定性——时间、随机、非法 HTML、两端数据源都是高频 mismatch；只对不可避免局部用 allow-mismatch，不当全局静音，也不能用整页 ClientOnly 假装解决了。

Nuxt 我强调框架卖的是渲染策略：渲染模式是路由属性，`routeRules` 混用 SSR / SSG / SWR / ISR，后台区间可 `ssr: false`；首屏数据走 `useAsyncData` / `useFetch`，别在 setup 里裸 `$fetch`。Vite 升级要看配置是否迁到 `rolldownOptions` / `oxc`，兼容层能跑不等于迁移完成，还要用同一 SHA 跑 preview。Webpack 侧新项目优先 Vite；痛点是速度且要留配置就评 Rspack；Rolldown 不吃 Webpack 配置。最后用自己项目的冷启动、CI 分钟数、水合告警归零和产物对照收口，不为简历迁栈。」
