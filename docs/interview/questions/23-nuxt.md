# Nuxt 面试题库

> **怎么用：** 普通题按「约定 → 渲染边界 → 数据与 SEO → 运行时配置」口述 1～2 分钟；深层题按「payload / 缓存 / 鉴权 / 升级风险」展开。默认口径是 Nuxt 4.5（2026-07）+ Vite 8 builder + Nitro，不要把 Nuxt 2 或 webpack-only 当默认。Vue 响应式与组件细节见 [02 Vue3](/interview/questions/02-vue3)，Vite 底层见 [24 Vite](/interview/questions/24-vite)，CI / 发布见 [03 工程化](/interview/questions/03-engineering)。

---

## 一、约定、渲染与数据获取

### Q1. Nuxt 和 Vue SPA 的本质差异是什么？什么时候不该上 Nuxt？

**考察点：** universal rendering、Nitro、约定式全栈边界、选型约束

::: details 参考答案

Nuxt 4.5 默认不是「带目录的 Vue SPA」。它在 Vue 3 之上加上文件路由、layouts、中间件、data fetching 与 SEO 约定，并用 Nitro 提供 `server/api`、`routeRules` 和多平台部署。默认 universal rendering：首屏在服务端跑同一套 Vue 代码产出 HTML，客户端再 hydration 接管交互。构建器默认 Vite 8，webpack / rspack 只是可选；服务端始终是 Nitro，不是「再挂一个 Express」。

Vue SPA 把渲染和路由都放在浏览器，适合登录后的重度交互、几乎没有公开索引需求、接口已由独立 BFF 覆盖的系统。这时 Nuxt 的 Node / Edge 进程、payload 和水合约束会变成额外运维面。反过来，只要首屏要可爬取、要按路由混用 SSR / SSG / ISR，或希望同一仓库放服务端路由，Nuxt 才是默认选项。

口述别停在「Nuxt 能 SSR」。要说清：**框架卖的是渲染策略和约定，不是组件库。** 选型看 SEO、首字节、Cookie 鉴权和部署形态，不看「全栈听起来更高级」。Vue 组件与响应式怎么写，仍回到 [02 Vue3](/interview/questions/02-vue3)；打包器细节回到 [24 Vite](/interview/questions/24-vite)。

:::

**追问：** 已经有独立 BFF 时，还值得为 SEO 单独上 Nuxt 吗？

::: details 追问参考答案

值得与否看公开页是否必须服务端出 HTML。若营销页、商品详情和分享卡片依赖爬虫首跳可见，用 Nuxt 做读模型渲染、BFF 继续管写模型和鉴权，比把 SPA 硬塞预渲染更干净。若全站都在登录墙后且分享无预览需求，继续 Vue SPA + BFF 即可，不必为「统一技术栈」再养一套 Nitro。判断标准是首屏索引与 Cookie 边界，不是仓库里能不能写 `server/api`。

:::

---

### Q2. Nuxt 4 默认目录约定是什么？`app/` 里放什么、根目录留什么？

**考察点：** `app/` 为 `srcDir`、别名、`shared/`、与 Nuxt 3 顶层目录的差异

::: details 参考答案

Nuxt 4 默认 `srcDir` 是 `app/`。页面、组件、composable、layout、路由中间件、Vue 插件、`app.vue`、`error.vue`、`app.config.ts` 都进 `app/`。根目录留下 `nuxt.config.ts`、`server/`、`public/`、`modules/`、`layers/`、`shared/` 和内容源。`~` / `@` 默认指向 `app/`，`~~` / `@@` 指向项目根；把 `~/server` 当服务端目录会指错。

`server/` 是 Nitro：`api/`、`routes/`、`middleware/`、`plugins/`。`shared/utils` 与 `shared/types` 可在 Vue 应用和 Nitro 之间自动导入，适合校验函数和 DTO，不放 Node-only 或浏览器-only 代码。Nuxt 若检测到旧的顶层 `pages/` 会兼容，但新项目不要再按 Nuxt 3 顶层结构讲默认。

口述要能画出「浏览器应用在 `app/`，HTTP 运行时在 `server/`，同构契约在 `shared/`」。别把 Nuxt 2 的 `store/` + webpack 默认当答案；Nuxt 3.x 已接近 2026-07-31 EOL。

:::

**追问：** 为什么校验函数放 `shared/`，而不是 `app/utils` 或 `server/utils`？

::: details 追问参考答案

`app/utils` 的自动导入默认面向 Vue 应用，`server/utils` 面向 Nitro，两边各写一份会漂移，SSR 通过、接口却拒绝时很难对账。`shared/` 明确是同构层：浏览器和服务器都能导入，适合 schema、错误码和纯函数。它不能依赖 `window`、`fs` 或请求对象，否则一边打包失败或运行时报错。需要事件或 Cookie 时，在 `server/` 包一层适配，不要把运行时 API 塞进 `shared/`。

:::

---

### Q3. `useFetch` 和 `useAsyncData` 怎么选？为什么 setup 里不要直接 `$fetch` 首屏数据？

**考察点：** payload 转发、key 去重、`$fetch` 双请求、`enabled` / `lazy`

::: details 参考答案

`useFetch(url)` 是 `useAsyncData` + `$fetch` 的常见封装：按 URL 生成 key，推断服务端路由类型，并把结果写入 Nuxt payload，hydration 时不再打同一请求。`useAsyncData` 适合自定义 handler、聚合多次请求、接 CMS SDK，或必须手写稳定 key 的场景。两者都是 SSR 安全的数据入口；`$fetch` 没有去重和 payload 转发。

setup 里直接 `$fetch` 会在服务端渲染打一次、客户端水合再打一次，既慢又容易水合不一致。`$fetch` 留给点击、提交等事件，或包进 `useAsyncData`。服务端内部请求应走 `useRequestFetch` / `useFetch`，以便转发 Cookie（排除 `host` 等不安全头）。Nuxt 4.5 可用响应式 `enabled` 卡住条件请求；`lazy` 表示导航不阻塞，和「不写 await」观感相近但语义不同。

Vue 的 `ref` / `watch` 细节见 [02 Vue3](/interview/questions/02-vue3)；本题只讲 Nuxt 的获取与 payload 边界。payload 去重的故障形态见 D1。

:::

**追问：** 不 `await useFetch` 和设置 `lazy: true` 是一回事吗？

::: details 追问参考答案

不是。服务端无论是否 await，Nuxt 都会等请求结束再序列化 HTML。await 影响的是后续代码能否假定 `data` 已有值，以及客户端导航会不会等到数据就绪。`lazy` 把请求推迟到挂载，客户端即使 await 也会立刻返回，必须自己看 `status`。要阻塞导航就不要 `lazy`；要立即进入页面并自己画 loading，用 `lazy` 或 `useLazyFetch`，别靠「漏写 await」表达意图。

