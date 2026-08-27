# Nuxt SSR / 同构

> **真源：** [23 Nuxt](/interview/questions/23-nuxt)（主）；水合确定性与 Vue 侧约束见 [02 Vue3](/interview/questions/02-vue3) Q15 / D3。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背「Nuxt 能 SSR」，而是证明你能把一次公开页首屏讲成完整链路：

**路由与约定 → 服务端同构渲染 → payload / Cookie 转发 → HTML + 缓存策略 → 客户端 hydration → 按路由混用 SSR / SSG / ISR。**

面试官想听四类能力：

1. **边界感：** 何时上 Nuxt、何时继续 Vue SPA + BFF；`app/` 与 `server/`、route middleware 与 server middleware。
2. **数据契约：** `useFetch` / `useAsyncData` 如何进 payload；为何 setup 裸 `$fetch` 会双请求与水合错位。
3. **渲染策略：** `routeRules` 按路由组合 SSR / CSR / SSG / SWR / ISR，而不是整仓一刀切。
4. **故障取证：** mismatch、串号缓存、Cookie 泄漏进 payload、流式 SSR 丢状态码——如何定位而不是关 SSR。

口述红线（与题库冲突即扣分）：

- 把 Nuxt 2 的 `store/` + webpack 当现行默认；
- 把 Nuxt 4.5 默认构建器说成 webpack / rspack；
- 把整站 `ssr: false` + `nuxt generate` 说成已经做了 SSG；
- 用整页 `ClientOnly` 或 `ssr: false` 刷掉水合警告；
- 把 `runtimeConfig.public` 当密钥保险箱；
- 把实验性流式 SSR 讲成全站默认性能开关。

默认口径：**Nuxt 4.5（2026-07）+ Vite 8 builder + Nitro**。Nuxt 3.x 于 2026-07-31 EOL，升级叙事要对齐 `app/` 目录与 Vite 8。

## 知识地图

```text
约定层                 渲染 / 数据层              运行时 / 交付              故障边界
app/ 源码 + 文件路由 → useFetch / AsyncData → Nitro server/api         hydration mismatch
layouts / middleware    payload 去重与 key        routeRules SSR/SSG/ISR   Cookie 转发 vs 泄漏
shared/ 同构契约        useHead / useSeoMeta      CDN + _payload 同失效    流式：状态码前置
runtimeConfig 公私界    ClientOnly 最小包围       modules / layers         错误页 / createError
```

主线口诀：

1. **框架卖的是渲染策略与约定，不是组件库**
2. **首屏数据进 payload，事件才裸 `$fetch`**
3. **渲染模式是路由属性，不是整仓开关**
4. **页面中间件管导航，API 必须独立鉴权**
5. **确定性优先于消警告；ClientOnly 只包不可同构的小组件**
6. **HTML 与 `_payload.json` 必须同版本失效**

## 完整讲解

### 1. Nuxt 与 Vue SPA：何时该上、何时不该上

Nuxt 4.5 默认不是「带目录的 Vue SPA」。它在 Vue 3 之上加上文件路由、layouts、中间件、data fetching 与 SEO 约定，并用 Nitro 提供 `server/api`、`routeRules` 和多平台部署。默认 **universal rendering**：首屏在服务端跑同一套 Vue 代码产出 HTML，客户端再 hydration 接管交互。构建器默认 **Vite 8**；webpack / rspack 只是显式 `builder` 选项，且 rspack 路径已改走 Rsbuild。服务端始终是 Nitro，不是「再挂一个 Express」。

**机制：** 一次公开页请求 → Nitro 命中路由 → 在隔离的 Vue app 实例上跑 setup / `useFetch` → 序列化 HTML + payload → 浏览器解析 HTML → hydration 粘事件 → 后续 `NuxtLink` 走客户端导航并优先吃 `_payload.json`。框架卖的是这条**渲染与交付策略**，不是组件库能力。

**失败形态：** 已有独立 BFF 仍为「统一技术栈」强上 Nitro，等于多养一套 Node/Edge、水合与缓存运维面；或反过来，公开详情/分享卡片仍用纯 SPA，爬虫与社交预览首跳看不到正文。

**验收：** 用 SEO / 首字节 / Cookie 鉴权 / 部署形态决策，不看口号。已有 BFF 时：营销页、详情、分享卡片用 Nuxt 做读模型；全站登录墙后且无预览需求，继续 SPA + BFF。对比句：Nuxt 与 Next 都卖渲染策略，本题默认 Nuxt 4.5 + Nitro，不把另一生态配置当答案。

运维面要提前算进总成本：Node/Edge 进程、payload 体积与失效集合、水合回归、串号缓存值班。公开页的 SSR/SSG 是产品能力（爬取与分享预览），不是框架炫耀；后台 CSR 是成本控制，不是技术退步。把 `routeRules` 变更当成会改缓存与爬虫行为的生产变更来评审，水合与串号问题才会少变成「上线后才发现」。 答辩时主动说清不做的事：不为统一技术栈强上 Nitro；不把 payload 当会话库；不用 `ssr: false` 当水合修复；不在不支持 ISR 的预设上宣称边缘命中。

### 2. Nuxt 4 目录：`app/`、`server/`、`shared/`

Nuxt 4 默认 `srcDir` 是 `app/`。页面、组件、composable、layout、路由中间件、Vue 插件、`app.vue`、`error.vue`、`app.config.ts` 都进 `app/`。根目录留下 `nuxt.config.ts`、`server/`、`public/`、`modules/`、`layers/`、`shared/`。`~` / `@` 默认指向 `app/`，`~~` / `@@` 指向项目根；把 `~/server` 当服务端目录会指错。

`server/` 是 Nitro：`api/`、`routes/`、`middleware/`、`plugins/`。`shared/utils` 与 `shared/types` 可在 Vue 与 Nitro 之间自动导入，适合 schema、错误码和纯函数，**不放** `window` / `fs` / 请求对象。校验放 `shared/` 是为了避免 `app/utils` 与 `server/utils` 各写一份漂移——SSR 通过、接口却拒绝时很难对账。

**失败形态：** 升级后 `~/components` 找不到（别名仍按 Nuxt 3 顶层心智）；通用插件顶层 `import` 浏览器 SDK 炸 SSR；`shared/` 偷偷依赖请求对象，一边打包失败。检测到旧顶层 `pages/` 可能兼容，但新项目不要再按 Nuxt 3 顶层结构讲默认。Nuxt 3.x 于 2026-07-31 EOL，升级叙事要对齐 `app/` 与 Vite 8。

**验收：** 画出「浏览器应用在 `app/`，HTTP 运行时在 `server/`，同构契约在 `shared/`」；类型检查能解析自动导入；SSR preview 不因浏览器 SDK 顶层导入崩溃。

升级仓若仍混用顶层与 `app/`：先搬目录再改业务；核对 `~`→`app/`、`~~`→根；看 `.nuxt` 组件类型指向的物理路径。lockfile 用 `nuxt upgrade --dedupe` 消幽灵 peer。把「目录/别名」放在改业务之前，否则排查会在业务与解析之间来回抖。

### 3. `useFetch` / `useAsyncData` / `$fetch` 与 payload

`useFetch(url)` 是 `useAsyncData` + `$fetch` 的常见封装：按 URL 生成 key，并把结果写入 Nuxt payload，hydration 时不再打同一请求。`useAsyncData` 适合自定义 handler、聚合、CMS SDK，或必须手写稳定 key 的场景。`$fetch` **没有**去重和 payload 转发。

**机制：** 服务端执行时把结果写入 payload；客户端 hydration 按同一 key 恢复，避免双请求。生产常把数据抽到 `_payload.json`，客户端导航优先吃它。因此「页面更新了」必须同时验：硬刷新、站内链接进入、ISR/SWR 命中后的二次导航。

setup 里直接 `$fetch` 会在服务端渲染打一次、客户端水合再打一次，既慢又容易两侧数据不同导致 mismatch。`$fetch` 留给点击 / 提交，或包进 `useAsyncData`。服务端内部请求走 `useRequestFetch` / `useFetch`，以便转发 Cookie（排除 `host`、`content-length` 等不安全头）。跨站 API 不能原样转发 Cookie，否则变开放代理。