:::

---

### Q4. SSR、CSR、SSG、ISR 在 Nuxt 4 里如何按路由组合？

**考察点：** universal / hybrid rendering、`routeRules`、`swr` 与 `isr`、`nuxt generate` 边界

::: details 参考答案

默认是 universal rendering：服务器出完整 HTML，浏览器 hydration。全局 `ssr: false` 变成 CSR，适合无索引的后台；公开站不要一刀切。混合站点用 `routeRules`：首页 `prerender: true` 做 SSG，商品列表 `swr: 3600` 在服务器或反代缓存并后台回源，博客 `isr: 3600` 把响应放进支持该能力的 CDN（当前主要是 Netlify / Vercel），`/admin/**` 设 `ssr: false`。

`swr` 和 `isr` 都是 stale-while-revalidate 思路，差别在缓存位置：`swr` 走 Nitro / 反向代理，`isr: true` 可在 CDN 上活到下次部署。`redirect`、`headers`、`cors`、`noScripts` 也是同一套规则。`nuxt generate` 没有运行中的服务器，hybrid rendering 不可用；需要 `server/api` 或按需再生就用 `nuxt build`。

口述强调：**渲染模式是路由属性，不是整仓开关。** 个性化页不要 prerender；ISR 的失效策略见 D5，CDN 交付见 D3。

:::

**追问：** 把整站 `ssr: false` 再 `nuxt generate`，算不算已经做了 SSG？

::: details 追问参考答案

不算。那是静态托管的 SPA 壳：默认可能只剩 `index.html`、`200.html` 和 `404.html`，正文仍等浏览器拉接口，爬虫首跳看不到内容。SSG 是构建期把具体路由渲染成带数据的 HTML，并带上 `_payload.json`。没有运行中的服务器时也没有 ISR / SWR。需要可爬取的多路由静态页，应对这些路径设 `prerender: true` 或走预渲染构建，而不是用 CSR 加静态托管冒充已经静态化。

:::

---

### Q5. route middleware 和 server middleware 分别跑在哪一层？

**考察点：** `app/middleware`、`server/middleware`、导航守卫、HTTP 请求管线

::: details 参考答案

`app/middleware` 是 Vue 应用的路由中间件，在页面导航前运行：首屏 SSR 和服务端渲染期间会跑，客户端后续 `NuxtLink` 导航也会跑。用 `defineNuxtRouteMiddleware`，可 `navigateTo` 或 `abortNavigation`。文件名 `.global` 表示全局，否则由 `definePageMeta({ middleware })` 或 `routeRules.appMiddleware` 声明。它拿得到路由和 Nuxt 上下文，不是每一条静态资源请求。

`server/middleware` 是 Nitro / h3 中间件，对进入 Node 或 Edge 的 HTTP 请求生效，包括页面、`/api` 和自定义 `server/routes`。适合 CORS、请求日志、IP 限制、统一鉴权头，不适合「跳到某个 Vue 页面」这种导航语义。两边都叫 middleware，但一层是路由图，一层是 HTTP 管线；鉴权常要两层协作，而不是只写其中一个。

Cookie 在 SSR 中如何转发见 D4，不要在本题展开 Vue Router 守卫实现，那属于 [02 Vue3](/interview/questions/02-vue3)。

:::

**追问：** 只把登录校验放在 `app/middleware` 够不够保护 `server/api`？

::: details 追问参考答案

不够。路由中间件只包住 Vue 页面导航，浏览器、脚本或服务端可以直接打 `/api`。接口必须在 Nitro 路由、`server/middleware` 或工具函数里独立验 Cookie / Session，并返回正确状态码。页面中间件负责体验：未登录跳转登录页、已登录禁入注册页。两层校验的数据源要同一套，避免页面以为已登录、接口却 401，或接口信任页面守卫而裸奔。

:::

---

## 二、SEO、配置、Nitro 与模块

### Q6. `useHead` 和 `useSeoMeta` 怎么分工？如何避免 SEO 标签水合错乱？

**考察点：** unhead v3、`useSeoMeta`、SSR head、标题模板

::: details 参考答案

`useSeoMeta` 覆盖 title、description、og、twitter 等常见字段，类型更窄，适合页面级 SEO。`useHead` 管完整 head：`htmlAttrs`、link、script、style、noscript 和任意 meta。布局里用 `useHead` 设 title template 和默认 favicon，页面再用 `useSeoMeta` 覆盖。Nuxt 4.5 的 head 跑在 unhead v3 上，类型收紧，promise 输入已移除，升级时的类型报错多半是真约束而不是误报。

标签在服务端写入 HTML，客户端按 payload 水合，不能在 setup 里用 `Date.now()`、随机数或仅浏览器有的 `window.location` 拼 title。按路由的规范 URL、canonical 和 hreflang 应来自稳定输入。JSON-LD 同样走 `useHead`，并保证服务端与客户端结构一致。

本题只讲 Nuxt 的 head 约定；滚动、焦点和更多无障碍细节见性能 / a11y 题库，不要把 Vue 组件通信塞进来。

:::

**追问：** 为什么在 `onMounted` 里才 `useHead` 改标题对 SEO 几乎无效？

::: details 追问参考答案

爬虫和分享爬取器读的是首份 HTML。`onMounted` 只在水合后的浏览器执行，服务端输出仍是布局默认标题，搜索结果和微信 / Twitter 卡片不会等到客户端。SEO 字段必须在 setup 或服务端可执行的插件里同步声明，数据来自 `useAsyncData` / `useFetch` 的稳定结果。客户端再改标题只影响已打开的标签页，不能补救首屏 HTML。

:::

---

### Q7. `runtimeConfig` 的 public 和 private 边界是什么？

**考察点：** `useRuntimeConfig`、`NUXT_` / `NUXT_PUBLIC_`、密钥与构建期环境变量

::: details 参考答案

`runtimeConfig.private`（根上除 `public` 外的键）只存在于服务器，用 `NUXT_API_SECRET` 这类环境变量覆盖。`runtimeConfig.public` 会打进客户端 bundle 与 payload，用 `NUXT_PUBLIC_` 覆盖。浏览器里的 `useRuntimeConfig()` 只能看见 public；把数据库口令、签名密钥放进 `public` 等于公开。

它是**运行时**配置：同一份 Nitro 产物可按环境注入，不必为每个环境重打前端包。这和 Vite 的 `import.meta.env.VITE_*` 不同，后者是构建期内联。前端可公开的 API 根路径、功能开关放 public；签名、webhook、管理令牌放 private，只在 `server/` 读取。构建期密钥与 CI 注入见 [03 工程化](/interview/questions/03-engineering)，本题只划 Nuxt 运行时边界。