不 `await useFetch` 和 `lazy: true` **不是一回事**：服务端无论是否 await，Nuxt 都会等请求结束再序列化 HTML；`lazy` 把请求推迟到挂载，客户端即使 await 也会立刻返回。Nuxt 4.5 可用响应式 `enabled` 卡住条件请求。

**失败形态：** key 漏路由参数串页；预览草稿复用正式 payload；access token / `useState('user')` 进公共 payload，首屏 HTML 泄露邮箱与角色；payload 体积塞满富文本拖垮 TTFB。

**验收：** DevTools Payload 面板无令牌与 PII；同 key 水合不再打网；草稿 key 带版本且禁公开缓存；`pick` / `transform` 后体积有门禁。对比：`useFetch` 绑定 Nuxt payload 生命周期；手写 Pinia 首屏要自己保证每请求隔离与序列化。

### 4. 按路由组合 SSR / CSR / SSG / SWR / ISR

默认 universal：服务器出完整 HTML，浏览器 hydration。全局 `ssr: false` 变 CSR，适合无索引后台；公开站不要一刀切。混合站点用 `routeRules`：首页 `prerender: true`；列表 `swr: 3600`（Nitro / 反代缓存并后台回源）；博客 `isr: 3600`（支持平台写入 CDN，当前主要 Netlify / Vercel）；`/admin/**` 设 `ssr: false`。

**机制与缓存边界：** `swr` 与 `isr` 都是 stale-while-revalidate，差别在缓存位置。公开营销页 / 文档：构建期 prerender 或长 TTL，CDN 命中后可不进 Nitro。价格、库存、个性化：短 SWR 或私有 SSR，缓存键必须能表达「这份响应能不能错发给另一个登录者」。登录后后台：`ssr: false` 或 `Cache-Control: private/no-store`。`isr: true` 往往活到下次部署——没有 webhook 时 CMS 改了正文线上可能一直旧。TTL 与按需 purge 并存：TTL 防漏网，标签删除保时效；冷门路径同时失效要 single-flight，否则发布事件变成对 CMS 的拒绝服务。

`nuxt generate` **没有**运行中的服务器，hybrid / ISR 不可用；需要 `server/api` 或按需再生用 `nuxt build`。整站 `ssr: false` 再 `generate` **不算** SSG：那是静态托管的 SPA 壳，正文仍等浏览器拉接口。SSG 是构建期把具体路由渲染成带数据的 HTML，并带上 `_payload.json`。

CDN 交付：能构建期确定的公开页 prerender，Node / Edge 只处理个性化与 API。只清 HTML 不清 payload，客户端导航仍可能吃旧列表。Edge 降低动态 RTT，**不能**等价替代 prerender。每个 `routeRules` 变更应附带：预期缓存位置、失效通道、是否影响爬虫完整 HTML、回滚方式。

**验收：** 硬刷新 + 站内导航 + ISR 命中后二次导航三处同更；个性化路由无公共 SWR；generate 产物 HTML 含正文而非空壳。

### 5. 两层 middleware、鉴权与 SEO head

`app/middleware` 是 Vue 路由中间件：首屏 SSR 与客户端 `NuxtLink` 导航都会跑，可 `navigateTo` / `abortNavigation`。`server/middleware` 是 Nitro / h3 HTTP 管线，覆盖页面、`/api` 与自定义 routes。只把登录校验放在 `app/middleware` **不够**保护 `server/api`——接口必须独立验 Cookie / Session。两层数据源要同一套，避免页面以为已登录、接口却 401。

**Cookie 双路径：** 首屏 SSR 靠 `useRequestFetch` 转发安全子集；客户端导航不再经 Node 时，浏览器自动带同源 Cookie，但 Path / SameSite 与相对 `/api` 仍要测通。两条路径都要验收。

`useSeoMeta` 管 title / description / og / twitter；`useHead` 管完整 head。Nuxt 4.5 head 跑在 unhead v3，类型收紧，promise 输入已移除。SEO 字段必须在 setup 或服务端可执行路径声明；`onMounted` 再改标题对爬虫几乎无效。canonical / hreflang / JSON-LD 同样要求服务端与客户端结构一致。

`runtimeConfig.private` 只在服务器；`public` 会进客户端 bundle 与 payload，用 `NUXT_PUBLIC_` 覆盖。密钥写进 `nuxt.config` 仍等于进 Git；审查标准是「浏览器能否读到」。

**验收：** 直打 `/api` 未登录返回正确状态码；首屏 HTML 已含目标 title/og；产物与 payload 扫不到私钥。

文件名 `.global` 的 route middleware 对所有导航生效，否则由 `definePageMeta` 或 `routeRules.appMiddleware` 声明。它拿得到路由与 Nuxt 上下文，不是每一条静态资源请求——别把「全站鉴权」误写进会拦 `_nuxt` 资产的 HTTP 中间件里导致白屏。

### 6. Hydration：Nuxt 侧高频原因与收敛

水合要求客户端首轮渲染与服务器 HTML 一致。Nuxt 高频原因：setup 用 `Date.now()` / `Math.random()` / 时区 / `window`；首屏裸 `$fetch`；`v-if` 依赖 `import.meta.client` 却写出不同结构；非法 HTML 被浏览器改写（如 `p` 内塞块级）；第三方只认浏览器的组件在 SSR 直接渲染。Vue 侧机制见 [05](/interview/review/topics/05-vue-reactivity) / [02 Vue3](/interview/questions/02-vue3)；本题强调 Nuxt 避免法。

**收敛：** 时间 / 随机 / 本地存储只放 `ClientOnly` 或 `onMounted`；首屏走 `useFetch` / `useAsyncData`；浏览器-only 库放 `.client` 插件。整页 `ClientOnly` **没有**解决问题，只是放弃服务端 HTML——对比 `ssr: false` 路由：前者局部放弃 HTML，后者是区间策略，适合整段后台。`data-allow-mismatch`（Vue 3.5+）只用于不可避免局部差异，不是全局静音。

**定位顺序：** 原始 SSR HTML → 浏览器规范化 DOM → 客户端首棵 vnode → 验证点击 / 输入 / 焦点。水合「恢复成功」仍要修：可能已丢弃服务端 DOM、重建子树，造成闪烁、长任务与事件绑错。每请求隔离 app / router / Pinia；只序列化公开必要状态，凭证留 HttpOnly Cookie；序列化至少转义危险序列并配合 CSP。

**验收：** CI 将 mismatch 当失败；禁止整页 `ClientOnly` 刷警告；固定 HTML fixture + 水合后交互回归。优化顺序：先保证确定性与正确状态码，再谈流式与缓存命中——错误的 200 半页或串号缓存，比慢 200ms 更伤信任。

### 7. Nitro、缓存串号与模块 / layers

页面 HTML 的缓存 / 重定向 / ISR / SWR 用 `routeRules`；接口用 `defineCachedEventHandler`，并显式设计 cache key。给 `/api/me` 套和首页一样的公共 `swr` 会把 A 的资料发给 B。个性化响应默认 `no-store`。取证先问「这份响应是否可公开」：可公开才谈 TTL / 标签；不可公开则私有 SSR 或 CSR，不要幻想「同一套 routeRules 更省事」。

模块用 `@nuxt/kit` 在构建期扩展；layer 通过 `extends` 继承应用切片。业务页面更适合 layer 覆盖，不要塞进模块。插件：`app/plugins` 属 Vue 应用（`.client` / `.server`）；`server/plugins` 是 Nitro 钩子，没有 Vue 实例。`runtime` 按环境切开；自动导入重名要前缀与 CI 快照，禁止静默抢占 `useUser`。面向 Nuxt 5 的发布模块应出编译后的 ESM + `.d.ts`，不能长期把 `node_modules` 里纯 TS 当入口。layer 覆盖看 `.nuxt` 生成类型指向的物理路径与 `extends` 顺序。

**验收：** 并发两会话看 HTML 源码与 `/api/me` 无串号；公开缓存 key 审查清单过 PR；模块自动导入快照稳定。

缓存串号取证口诀：先问响应是否可公开 → 再问 key 是否含用户/租户 → 再问 CDN / Nitro / 浏览器哪一层命中 → 最后用两会话并发对照 HTML 源码与 Set-Cookie。删缓存目录只能消症状，不能证明 key 设计正确。编辑预览通道必须走私有、不进 ISR；正式页与预览页不得共享同一 payload key。