:::

**追问：** 为什么「密钥只写在 `nuxt.config` 里、不提交 `.env`」仍然不安全？

::: details 追问参考答案

`nuxt.config` 会进仓库，私钥等于写进 Git。正确做法是配置里只放空默认值或非敏感占位，由部署环境的 `NUXT_` 变量覆盖。即便没提交 `.env`，若误把密钥放进 `public`，它仍会出现在 HTML、客户端脚本甚至错误上报里。审查应以「浏览器能否读到」为准，而不是「我没有把 `.env` 加进 commit」，也要检查 source map 和构建产物。

:::

---

### Q8. Nitro 路由和缓存怎么设计？如何和页面 `routeRules` 配合？

**考察点：** `server/api`、`server/routes`、`defineCachedEventHandler`、`routeRules`

::: details 参考答案

Nitro 是 Nuxt 的服务器。`server/api/users.get.ts` 映射 `/api/users`，`server/routes/sitemap.xml.ts` 映射任意路径。页面 HTML 的缓存、重定向、ISR / SWR 用 `routeRules`；接口用 `defineCachedEventHandler` 或路由级 `cache`，并显式设计 cache key：是否包含 Cookie、语言、租户。个性化响应默认不要缓存。

`routeRules` 会在支持的平台上落到原生规则，同时给 SWR / ISR 页面生成 `_payload.json`，客户端导航可复用。接口缓存和页面缓存必须分开想：页面缓存的是渲染结果，接口缓存的是 JSON。缓存了带用户名的 HTML 或把 `Authorization` 写进公共 key，会造成串号。部署 preset、CDN 回源和发布门禁见 D3 与 [03 工程化](/interview/questions/03-engineering）。

:::

**追问：** 给 `/api/me` 套和首页一样的 `swr` 会有什么后果？

::: details 追问参考答案

首页多半是公开 HTML，SWR 能降源站压力；`/api/me` 随 Cookie 变，公共 TTL 会把 A 的资料发给 B，或在登录态变化后继续吐旧用户。用户接口应视为私有，按 session 协商缓存或直接 `no-store`。若确要短缓存，key 必须纳入用户标识且不能进共享 CDN。页面规则不能原样套到 API，先问响应是否可公开、是否允许错发给另一个登录者。

:::

---

### Q9. hydration mismatch 在 Nuxt 里常见原因是什么？如何收敛？

**考察点：** 服务端 / 客户端输入不一致、`ClientOnly`、无效 HTML、payload 与时间

::: details 参考答案

水合要求客户端首轮渲染与服务器 HTML 一致。Nuxt 里高频原因：setup 使用 `Date.now()`、`Math.random()`、本地时区或 `window` / `document`；首屏用 `$fetch` 导致两侧数据不同；`v-if` 依赖 `import.meta.client` 却把不同结构写进同一棵树；非法 HTML（`p` 套 `p`）被浏览器改 DOM。Vue 对 mismatch 的机制见 [02 Vue3](/interview/questions/02-vue3)，本题讲 Nuxt 侧怎么避免。

收敛顺序：时间、随机、本地存储只放 `ClientOnly` 或 `onMounted`；首屏数据走 `useFetch` / `useAsyncData`；浏览器-only 库放 `.client` 插件或客户端组件；检查语义 HTML。不要用「关掉 SSR」逃避，那会丢掉 SEO 和首屏 HTML。开发环境的 mismatch 警告要当缺陷，而不是用 `ssr: false` 或强制重渲染刷掉。

:::

**追问：** 用 `ClientOnly` 包住整页，算不算解决了 hydration mismatch？

::: details 追问参考答案

没有解决，只是放弃了该树的服务端 HTML。整页 `ClientOnly` 等于局部 CSR：爬虫和首屏用户看到占位，TTFB 优势消失。它只适合确实无法同构的小组件，如依赖 `window` 的地图、编辑器。能同构的内容应修数据源和 DOM 结构。若公开页大面积依赖 `ClientOnly`，应重新划分路由，把后台交互放到 `ssr: false` 的区间，而不是在营销页上关水合。

:::

---

### Q10. Nuxt 模块和 layers 分别解决什么问题？

**考察点：** `defineNuxtModule`、`extends`、约定复用、边界隔离

::: details 参考答案

模块用 `@nuxt/kit` 在构建期扩展 Nuxt：注册组件目录、改 `nuxt.config`、加 Nitro 路由、插 Vite / webpack 插件。它适合可发布的能力，如内容、鉴权、分析。layer 通过 `extends` 继承另一份 Nuxt 应用的 pages、components、中间件和配置，适合多品牌站点或「基础壳 + 业务层」。模块是插件化扩展点，layer 是应用切片的继承。

选择：要在很多仓库复用同一套构建逻辑，发模块；要复用页面和布局且允许覆盖文件，用 layer。模块必须隔离客户端与服务器依赖，不能把 `fs` 打进浏览器。layer 要约定覆盖优先级和自动导入冲突。类型与隔离的深挖见 D6，不要把模块当运行时 `app/plugins` 的别名。

:::

**追问：** 为什么把业务页面塞进模块，通常不如做成 layer？

::: details 追问参考答案

模块的职责是构建期扩展和可选运行时注入，页面、布局这类应用切片一旦进模块，覆盖、调试和类型都会绕一层 kit。layer 按文件约定覆盖：业务仓放同名 `app/pages` 即可改壳。模块适合「安装后获得能力」，layer 适合「继承一份站点再改差异」。业务页进模块还会逼所有消费者吃同一路由表，版本升级变成全站回归。

:::

---

### Q11. 文件路由、`definePageMeta` 和 layouts 如何配合？

**考察点：** `app/pages`、动态段、`definePageMeta`、`useLayout`、named views

::: details 参考答案

`app/pages` 生成路由：`index.vue` 是 `/`，`blog/[slug].vue` 是动态段，`[...slug].vue` 是 catch-all，`[[slug]]` 是可选段。页面用 `definePageMeta` 声明 layout、middleware、alias、name、keepalive，这些是构建期静态元数据，不能依赖运行时才有的密钥或随机值。布局放在 `app/layouts`，默认 `default.vue`；Nuxt 4.5 可用 `useLayout()` 只读拿到当前解析结果。

4.5 起支持 named views：父页多个 `<NuxtPage>`，子文件用 `child@sidebar.vue` 填具名出口。`definePageMeta` 只读默认路由文件，不能给每个 view 单独设渲染模式。路由规则与文件路由叠加时，以更具体的 `routeRules` 为准。别在页面里手写整张 `vue-router` 表来「更灵活」，那会丢掉类型、预取和预渲染发现。

:::

**追问：** 为什么不能在 `definePageMeta` 里根据 Cookie 动态改 layout？

::: details 追问参考答案

`definePageMeta` 在编译期抽取，供路由表、预渲染和类型生成使用，不是请求期 API。Cookie 鉴权属于运行时，应在 route middleware 里 `navigateTo`，或在布局内按 `useCookie` / `useState` 切换插槽。把运行时分支写进 page meta 会在构建期被丢掉或变成恒定值。需要按角色换壳时，用中间件加明确的 layout 名，或在布局组件内分支，而不是幻想 meta 能读到请求头。

:::

---

### Q12. `app/plugins` 和 Nitro `server/plugins` 如何分工？

**考察点：** Vue 插件、`.client` / `.server`、Nitro 钩子、副作用隔离

::: details 参考答案

`app/plugins` 在创建 Nuxt / Vue 应用时运行，可 `vueApp.use`、`provide`、注册指令。文件名 `.client` / `.server` 限制环境；默认插件在两侧都跑，必须对 `window` 和 Node API 做守卫。它属于应用上下文，能用 composable，但不能假定每条 API 请求都会执行。

`server/plugins` 是 Nitro 插件，在服务器启动时注册 h3 钩子、存储驱动、请求日志。它没有 Vue 实例，不能 `useFetch` 页面数据。浏览器分析 SDK 放 `.client` 应用插件；给每个响应加安全头放 Nitro 插件或 `server/middleware`。顺序要稳定，避免在插件里做不可重入的全局单例污染——HMR 与单例问题见 [24 Vite](/interview/questions/24-vite)。

:::

**追问：** 为什么在通用 `app/plugins` 里 `import` 只能在浏览器跑的 SDK 会炸 SSR？

::: details 追问参考答案

通用插件在服务器执行，顶层 `import` 会求值模块副作用。很多 SDK 一加载就读 `window` 或 `document`，SSR 直接抛错，或把浏览器代码打进服务端 bundle。应改 `.client` 插件、把动态导入放进 `import.meta.client` 分支，或用 `ClientOnly` 包住使用方。包声明了副作用时，打包器不会因为你「没用到某个函数」就删掉顶层代码，开发时能过、生产 SSR 才炸也很常见。

:::

---

## 三、深层场景题

### D1. payload 如何传递数据并去重？什么时候必须允许客户端重拉？

::: details 参考答案

#### 基础结论

`useFetch` / `useAsyncData` 在服务端写入 Nuxt payload，客户端按 key 复水，避免首屏双请求。去重的单位是稳定 key，不是「看起来像同一个 URL」。个性化、过期或不可序列化的数据不能塞进公共 payload，这时应明确允许客户端重拉。

#### 原理深挖

payload 经 devalue 序列化，可携带 Date、Map、Set、正则和部分 Vue 代理，但函数、class 实例和循环引用会丢或失败。同一 key 共享同一份响应式状态；key 漏了路由参数，列表页会串数据。`getCachedData` 可改读取策略，默认命中 payload 就不发请求。生产环境的 payload extraction 会把数据抽到 `_payload.json`，SWR / ISR 页面的客户端导航会优先吃这份缓存。

#### 工程场景

商品详情 key 带 `slug` 与预览版本号；CMS 聚合用 `useAsyncData` 手写 key。后台预览或编辑态用 `getCachedData` 拒绝过期 payload，或 `server: false` 仅客户端拉。多组件同页读同一接口时复用 key，避免 N 次 handler。DevTools 的 Payload 面板用来核对体积和误入的用户字段。

#### 反例 / 踩坑

setup 里 `$fetch`、key 写成常量 `'data'`、把 access token 放进 payload、对不可序列化的 SDK 对象直接返回、以及以为刷新页面仍走 payload 而不打网络。客户端导航吃了 ISR 的旧 `_payload.json`，也会表现为「发布后列表不更新」。

#### 资深回答模板

我把首屏数据全部收进带业务键的 `useAsyncData` / `useFetch`，用 DevTools 检查 payload 体积和敏感字段。公共页依赖 payload 去重；预览、账号和支付在 key 或 `getCachedData` 上拒绝共享缓存，并明确客户端重拉。失败时对照 payload 与网络面板，而不是先关 SSR。

:::

**追问链：**
1. 两个组件都 `useFetch('/api/items')` 会不会打两次？
2. 为什么预览草稿不能直接复用正式页 payload？
3. payload 体积过大时你先砍什么？

::: details 追问参考答案

**1. 两个组件都 `useFetch('/api/items')` 会不会打两次？**

同一导航、同一默认 key 时会去重并共享状态。若 query、method 或自定义 key 不同，就会变成两次请求。需要独立副本时显式换 key；需要共享时不要各写各的转换逻辑。还要确认两边的 `handler`、`transform`、`pick` 一致，Nuxt 4 对同 key 的选项匹配更严，不一致会警告或两边看到不同数据。列表和详情更要带上路由参数，避免「看起来是同一个 URL」实际串页。

**2. 为什么预览草稿不能直接复用正式页 payload？**

正式页 payload 可能被 CDN 或 ISR 缓存，草稿带未发布内容和编辑者身份。复用同一 key 会让匿名用户吃到草稿，或让编辑者看到过期正式稿。预览 key 应包含预览 token 或版本，并禁止公开缓存；必要时 `server: false` 或拒绝读取公共 payload，让编辑态始终打带凭证的请求。验收要分别用无 Cookie 和编辑账号打开同一 URL，确认两套数据不会串。

**3. payload 体积过大时你先砍什么？**

先去掉列表里的富文本、重复媒体 URL 和仅客户端需要的调试字段，用 `pick` 或 `transform` 收窄。大附件走独立接口或 CDN，不进首屏 payload。再检查是否误把整份 CMS 响应序列化进 HTML。体积降下来后才考虑拆路由或改用 `lazy`，而不是先关 payload extraction 让客户端重拉全部数据。DevTools 的 Payload 面板能直接看到哪一个 key 最肥，比猜接口慢更有效。

:::

---

### D2. universal rendering 下错误、超时和取消如何治理？

::: details 参考答案

#### 基础结论

服务端渲染必须在限定时间内给出 HTML 或受控错误页，不能把未捕获 Promise 拖到平台超时。错误要区分 404、401、超时和 5xx，用 `createError` / `showError` 进入 `error.vue`，并避免把堆栈和内部 URL 泄漏给浏览器。

#### 原理深挖

universal 下页面、中间件和插件在服务器执行一遍。未捕获异常会变成 500 HTML；`createError({ statusCode, fatal })` 才能把状态码写进响应。流式 SSR 一旦冲出首字节，状态码和头就改不了，见 D7。`useFetch` 的超时、`enabled` 翻转和导航取消应中止请求，且 AbortError 不能当成业务失败。客户端水合后再抛的错误不会改已发出的 HTTP 状态，只能走错误页或 toast。

#### 工程场景

对依赖 CMS 的页面设超时与降级：超时展示缓存壳或局部错误，而不是整页 502。支付回跳等关键路由失败要 fatal，避免半页可点。日志带 request id，响应体只留用户可读信息。Nuxt 4.5 的稳定错误码（如 `NUXT_E1001`）用于定位「在 Nuxt 上下文外调用 composable」，生产环境只保留码，详细 why/fix 被剥掉。

#### 反例 / 踩坑

`try/catch` 后返回空对象冒充 200、把超时当 404、在插件里抛错却不设 status、忽略取消导致卸载后写状态、以及错误页再 `useFetch` 当前 path 却忘了预渲染 404 时 path 是假的。流式模式下在 `onPrehydrate` 之后 `setResponseStatus` 会静默丢弃。

#### 资深回答模板

我按状态码和是否可降级分类：内容缺失走 404，鉴权走 401/403，依赖超时走降级或 503。所有首屏请求有超时和取消，Abort 不当业务错误。错误页不泄露内部细节，日志用 request id 串联；涉及流式渲染的路由先确认还能改状态码。

:::

**追问链：**
1. 服务端 `createError({ statusCode: 404 })` 和客户端 `showError` 差在哪？
2. 超时后为什么不能一律重试？
3. 错误页里按当前 path 拉推荐内容有什么坑？

::: details 追问参考答案

**1. 服务端 `createError({ statusCode: 404 })` 和客户端 `showError` 差在哪？**

服务端抛 `createError` 能在响应发出前写 HTTP 状态，爬虫和 CDN 看到真 404。客户端 `showError` 只切换错误 UI，地址栏和已经发出的 200 不会变。需要正确状态码的公开页必须在服务器判定；客户端适用于导航之后的局部失败。`fatal: true` 才会中断整页，否则可能继续渲染半棵树，看起来像成功页。流式开启时还要保证抛错发生在首字节之前，否则状态码同样改不回去。

**2. 超时后为什么不能一律重试？**

服务端重试会叠乘源站压力，在依赖故障时把超时放大成雪崩。用户刷新或客户端再进可以重试，但 SSR 请求应有预算和熔断。幂等读可有限次退避，写操作和对账接口禁止盲目重试。超时先返回降级或 503，并把压力信号打到监控，而不是在 Node 里循环打源。

**3. 错误页里按当前 path 拉推荐内容有什么坑？**

预渲染 `404.html` 时 path 是构建期占位，不是用户输入的 URL，服务端拉到的推荐会在水合后被纠正或错位。应用 `import.meta.prerender` 跳过请求期数据，或把依赖 path 的块放进 `ClientOnly`。带真实服务器部署时，同一份 `error.vue` 仍可以按请求 SSR。不要假定错误页总能读到用户地址栏，更不要据此做权限判断。验收要分别走预渲染静态托管和带 Nitro 的部署，两种 path 语义不一样。

:::

---

### D3. 预渲染结果如何配合 CDN 交付，而不是每次都打到 Node？

::: details 参考答案

#### 基础结论

能在构建期确定的公开页应 prerender 成 HTML + payload，由 CDN 按 URL 缓存；Node / Edge 只处理个性化、预览和 API。CDN 不是渲染模式，而是把已生成响应推到离用户更近的位置。

#### 原理深挖

`prerender: true` 或预渲染爬取在构建时执行数据函数，产出静态资源。CDN 命中则不再进 Nitro。`swr` 把缓存放在服务器或反代，过期后先吐旧再回源；`isr` 在支持的平台写入 CDN，`true` 时往往活到下次部署。Edge 渲染是部署目标：Cloudflare / Vercel Edge / Netlify Edge 上跑 Nitro，仍要靠 `routeRules` 决定哪条路可缓存。`nuxt generate` 没有服务器，CDN 只能端静态文件。

#### 工程场景

营销首页、文档、博客列表走 prerender + 长 TTL；价格或库存页用短 SWR；登录后页面 `ssr: false` 或 `private` 头。发布流水线在构建后刷新 CDN，而不是指望用户 Ctrl+F5。HTML 与 `_payload.json` 必须同版本失效，否则客户端导航吃旧数据。灰度与回滚看制品和缓存键，细节门禁见 [03 工程化](/interview/questions/03-engineering)。

#### 反例 / 踩坑

把带 Cookie 的 HTML 缓存成公开、只清 HTML 不清 payload、在 `generate` 产物里调用已不存在的 `/api`、用超长 TTL 又不做发布失效、以及把 Edge 当成「自动 ISR」。混合规则在不支持的平台上只会退化成普通 Node 缓存，口头说「已经上 ISR」会误导容量规划。

#### 资深回答模板

我先把路由分成可预渲染、可匿名缓存、必须动态三类，分别落到 prerender、SWR/ISR 和私有 SSR。CDN 只缓存可公开字节，发布时 HTML 与 payload 一起失效。个性化流量回源到 Nitro，并用缓存命中率、回源时间和错误率验证，而不是看构建日志里有多少静态文件。

:::

**追问链：**
1. 为什么清 CDN 的 HTML 后列表仍可能是旧的？
2. Edge 渲染能否替代 prerender？
3. 预渲染页里调用相对路径 `/api` 为什么会在 generate 时失败？

::: details 追问参考答案

**1. 为什么清 CDN 的 HTML 后列表仍可能是旧的？**

客户端导航常加载 `_payload.json` 或 SWR 缓存，而不是再要一份 HTML。只 purge 页面文件会留下旧 payload，列表看起来像没发布。失效集合应包含 HTML、payload 和同一业务 key 的数据缓存。验证时既要整页硬刷新，也要从站内链接点进去，才能覆盖首屏和客户端导航两条路径。只盯 Network 里的文档请求，会漏掉 payload 这条线。

**2. Edge 渲染能否替代 prerender？**

不能当等价物。Edge 降低的是动态渲染的 RTT，每次未命中仍要执行 Vue 和数据函数，费用和冷启动仍在。预渲染把稳定页变成静态字节，命中后不再执行应用代码。稳定营销页应预渲染；需要按请求个性化或就近计算时再上 Edge。两者可叠加：Edge 跑 Nitro，同时对可缓存路径设 ISR。

**3. 预渲染页里调用相对路径 `/api` 为什么会在 generate 时失败？**

`nuxt generate` 默认不带可监听的服务器，构建期没有真实 `/api` 进程。相对路径的 `$fetch('/api')` 会打到不存在的源，页面变成空数据或构建失败。预渲染用的数据必须在构建期可访问：外部 CMS、构建脚本写入的数据源，或改用 `nuxt build` 保留 Nitro。需要自有接口的站点，不要用 generate 冒充「全静态还能调自己的 API」。这个问题只在预渲染日志里出现，本地 `nuxt dev` 往往发现不了。

:::

---

### D4. SSR 场景下鉴权 Cookie 如何转发且不泄露到 payload？

::: details 参考答案

#### 基础结论

浏览器只会把 Cookie 发给同源的首屏请求。服务端再调内部 API 时必须显式转发允许的头，通常靠 `useFetch` / `useRequestFetch`，而不是自己抄全部请求头。Session 只放 httpOnly Cookie，access token 不进 `runtimeConfig.public` 和 payload。

#### 原理深挖

SSR 时组件在 Node / Edge 运行，默认 `$fetch` 看不到用户 Cookie。`useRequestFetch` 会转发安全子集，排除 `host`、`content-length`、`x-forwarded-*` 等。`useCookie` 在两端同步可读的非 httpOnly 值；httpOnly 只能在服务器用事件对象读取。把用户对象整份放进 `useState` 或 `useAsyncData` 默认 payload，等于写进 HTML。跨站 API 更不能原样转发 Cookie，否则变成开放代理。

#### 工程场景

`/api/me` 用 `getCookie` 验 session，页面 `useFetch('/api/me')` 依赖自动转发。登录 Set-Cookie 在服务端响应完成前写入；流式 SSR 下迟到的 Cookie 会丢，见 D7。CSRF 对非幂等写操作仍要 SameSite + 令牌。本地 http、生产 https 的 `Secure` / `Domain` 必须按环境区分，避免「本地通、线上丢 Cookie」。

#### 反例 / 踩坑

把 `useRequestHeaders()` 全部转到第三方、在 payload 里回显 token、用 `localStorage` 当 SSR 会话、页面 middleware 校验了但 API 未校验、以及缓存 `/api/me` 的公开 SWR。客户端导航不再走服务器时，以为「没有 Cookie 转发问题」而漏掉 XSS 读非 httpOnly 会话。

#### 资深回答模板

我把会话放在 httpOnly Cookie，页面数据用 `useFetch` 走内部 API，让框架转发允许的头。用户身份不进公共 payload，接口单独鉴权。写 Cookie 发生在响应提交前；涉及流式渲染的路由先关掉流式。验收同时看首屏 HTML 源码和 Network，确认没有令牌明文。

:::

**追问链：**
1. 为什么不能把 Incoming 的全部 header 转给第三方 API？
2. `useState('user')` 存整份用户资料有什么风险？
3. 客户端导航到需登录页时，还要不要转发 Cookie？

::: details 追问参考答案

**1. 为什么不能把 Incoming 的全部 header 转给第三方 API？**

`host`、转发头和部分 CDN 头会改变目标服务器的路由、协议判断和访问控制，可能造成环回或权限绕过。第三方若记录头，还会泄漏内部拓扑和真实客户端 IP。只转发明确需要的 `cookie` 或授权头，并确认目标是自己的 BFF。`useRequestFetch` 的默认排除列表是底线，不是可以把整个 Incoming headers 展开转发的许可。对外域请求更应单独白名单，而不是复用页面内网转发逻辑。

**2. `useState('user')` 存整份用户资料有什么风险？**

`useState` 默认进入 payload，首屏 HTML 能看到邮箱、角色甚至内部 id。任何能查看源码或被中间代理缓存的人都能读到。公开字段应尽量少，敏感资料按需在客户端拉取，或自定义序列化排除。即使用户「已经登录」，也不等于这些字段该被 CDN 或分享链接缓存。审查时直接搜 `__NUXT_DATA__`，比只看 Network 请求列表更接近真实泄漏面。

**3. 客户端导航到需登录页时，还要不要转发 Cookie？**

浏览器会自动带上同源 Cookie，不再经过 Node 转发。此时要保证 `useFetch` 走相对内部 API，且 Cookie 的 Path、SameSite 能覆盖这些请求。若导航后改打另一个域的 BFF，必须改用显式凭证，而不是幻想 `useRequestFetch` 仍在工作。页面中间件仍要处理未登录跳转，API 仍要独立验会话。客户端导航通了不等于首屏 SSR 也通，两条路径都要测。

:::

---

### D5. 增量静态再生与按需失效如何设计，避免全站重建？

::: details 参考答案

#### 基础结论

ISR / SWR 把「构建时生成」变成「按路径生成并按 TTL 或标签失效」。全站重建只留给模板、依赖和全局文案变更。按需失效必须绑定业务主键和缓存标签，而不是手动清整个 CDN。

#### 原理深挖

`isr: 3600` 表示 CDN 上可放一小时；`isr: true` 在支持的平台上往往持续到下次部署。`swr` 不保证进 CDN。按需失效依赖平台：Vercel / Netlify 的路径或标签 purge、Nitro 存储的 cache key。客户端导航使用的 `_payload.json` 必须与 HTML 一同失效。没有原生 ISR 的 Node 主机，只能退化成服务器 SWR，容量模型不能按「边缘命中」来估。

#### 工程场景

文章发布 webhook 只失效 `/blog/:slug` 和列表页，不重建全站。商品改价失效详情和分类列表。预览通道走私有、不进 ISR。TTL 与按需删除并存：TTL 防漏网，标签删除保时效。监控回源率和 404 再生风暴，避免冷路径被并发打穿源 CMS。

#### 反例 / 踩坑

每次改一行文案就 `nuxt generate` 全量、失效时只删 HTML、把预览 URL 配进 ISR、TTL 设一年又没有 webhook、以及在不支持 ISR 的预设上宣称「已经增量静态」。并发未命中没有锁或 single-flight，会把 CMS 打满。

#### 资深回答模板

我按资源类型设 TTL 和标签，发布事件只 purge 相关 HTML 与 payload。全量重建留给设计系统和依赖升级。上线前用平台文档确认 ISR 是否真进 CDN，并用一次发布验证列表、详情和站内导航三处同时更新。

:::

**追问链：**
1. 只失效文章详情、不失效列表页，用户会看到什么？
2. `isr: true` 没有 webhook 时内容何时更新？
3. 如何避免冷门路径同时失效造成回源风暴？

::: details 追问参考答案

**1. 只失效文章详情、不失效列表页，用户会看到什么？**

详情可能已是新标题，列表和首页卡片仍是旧摘要，分享图和站内搜索也不一致。编辑会认为「有的页面缓存坏了」，实际是失效集合不完整。失效要按业务图走：详情、所属列表、RSS 和 sitemap 片段。自动测试应用两个入口打开同一篇文章，对比标题和更新时间。只测详情 URL 会把列表缓存漏掉，发布流水线看起来全绿，用户仍看到旧卡片。

**2. `isr: true` 没有 webhook 时内容何时更新？**

在支持的 CDN 上，它通常活到下一次部署。CMS 里改了正文，线上可以一直是旧 HTML，编辑会以为发布按钮坏了。要么给有限 TTL，要么接发布 webhook 做路径或标签 purge。不要把 `isr: true` 理解成「永远最新的静态」，它更接近「直到下次发版才变」。若业务要求保存后分钟级可见，必须有失效通道，不能只靠下一次前端发版。

**3. 如何避免冷门路径同时失效造成回源风暴？**

按标签分批失效，而不是清全站通配符。回源加 single-flight 或短锁，让并发请求共用一次再生。源 CMS 要有速率限制和降级。大促前预热热门路径，监控再生 QPS，异常时立刻停止批量 purge。冷门页宁可先吐旧的 SWR 响应，也不要同一秒全部回源。没有锁的「失效即回源」会把发布事件变成对 CMS 的拒绝服务。

:::

---

### D6. 如何隔离模块副作用并保持类型与自动导入可预测？

::: details 参考答案

#### 基础结论

模块在构建期改 Nuxt 图，运行时只注入声明过的客户端或服务器代码。自动导入、组件名和类型导出必须可预测、可覆盖，避免业务仓出现同名 composable 或把 Node 模块打进浏览器。

#### 原理深挖

`defineNuxtModule` 通过 hook 加模板、别名、Nitro 处理器和 Vite 插件。模块的 `runtime` 目录要按 `.client` / `.server` 切开；在 `setup` 里 `import('fs')` 没问题，把同一文件标成通用 runtime 就会泄漏。类型靠 `dist/types` 或 `nuxt.schema`，让 `runtimeConfig` 和自动导入在业务仓补全。layer 的文件覆盖按扩展顺序合并，后声明的覆盖先声明的，冲突不会总报错。

#### 工程场景

内部设计系统模块只注册组件前缀和 CSS，不偷偷加全局 mixin。鉴权模块导出明确的 `useAuth` 和 server util，业务仓禁止再自动导入另一份同名函数。发布模块出编译后的 JS，Nuxt 5 方向下 `node_modules` 里的 TS 入口不能再靠运行时剥类型。CI 跑类型检查和一份最小 fixture 应用，验证自动导入快照。

#### 反例 / 踩坑

模块里默认 `addImports` 抢占 `useUser`、在通用插件顶层引 `sharp`、layer 与模块重复注册同一页面、用 `any` 填 `runtimeConfig`、以及修改消费者的 `tsconfig` 却不声明路径。HMR 下模块单例重复订阅事件，也会表现为「开发正常、生产双请求」。

#### 资深回答模板

我把模块当成带契约的构建扩展：公开的导入名、配置 schema 和运行时切分写进文档和类型。业务仓用前缀和显式导入解决冲突，layer 只覆盖约定文件。每次发模块都用 fixture 应用做类型与构建检查，而不是让业务仓库当试验场。

:::

**追问链：**
1. 自动导入重名时你倾向谁覆盖谁？
2. 为什么模块的运行时入口要编译成 JavaScript 再发布？
3. layer 覆盖了组件但类型还指向旧模块时怎么查？

::: details 追问参考答案

**1. 自动导入重名时你倾向谁覆盖谁？**

先禁止无前缀抢占通用名。模块导出 `useAuth` 这类能力必须带文档和类型；业务仓需要定制就显式 `import` 或配置前缀。layer 覆盖同路径文件时，以应用层为准，但要在评审里看见覆盖。静默覆盖是事故源。CI 对自动导入清单做快照，新增重名即失败，而不是运行时看谁先注册。

**2. 为什么模块的运行时入口要编译成 JavaScript 再发布？**

面向 Nuxt 5 的加载不再为 `node_modules` 剥 TypeScript。纯 TS 入口会让每个消费者安装 `jiti`，或在更高 Node 基线上直接加载失败。构建期应产出 ESM JavaScript 和 `.d.ts`，模块自带的 `nuxt.config` 也要用 `mjs`。这与应用仓内本地 `modules/*.ts` 仍可加载不矛盾：发布出去的包走 Node 解析，不是 Vite 应用图。文档里如果还写「把 TS 源码当入口」，从 4 升到 5 时会集中爆发。

**3. layer 覆盖了组件但类型还指向旧模块时怎么查？**

先看生成的 `.nuxt/components.d.ts` 和自动导入文件指向哪个物理路径，再核对 `extends` 顺序和同名文件。类型服务器可能缓存旧层，需要重启 Nuxt 类型进程。若模块用静态声明而不是扫描，覆盖文件不会更新类型，要把类型改成对扫描结果或用户配置敏感。不要只看浏览器已换组件就认为类型图正确。

:::

---

### D7. 实验性流式 SSR 的能力边界是什么？哪些路由必须回退缓冲渲染？

::: details 参考答案

#### 基础结论

Nuxt 4.5 的 `experimental.ssrStreaming` 默认关闭。开启后先冲出 HTML 壳（head、样式、preload、入口脚本），再流式写出 body，以换 TTFB。它是实验能力：状态码、头和 Cookie 必须在首字节之前定案，否则丢。

#### 原理深挖

流式提交响应后，`setResponseStatus`、迟到的 `Set-Cookie` 和中间件改头无法到达客户端。框架会为 `redirect`、`cache`、`isr`、`swr`、`noScripts`、`ssr: false` 自动回退缓冲渲染；也可用 `routeRules` 设 `streaming: false`。爬虫默认关掉流式，保证拿到完整 HTML，可用 `botRegex` 调整。开发模式会警告被丢弃的 mutation。unhead v3 的同步引擎是流式能成立的前提之一。

#### 工程场景

文档和长内容页适合开流式；登录、支付回跳、要写 Cookie 或做 302 的路由显式关闭。观测 TTFB 和「首字节后才鉴权失败」的误 200。不要在流式页的 setup 后半段才决定 404。与 Vue 的流式组件能力不是同一开关，组件树仍要能同构，细节见 [02 Vue3](/interview/questions/02-vue3)。

#### 反例 / 踩坑

全局打开流式却在页面中途 `navigateTo` 重定向、在 `useFetch` 失败后才 `setResponseStatus(503)`、依赖中间件在渲染中写 Cookie、以及以为爬虫也会吃流式不完整文档。缓存页被流式化后，CDN 可能缓存半截或错误状态。

#### 资深回答模板

我只在内容型、不改响应元数据的路由开流式，登录和缓存策略页保持缓冲。上线前用开发警告和真实爬虫 UA 验收状态码、Cookie 和完整 HTML。TTFB 有收益再扩大范围，否则保持默认关闭，不把实验开关当成全站性能开关。

:::

**追问链：**
1. 为什么 ISR / SWR 路由要自动关掉流式？
2. 流式页面里数据请求失败还能返回 503 吗？
3. 如何验证爬虫拿到的是完整 HTML 而不是半截流？

::: details 追问参考答案

**1. 为什么 ISR / SWR 路由要自动关掉流式？**

这些规则要把完整响应（含状态码和缓存头）作为可缓存字节写入 CDN 或反代。流式在结束前没有完整 body，也很难安全地标 TTL。半截 HTML 或随后改写的头一旦被缓存，会造成大面积错误页或错状态。因此框架回退缓冲，先算完再交给缓存层。强行对流式结果做 ISR 没有平台语义，命中率看起来很高，内容却可能残缺。需要 TTFB 的内容页应与 ISR 路径拆开，不要叠在同一条规则上。

**2. 流式页面里数据请求失败还能返回 503 吗？**

若失败发生在首字节之后，HTTP 状态已经是 200，只能在已流出的 HTML 里嵌错误块或断开连接，CDN 和浏览器都不会把它当成 503。必须在冲流前完成决定状态码的数据，或对该路由设置 `streaming: false`。关键依赖不应用「先出壳再看接口」的方式决定成败。监控如果只看 HTTP 状态，这类故障会表现为「全是 200，用户却看到半页错误」。

**3. 如何验证爬虫拿到的是完整 HTML 而不是半截流？**

用真实爬虫 UA 或配置里的 `botRegex` 打页面，检查响应是否按缓冲模式返回、是否含完整正文和结构化数据，而不是只有壳和脚本。同时用普通浏览器 UA 对比 TTFB 是否真的下降。再看开发日志有没有被丢弃的 header mutation。自动化应断言标题、主内容和状态码，而不是只断言 200 以及根节点存在。爬虫和用户两条 UA 都要进验收，只测其中一条会漏策略。

:::

---

### D8. 从 Nuxt 3 升到 4 时，目录与构建器有哪些高风险点？

::: details 参考答案

#### 基础结论

Nuxt 4 默认 `app/` 为 `srcDir`，`~` 指向应用目录；构建器默认 Vite 8，webpack / rspack 可选且 rspack 已改走 Rsbuild。升级风险集中在别名、自定义 Vite 插件、unhead v3 类型，以及仍按 Nuxt 2 / 3 顶层目录或 webpack-only 叙述的旧文档。Nuxt 3.x 于 2026-07-31 EOL，应规划迁移而不是继续叠 3.x 特性。

#### 原理深挖

若仓库仍是顶层 `pages/`，Nuxt 可能兼容旧结构，但 `modules/`、`public/`、`shared/`、`server/` 按 `rootDir` 解析；已自定义 `srcDir` 时更容易错位。`~/assets` 不再指向仓库根。Vite 8 带来 Rolldown / Oxc 内核，自定义插件和钉死的 Vite 大版本会直接炸。`builder: 'rspack'` 表面 API 还在，内部已是 Rsbuild，旧的 webpack-dev-middleware 假设失效。unhead v3 收紧 `useHead` 类型并去掉 promise 输入。建议 `npx nuxt upgrade --dedupe` 整理 lockfile。

#### 工程场景

先在分支启用 4.x，对照官方升级指南搬目录：应用文件进 `app/`，根上只留配置、server、public、layers、modules、shared。跑类型检查和一次 SSR 预览，专门点别名、自动导入和自定义 Vite 插件。rspack 用户单独回归 HMR 与 scoped CSS。不要在升级窗口同时开 `future.compatibilityVersion: 5`，以免把 5 的破坏性默认和 4 的目录迁移叠在一起。

#### 反例 / 踩坑

只改 `package.json` 不搬目录、继续写 `~/server`、把 webpack 配置当成默认构建、忽略 unhead 类型错误、以及升级后仍用 Nuxt 2 的 `asyncData` / `head()` 讲机制。lockfile 未 dedupe 会造成多份 Vite / unhead。生产构建器与本地不一致（本地 Vite、CI 被环境变量切到 webpack）会只在流水线失败。

#### 资深回答模板

我按官方指南先搬到 `app/` 并修正别名，再用 `nuxt upgrade --dedupe` 对齐 Vite 8 与 unhead v3。自定义 builder 和 Vite 插件单独验收。升级完成前不把 Nuxt 3 目录或 webpack-only 当团队默认口径，并把 3.x EOL 日期写进迁移计划。

:::

**追问链：**
1. 升级后 `~/components` 突然找不到，你先查什么？
2. 为什么自定义 Vite 插件可能在 4.5 静默失效或直接报错？
3. 可以继续把 webpack 当 Nuxt 4 默认构建器来讲吗？

::: details 追问参考答案

**1. 升级后 `~/components` 突然找不到，你先查什么？**

先确认文件是否已在 `app/components`，以及 `~` 是否指向 `app/`。若还留在仓库根，兼容模式可能没启用，或自定义 `srcDir` 让解析偏离。再看 import 用的是别名还是相对路径，以及 `.nuxt` 里生成的组件类型指向哪里。不要先改组件名。`~~/components` 指向根目录，和 `~/components` 不是同一处，混用会表现为「有的文件能找到、有的找不到」。升级检查清单应把别名和目录迁移放在改业务代码之前。

**2. 为什么自定义 Vite 插件可能在 4.5 静默失效或直接报错？**

Nuxt 4.5 默认 Vite 8，插件若钉死旧的 Vite 大版本或使用已删除钩子，会装不上或钩不住 transform。Rspack 路径已经改走 Rsbuild，过去对 webpack-dev-middleware 的假设不再成立。应对照 Vite 8 迁移指南和 Nuxt builder 文档，在经过 dedupe 的 lockfile 下复现。不要用「生产关掉插件」当升级成功。钩子顺序和 enforce 的细节见 [24 Vite](/interview/questions/24-vite)，本题只确认版本不兼容是升级风险而不是业务回归。

**3. 可以继续把 webpack 当 Nuxt 4 默认构建器来讲吗？**

不可以。Nuxt 4.5 默认是 Vite 8；webpack 与 rspack 只是显式的 `builder` 选项，而且 rspack 已经切到 Rsbuild。面试若把 Nuxt 2 的 webpack 配置当现行默认，说明版本停在已经接近 EOL 的叙事。遗留仓库可以暂时保留 `builder: 'webpack'`，但必须说清这只是兼容路径，迁移目标仍是 Vite 8，并单独评估 loader 和插件生态，不能把它讲成框架默认。讲现行默认时先报 Nuxt 4.5 和 Vite 8，再提可选构建器。

:::