### 8. 流式 SSR 与 Nuxt 3 → 4 升级风险

`experimental.ssrStreaming` 默认关闭。开启后先冲出 HTML 壳再流式 body，换 TTFB；但状态码、头、Cookie 必须在首字节前定案——首字节之后改 503 会静默失败。框架会为 `redirect` / `cache` / `isr` / `swr` / `ssr: false` 等自动回退缓冲渲染；登录 / 支付回跳显式 `streaming: false`。爬虫默认关流式。ISR / SWR 路由不能指望「流式 + 可缓存完整字节」叠在一起。全站开流式「一定更快」是错误表述：它是实验能力，用白名单内容页 + 双 UA（爬虫/普通）验收。

升级：默认 `app/`；`~` 指向应用目录；构建器默认 Vite 8；unhead v3；`npx nuxt upgrade --dedupe`。自定义 Vite 插件与钉死的旧 Vite 大版本是高风险点。不要同时开 `future.compatibilityVersion: 5` 叠目录迁移。遗留 `builder: 'webpack'` 必须标成兼容路径，迁移目标仍是 Vite 8——面试不可把 webpack 讲成 Nuxt 4 默认构建器。Rolldown / Oxc、插件钩子细节链到 [07](/interview/review/topics/07-vite-webpack)。

**验收：** 流式白名单无鉴权/写 Cookie 页；升级分支弃用警告与别名解析清零；SSR preview + 类型检查同提交通过。

流式与缓存叠加时的硬约束：需要完整可缓存字节的 ISR/SWR 页应回退缓冲渲染；需要写 Session Cookie 或按权限分支状态码的页关流式。开发警告里若出现「header mutation after streaming started」类信息，当作发布阻断而不是噪音。收益用分端 TTFB/LCP 验证，成本看 Node CPU 与水合后 INP——先正确，再谈快。

### 9. 文件路由、layouts、错误页与发布门禁

`app/pages` 生成路由：动态段、catch-all、可选段按文件约定。`definePageMeta` 声明 layout、middleware、alias、keepalive——这是**构建期静态元数据**，不能按 Cookie 动态改 layout；运行时鉴权应走 route middleware 或布局内分支。Nuxt 4.5 可用 `useLayout()` 只读当前布局，并支持 named views（`child@sidebar.vue`），但 `definePageMeta` 不能给每个 view 单独设渲染模式；与 `routeRules` 叠加时以更具体的规则为准。别手写整张 `vue-router` 表「更灵活」，会丢掉类型、预取与预渲染发现。

错误治理：服务端用 `createError({ statusCode, fatal })` 才能把真 404/401 写进响应；客户端 `showError` 只切 UI，已发出的 200 不会变。超时要有预算与熔断，服务端盲目重试会放大雪崩。错误页按 path 拉推荐时要注意预渲染 `404.html` 的 path 是占位符。Nuxt 4.5 稳定错误码（如 `NUXT_E1001`）用于定位「在 Nuxt 上下文外调 composable」，生产只留码、剥详细 why/fix。

发布与门禁（接到工程语言，不是另开「带团队清单」）：CI 含类型检查、一次 SSR preview、水合 fixture、payload 体积门禁；发布流水线同时刷新 HTML + `_payload.json` + 业务 cache 标签；回滚指针可切；值班能走 mismatch 三方对比与串号排查。预渲染路径禁止依赖「假定本地有监听中的 `/api`」——`nuxt dev` 能通不能当 `generate` 证据。

**验收：** 故意 404 响应真是 404；发布后列表/详情/payload 同版本；回滚演练可切指针。

与性能专题的接口：SSR 收益用分端 LCP/TTFB 与分享预览可用性验证；HTML 尽早暴露 LCP 图并校准 preload，与 head/payload 同版本失效一起做。后台 CSR 区间不要强行套公开页 ISR 话术。响应式、KeepAlive、Suspense 细节回 [05](/interview/review/topics/05-vue-reactivity)；本题只保证同构输入一致、每请求隔离、序列化安全。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | SEO / 首屏 / Cookie 鉴权 / CDN 能力 / 是否已有 BFF |
| **方案** | Nuxt vs SPA、routeRules、useFetch key、ClientOnly 边界 |
| **取舍** | 运维面、水合复杂度、缓存错发风险、流式实验边界 |
| **验证** | mismatch 为零、HTML+payload 同失效、登录态不进公开缓存 |
| **复发防护** | CI 水合 fixture、payload 体积门禁、webhook 失效集合 |

**案例 A — 「发布后列表不更新」**

- 约束：公开列表走 ISR / SWR，站内导航多。
- 方案：发布时 HTML、`_payload.json`、业务 cache key 一并失效；webhook 只 purge 相关路径。
- 取舍：失效集合变大 vs 编辑「有的页坏了」。
- 验证：硬刷新 + 站内点进详情 + 列表卡片三处同更。
- 防护：失效清单写进发布流水线；禁止只 purge HTML。

**案例 B — 「水合警告被当成噪音」**

- 约束：商品详情要可爬取。
- 方案：去掉首屏 `Date.now()`；播放器进 `ClientOnly`；首屏 `useAsyncData`。
- 取舍：小组件首屏占位。
- 验证：固定 HTML fixture + 水合后点击 / 输入。
- 防护：mismatch 当 CI 失败；禁止整页 `ClientOnly`。

**案例 C — 「SSR 登录态偶发串用户」**

- 约束：首屏要出「你好，某某」。
- 方案：httpOnly Cookie + `useRequestFetch`；用户对象不进公共 payload；`/api/me` 禁止公开 SWR。
- 取舍：多一次私有请求 vs 串号风险。
- 验证：并发两会话看 HTML 源码与 Network。
- 防护：DevTools Payload 面板扫敏感字段；缓存 key 审查清单。

**案例 D — 「流式开了以后 404 变 200」**

- 约束：长文档要降 TTFB。
- 方案：仅内容型路由开流式；鉴权 / 写 Cookie / 缓存页 `streaming: false`；决定状态码的数据在首字节前完成。
- 取舍：部分页 TTFB 优势让出。
- 验证：爬虫 UA 与普通 UA 对照；开发警告无丢弃的 header mutation。
- 防护：流式白名单 + 状态码监控（别只看 200 率）。

**案例 E — 「预渲染构建期相对 `/api` 全挂」**

- 约束：文档站想 `nuxt generate` 全静态。
- 方案：预渲染数据改外部 CMS 或构建期可访问源；需要自有接口则改 `nuxt build` 保留 Nitro；本地 `nuxt dev` 能通不能当 generate 证据。
- 取舍：全静态运维简单 vs 放弃运行时 API。
- 验证：CI 跑 generate 日志与产物 HTML 是否含正文。
- 防护：预渲染路径禁止依赖「假定本地有监听中的 `/api`」。

**案例 F — 「升级 4.5 后 `~/components` 找不到」**

- 约束：仓库仍混用顶层与 `app/`。
- 方案：先搬目录再改业务；核对 `~`→`app/`、`~~`→根；看 `.nuxt` 组件类型指向。
- 取舍：短暂停功能换解析正确。
- 验证：类型检查 + SSR 预览点别名与自动导入。
- 防护：升级清单把别名/目录放在改业务之前；lockfile dedupe。

证据坑位（填你的数）：公开详情 LCP p75〔填〕；mismatch 周发生率〔填〕；payload 最大 key 体积〔填〕；CDN 命中率〔填〕；发布后「列表旧、详情新」次数〔填〕；SSR CPU 水位〔填〕；Nuxt 3→4 耗时〔填〕。

## 追问树

**主问：Nuxt 和 Vue SPA 本质差在哪？什么时候不该上？**

- L1：universal + Nitro + 约定，不是组件库。  
  - L2：已有 BFF 时如何拆读模型 / 写模型？  
    - L3：运维面与水合成本如何量化？收口：用 SEO / 首屏 / Cookie 边界决策，不堆「全栈」。

**主问：`useFetch` 和 setup 里 `$fetch` 差在哪？**

- L1：payload / key 去重。  
  - L2：不 await 与 `lazy` 是否等价？  
    - L3：预览草稿为何不能复用正式 payload？收口：稳定业务 key + DevTools Payload。

**主问：如何按路由混用渲染模式？**

- L1：`routeRules` 例子（prerender / swr / isr / ssr:false）。  
  - L2：`generate` 为何没有 hybrid？整站 CSR+generate 算不算 SSG？  
    - L3：只清 HTML 为何列表仍旧？收口：HTML+payload 同失效。

**主问：水合失败怎么定位？**

- L1：时间 / 随机 / `$fetch` / 非法 HTML。  
  - L2：整页 ClientOnly 算不算修好？  
    - L3：序列化 XSS 与 Pinia 每请求隔离？收口：三方 DOM 对比 + 交互回归。

**主问：流式 SSR 能不能全站开？**

- L1：实验能力，默认关。  
  - L2：为何 ISR/SWR 要回退缓冲？首字节后还能改 503 吗？  
    - L3：如何验爬虫拿到完整 HTML？收口：白名单内容页 + 双 UA 验收。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| Nuxt vs SPA / 目录约定 | [23-nuxt Q1](/interview/questions/23-nuxt)、[Q2](/interview/questions/23-nuxt) |
| useFetch / payload | [23-nuxt Q3](/interview/questions/23-nuxt)、[D1](/interview/questions/23-nuxt) |
| routeRules / SSG / ISR | [23-nuxt Q4](/interview/questions/23-nuxt)、[D3](/interview/questions/23-nuxt)、[D5](/interview/questions/23-nuxt) |
| middleware 两层 | [23-nuxt Q5](/interview/questions/23-nuxt) |
| SEO head / runtimeConfig | [23-nuxt Q6](/interview/questions/23-nuxt)、[Q7](/interview/questions/23-nuxt) |
| Nitro 缓存 | [23-nuxt Q8](/interview/questions/23-nuxt) |
| hydration | [23-nuxt Q9](/interview/questions/23-nuxt)；Vue：[02-vue3 Q15](/interview/questions/02-vue3)、[D3](/interview/questions/02-vue3) |
| Cookie 转发 | [23-nuxt D4](/interview/questions/23-nuxt) |
| 流式 SSR | [23-nuxt D7](/interview/questions/23-nuxt) |
| 3→4 升级 / Vite 8 | [23-nuxt D8](/interview/questions/23-nuxt)；[24-vite](/interview/questions/24-vite) |
| 错误治理 | [23-nuxt D2](/interview/questions/23-nuxt) |

相关复习页：[框架与数据速记](/interview/review/sheets/02-framework-data)、[Vue3 响应式专题](/interview/review/topics/05-vue-reactivity)（水合节）、[Vite / Webpack 专题](/interview/review/topics/07-vite-webpack)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 渲染策略 + 约定 + Nitro；默认 Nuxt 4.5 / Vite 8 / Nitro。
2. **（2 分钟）目录与边界：** `app/` vs `server/` vs `shared/`；别名 `~` / `~~`。
3. **（2 分钟）数据获取：** useFetch / AsyncData / `$fetch`；payload key；lazy ≠ 漏 await。
4. **（2 分钟）routeRules：** 至少四种模式组合；generate 无 hybrid；CSR+generate ≠ SSG。
5. **（2 分钟）鉴权与配置：** 两层 middleware；public/private；Cookie 转发与 payload 禁令牌。
6. **（2 分钟）水合：** 四个原因 + ClientOnly 最小包围 + 三方对比定位。
7. **（2 分钟）交付与缓存：** HTML+payload 同失效；`/api/me` 不能公共 SWR；ISR webhook。
8. **（2 分钟）工程收口：** 「约束 → 方案 → 取舍 → 验证 → 防护」讲一个自己的 SSR / 缓存事故（数字用〔填〕）。

自检口令：

- 「Nuxt 4.5 默认构建器是谁？」→ **Vite 8；webpack/rspack 可选。**
- 「setup 裸 `$fetch` 行不行？」→ **不行；双请求 + 易 mismatch。**
- 「整站 `ssr:false` + generate 算 SSG 吗？」→ **不算；是 SPA 壳。**
- 「流式开了还能改 503 吗？」→ **首字节后通常不能；关键路由关流式。**
- 「HTML 与 payload 能否只清一边？」→ **不能；必须同版本失效，否则站内导航吃旧列表。**
- 「页面 middleware 够不够护 API？」→ **不够；`server/api` 必须独立鉴权。**
