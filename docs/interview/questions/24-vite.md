# Vite 面试题库

> **怎么用：** 普通题按「当前 Vite 主版本 → 开发或生产路径 → 配置入口 → 验收证据」口述 1～2 分钟；深层题按「结论 → 原理 → 工程落点 → 失败模式 → 资深模板」展开。先报 Vite 主版本，再谈预构建、插件、分包和 SSR，不要把 Vite 2–7 的 esbuild / Rollup 心智直接套到 Vite 8。

> **版本口径：** Vite 2–7 默认是 esbuild 做开发预构建与 TS / JSX 转译、Rollup 做生产构建；Vite 7 的 `rolldown-vite` 只是可选预览。Vite 8 默认 Rolldown + Oxc：依赖优化走 `optimizeDeps.rolldownOptions`，转译走 `oxc`，生产与 Worker 走 `build.rolldownOptions` / `worker.rolldownOptions`。分包只讲 `build.rolldownOptions.output.codeSplitting`，不与旧 `manualChunks` 混用。兼容层能改写部分旧配置，不等于应继续混写两代入口。

> **模块边界：** 本模块专讲 Vite 本身：dev server、插件钩子、env、SSR、library mode、optimizeDeps、Worker、CSS 与配置环境。CI、发布、供应链、体积归因和制品晋级见 [工程化题库](/interview/questions/03-engineering)。Nuxt 的约定式路由、Nitro 与框架层 SSR 见 [Nuxt 题库](/interview/questions/23-nuxt)。

---

## 一、开发服务器、插件与预构建

### Q1. Vite 开发服务器为什么快？

**考察点：** 原生 ESM、按需转译、依赖预构建、Oxc / Rolldown 版本矩阵

::: details 参考答案

开发态不是「先打完整生产包再起静态服务器」。浏览器按原生 ESM 请求源码，Vite 只转译当前图里真正被访问的模块；未走到的路由、组件和工具不会出现在冷启动关键路径上。裸导入不能直接给浏览器，所以依赖会先预构建成 ESM，并改写成带版本查询的缓存 URL。

转译与预构建的引擎取决于主版本：Vite 2–7 默认用 esbuild 做依赖优化和 TS / JSX 转译；Vite 8 默认用 Rolldown 预构建、Oxc 转译。类型检查仍应交给 IDE 或独立的 `vue-tsc` / `tsc --noEmit`，不能绑进按文件转译。快来自按需和预构建，不是省略正确性。

:::

**追问：** 冷启动快为什么不代表大仓 HMR 会一直快？

::: details 追问参考答案

冷启动快，是因为源码按需转译、依赖已被预构建成浏览器可加载的 ESM。HMR 慢通常出在失效模块过多、插件 `transform` 扫全仓，或找不到接受边界只能整页刷新。应分别测改叶子组件、改共享工具和改入口三类路径，看更新模块数与钩子耗时。Vite 8 的 Oxc 只加快转译，不能掩盖过宽的 `handleHotUpdate` 或未缓存的字符串替换。

:::

---

### Q2. Vite 插件里 `resolveId`、`load` 和 `transform` 各做什么？

**考察点：** 解析、加载、转换、虚拟模块和钩子边界

::: details 参考答案

三个钩子按模块生命周期分工。`resolveId` 把导入说明符收成稳定 id，处理别名、扩展名、条件导出和虚拟模块；`load` 按 id 取出源码，可以读磁盘，也可以对虚拟 id 直接返回字符串；`transform` 在已有源码上改写，例如框架编译、注入、语法降级，并应返回可组合的 Source Map。

Vite 2–7 主要扩展 Rollup 插件接口，Vite 8 扩展 Rolldown 插件接口并保留较强兼容性，但并行钩子在 Rolldown 中按顺序执行。能用配置、别名或官方插件解决的，不要再写业务 `transform`。过滤 id、缓存纯转换，并为 resolve / load / transform 写集成测试。

:::

**追问：** 为什么虚拟模块不能只实现 `load`、不写 `resolveId`？

::: details 追问参考答案

`resolveId` 决定「这个导入指向谁」，`load` 决定「这个 id 的源码从哪来」。虚拟模块必须在 `resolveId` 收成带 `\0` 的内部 id，再在 `load` 按同一 id 返回内容；只写 `load` 拦文件名，后续插件仍可能当磁盘路径二次解析，虚拟源码就会丢失。要同时验证开发热更新和生产构建读到同一虚拟内容，查询参数也必须两边一致。

:::

---

### Q3. `import.meta.env` 和 `define` 有什么区别？

**考察点：** 构建期替换、`VITE_` 前缀、`envPrefix` 和静态替换边界

::: details 参考答案

`import.meta.env` 是 Vite 注入的环境对象，包含 `MODE`、`BASE_URL`、`DEV`、`PROD`、`SSR`，以及按 `envPrefix`（默认 `VITE_`）暴露的变量。它们在转译期被替换进模块，浏览器里没有真正的服务端秘密。密钥、数据库口令和高权限 token 不能靠「不写前缀」来保护。

`define` 做标识符级静态替换，适合 `__APP_VERSION__` 这类编译常量，取值应 `JSON.stringify`，避免生成非法语法。Vite 8 的 Oxc 对对象字面量不共享引用，每个替换点各有一份拷贝。`define` 也能硬塞任意字符串，因此它不是加密闸门。一次构建、多环境晋级仍应优先运行时配置，细节见 [工程化题库](/interview/questions/03-engineering)。

:::

**追问：** 为什么没有 `VITE_` 前缀的变量有时仍会出现在前端包里？

::: details 追问参考答案

前缀只约束 `import.meta.env` 的自动暴露，不约束 `define`、自己写的替换插件，或把 `process.env` 整对象序列化进客户端。改过 `envPrefix` 却仍读取 `VITE_*`，也会对不上预期白名单。应在产物里搜密钥片段，核对 `envPrefix`、`define` 和客户端入口；服务端专用值只放 Node 进程或 BFF，不要与客户端模块共用同一对象。Worker 包和 SSR 客户端入口也要同样扫一遍。

:::

---

### Q4. `optimizeDeps` 什么时候会重新预构建？

**考察点：** 裸导入图、锁文件、include / exclude、缓存失效

::: details 参考答案

预构建缓存依赖当前扫描到的裸导入图和优化输入。新装依赖、首次访问到新入口、`optimizeDeps.include` / `exclude` 变化、锁文件或包内容变化，都会让 `node_modules/.vite` 里的产物与当前解析结果对不上，从而触发 re-optimize。Vite 8 用 Rolldown 做依赖优化，旧的 `optimizeDeps.esbuildOptions` 仅由兼容层改写，应迁到 `optimizeDeps.rolldownOptions`。

中途重跑会打断正在进行的页面加载和 HMR。应对照控制台的 re-optimize 提示、`cacheDir` 和时间线定位触发源，用固定提交复现，而不是反复 `--force`。工作区链接包、CJS 包和条件导出不稳定时，优先显式 `include`。

:::

**追问：** 为什么反复删除 `node_modules/.vite` 不能当根因分析？

::: details 追问参考答案

清缓存只能逼一次完整预构建，不能说明是新入口、锁文件、`include` / `exclude` 还是包内容变了。根因要对照 re-optimize 日志、lockfile diff 和当时扫描到的裸导入。同一提交下应可复现；若只有「删了就好、过一会又坏」，多半是发现过程或链接包内容在漂。`--force` 是应急，不是诊断，更不能代替固定输入后的对比。

:::

---

## 二、SSR、库模式与资源管道

### Q5. Vite SSR 为什么默认外部化依赖？

**考察点：** `ssr.external`、`ssr.noExternal`、链接包与运行时解析

::: details 参考答案

SSR 默认把多数 npm 依赖外部化，让 Node 直接加载已发布包，避免 Vite 再转一遍，从而加快开发加载和生产 SSR 构建。需要走 Vite 管线的包——未转译的 Vue SFC、要用 Vite 特性或必须统一条件导出的包——列入 `ssr.noExternal`。工作区链接包默认不外部化，以便吃到 HMR；若要按「已发布包」测试，再写入 `ssr.external`。

`ssr.noExternal: true` 会打包全部依赖；`ssr.target: 'node'` 时 Node 内建模块仍外部化。框架层的约定式路由、Nitro 与服务器入口属于 [Nuxt 题库](/interview/questions/23-nuxt)，本题只谈 Vite 的外部化边界。

:::

**追问：** 什么时候必须把某个包放进 `ssr.noExternal`？

::: details 追问参考答案

当该包在 Node 里直接加载会失败，或客户端与服务端解析到不同入口时，就必须纳入 `ssr.noExternal`。典型是未编译的 Vue SFC、依赖 Vite 虚拟模块或插件转换、以及 `exports` 在 `node` / `browser` 条件下行为分裂的包。改完后要同时跑 `ssrLoadModule` 或框架 SSR 与浏览器水合，确认同一模块图和样式注入一致，而不是只看开发页能开。

:::

---

### Q6. library mode 应该怎样配才不会把对等依赖打进去？

**考察点：** `build.lib`、external、格式、CSS 与 UMD 边界

::: details 参考答案

库模式用 `build.lib` 指定入口、`fileName` 和 `formats`，产物给别人的打包器再消费，而不是输出带 HTML 的应用。`vue`、`react` 这类对等依赖必须 external，否则会出现双份运行时、体积膨胀和钩子失效。Vite 8 把外部化写在 `build.rolldownOptions`，不要再把长期配置放在已弃用的 `build.rollupOptions`。

CSS 通常单独抽出，由消费方导入；`package.json` 的 `exports`、`types` 和 `sideEffects` 要与真实文件名对齐。UMD / IIFE 在 Vite 8 里不再填充 `import.meta.url`，默认会变成 `undefined`，需要该值时按官方方式用 `define` 或 `output.intro` 显式补。库要同时用应用项目和 `preview` 做接入验收。

:::

**追问：** 为什么库把 Vue 打进 bundle 后，消费方会出现两个运行时？

::: details 追问参考答案

库内的 `vue` 和应用安装的 `vue` 会变成两份模块实例，组件、provide / inject 和组合式 API 不再共享同一运行时。必须把 `vue` 及 JSX 运行时写进 external，并在 `peerDependencies` 声明兼容范围。用消费方项目的模块图和运行时实例数验收，而不是只看库自己的 build 日志通过。重复打包也会让体积和 HMR 同时恶化，水合阶段更容易对不上。

:::

---

### Q7. `server.proxy` 能解决什么、不能解决什么？

**考察点：** 开发代理、Cookie、WebSocket、生产网关边界

::: details 参考答案

`server.proxy` 只作用于 Vite 开发服务器，把浏览器的同源请求转发到后端，用来绕开本地跨域、补路径前缀和转 WebSocket。常用字段是 `target`、`changeOrigin`、`rewrite`、`ws` 和 `configure`。它改的是开发时的请求出口，不会写进生产静态资源。

生产必须由 Nginx、API 网关或 BFF 提供同等路由、Cookie 域和 TLS 终止。代理能通不代表 Cookie `Path` / `Domain`、重定向 Host 和 WebSocket 升级头在生产一致。应用入口应使用相对 `/api` 或运行时下发的 origin，避免把 `localhost` 写死进客户端。

:::

**追问：** 开发代理通了，为什么预发 Cookie 登录会丢？

::: details 追问参考答案

开发代理把后端响应带回 `localhost`，浏览器按这个 Host 存 Cookie；预发是真实域名，`Domain`、`Path`、`Secure` 和 `SameSite` 只要与网关不一致就会丢。代理也不会自动复制生产的 TLS 终止和跨子域共享策略。应在目标环境核对 Set-Cookie 与文档域名，用同源相对路径或明确的运行时 origin，而不是把开发代理规则原样搬到 Nginx。

:::

---

### Q8. Vite 怎样处理 CSS Modules 和预处理器？

**考察点：** `*.module.css`、`css.modules`、预处理器选项、Lightning CSS

::: details 参考答案

`*.module.css` 走 CSS Modules，类名被哈希后作为对象导出；全局样式用普通 `.css` 或 `:global`。`css.modules` 可调命名规则，但不能靠哈希当安全边界。Sass / Less / Stylus 通过 `css.preprocessorOptions` 注入 `additionalData`、路径和静音告警；共享变量应进入明确入口，避免每个文件偷偷依赖隐式导入。

Vite 8 默认用 Lightning CSS 做 CSS 压缩，可用 `build.cssMinify: 'esbuild'` 临时回退，但需自行安装 `esbuild`。生产会按模块图做 CSS 拆分；库模式则要确认消费方如何导入抽出的 CSS。改类名哈希、预处理器 include 或压缩器前后，都要用视觉和选择器稳定性做回归。

:::

**追问：** `additionalData` 给每个 Sass 文件注入变量，有什么代价？

::: details 追问参考答案

每个样式文件都会变成「隐式依赖」那份全局片段，缓存粒度和错误栈都会变差，循环导入和重复输出也更难查。变量、mixin 应通过明确 `@use` / `@import` 进入需要它的入口，而不是给全仓打针。改这段注入会扩大 HMR 失效范围。要用「只改一个页面样式」验证更新边界，并避免把主题 token 再复制进 JS `define`。

:::

---

### Q9. Vite 里 Web Worker 应该怎么引入？

**考察点：** `new URL`、`?worker`、`worker.rolldownOptions`、模块 Worker

::: details 参考答案

推荐 `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`，让 Vite 把 Worker 当独立入口打包。也可以 `import Worker from './worker?worker'`，内联用 `?worker&inline`，SharedWorker 用 `?sharedworker`。Worker 没有 DOM，不能直接复用依赖 `window` / `document` 的应用模块。

Vite 8 用 `worker.rolldownOptions` 配 Worker 打包，旧 `worker.rollupOptions` 仅兼容。主线程与 Worker 之间只传可结构化克隆的数据，共享状态不要靠模块单例。开发用模块 Worker，生产要确认浏览器对 `type: 'module'` 的支持，并用真实消息往返验收，而不是只看主包构建成功。

:::

**追问：** 为什么把应用里的 Pinia 单例 import 进 Worker 通常是错的？

::: details 追问参考答案

Worker 是独立全局和独立模块图，主线程的 Store 实例、Vue 应用上下文和 DOM 都不存在；再 import 只会新建一份状态，两边互相看不见。应通过 `postMessage` 传递可克隆的数据或命令，把共享逻辑抽成无浏览器 API 的纯函数。验收时断言 Worker 内没有 `window`，并且连续 HMR 后端口和监听数不增长。不能把应用单例当跨线程总线。

:::

---

## 三、配置环境与升级识别

### Q10. `mode` 和 `command` 有什么不同？

**考察点：** `defineConfig` 回调、`.env.[mode]`、`serve` / `build`、`loadEnv`

::: details 参考答案

`command` 是当前 CLI 动作：`vite` / `vite dev` 为 `'serve'`，`vite build` 为 `'build'`。`mode` 是环境名，默认开发为 `development`、构建为 `production`，也可用 `--mode staging` 覆盖。`defineConfig(({ command, mode }) => {})` 里应按两者分别分支：代理、HMR 看 `command`，`.env.[mode]` 和特性开关看 `mode`。

`vite build --mode development` 仍是生产构建命令，只是加载 `.env.development`；不要用 `command === 'build'` 去判断 `import.meta.env.DEV`。需要在配置文件里读变量时用 `loadEnv(mode, envDir)`。`apply: 'serve' | 'build'` 跟的是 command，不是 mode。

:::

**追问：** 为什么 `vite build --mode development` 不会得到开发服务器行为？

::: details 追问参考答案

`--mode` 只切换环境名和对应 `.env.[mode]`，`command` 仍是 `'build'`：会走生产打包、压缩、分包和 `apply: 'build'` 的插件，不会启用开发中间件、按需 ESM 服务和 `server.proxy`。`import.meta.env.DEV` 由 mode 推导，和「是不是 dev server」不是一回事。要本地验证生产行为，应先 `vite build` 再 `vite preview`；要开发服务器并加载预发变量，才用 `vite --mode staging`。两者不能互相替代。staging 只是环境名示例，关键是不要把构建命令误认成开发服务器。

:::

---

### Q11. 依赖预构建和生产构建还差在哪里？

**考察点：** 消费路径、条件导出、CJS 互操作、`apply` 与压缩

::: details 参考答案

即使 Vite 8 用 Rolldown + Oxc 统一 bundler，开发和生产仍是两条消费路径。开发是原生 ESM 加预构建依赖，按请求转译，强调冷启动和 HMR；生产会打包、tree-shake、拆 chunk、压缩，并应用 `apply: 'build'` 的插件。Vite 2–7 还要额外面对 esbuild 预构建与 Rollup 生产的 CJS 互操作差异。

Vite 8 让 CJS default 导入规则更一致，但仍要核对 `exports` 条件、`import.meta.env`、仅构建期插件和压缩假设。本地正常、生产失败时，用同一锁文件和同一命令复现，再比失败模块的解析记录与条件导出。体积、hash 级联和发布缓存见 [工程化题库](/interview/questions/03-engineering)。

:::

**追问：** Vite 8 统一 bundler 之后，为什么还会出现「开发过、生产挂」？

::: details 追问参考答案

统一的是打包器实现，不是模块图和插件集合。开发按需加载、外部化策略和 HMR 接受边界，与生产的整图打包、压缩、`apply: 'build'` 插件仍然不同。条件导出、仅客户端模块和错误的 `ssr.external` 也会在生产才暴露。应固定提交对比 dev、`vite build` 和 `preview` 的解析日志，而不是假设 Rolldown 会消掉所有路径差。失败模块要留下解析到的真实文件。

:::

---

### Q12. 升级到 Vite 8 时如何确认已经切到 Rolldown / Oxc？

**考察点：** 主版本、changelog、兼容层、弃用警告、产物对比

::: details 参考答案

以 `vite` 包主版本、官方 changelog 和当次构建日志为准，而不是沿用「预构建一定是 esbuild、生产一定是 Rollup」。Vite 7 的 `rolldown-vite` 只是可选中间态；Vite 8 才默认 Rolldown + Oxc。升级后应看到可迁到 `oxc`、`optimizeDeps.rolldownOptions`、`build.rolldownOptions` 的弃用提示，而不是继续把兼容层当长期 API。

同一提交对比升级前后的入口清单、CSS 产物、SSR / preview 和关键页面。分包只改 `build.rolldownOptions.output.codeSplitting`，不要并行保留对象形式 `manualChunks`。复杂项目可先在 Vite 7 换 `rolldown-vite` 隔离打包器问题，再升 Vite 8。

:::

**追问：** 构建还能跑，为什么不能认定已经完成 Vite 8 迁移？

::: details 追问参考答案

兼容层会把旧 `esbuild`、`rollupOptions` 和部分 `manualChunks` 改写成 Rolldown / Oxc 配置，所以「能构建」只说明没立刻炸。真正完成迁移要看：长期配置已换新入口、弃用警告清零、对象形式 `manualChunks` 已删除，以及 dev、生产、SSR、Worker 和 preview 用同一提交回归。忽略警告会把下一次去掉兼容层变成突然事故，changelog 对不上产物。配置入口和弃用清单要写进升级检查表，不能只看构建退出码。

:::

---

## 四、深层场景题

### D1. HMR 接受边界与模块单例如何避免泄漏？

::: details 参考答案

#### 基础结论

HMR 先保证语义正确，再谈保留状态。接受边界、`dispose` 和状态迁移是一组契约；边界不清就整页刷新。模块作用域单例在热替换时会再执行一遍，旧定时器、监听和连接必须先拆掉。

#### 原理深挖

`import.meta.hot.accept` 让当前模块成为边界：更新停在这里，依赖方不重新执行。没有边界时，失效会沿着导入图向上冒泡，直到入口或整页刷新。`dispose` 在新模块生效前运行，负责关掉旧 WebSocket、清订阅、停 timer。单例若闭包在模块作用域，热替换会造出第二份实例，旧副作用还在跑，于是出现双连接或重复请求。

#### 工程场景

框架组件通常由官方集成接受；自写运行时、事件总线、WebSocket 客户端必须显式 `accept` + `dispose`，或把状态放到可迁移的外部 store。`handleHotUpdate` 只返回真正受影响的模块。用「连续保存 20 次」断言连接数、监听数和定时器不增长；无法证明安全就 `invalidate()`。

#### 反例 / 踩坑

为了保表单值吞掉不兼容更新、只推新代码不清旧监听、插件返回过宽模块集合导致全站抖动，都会把泄漏伪装成「没刷新」。页面还在不代表没有双实例。

#### 资深回答模板

我先画接受边界：谁 `accept`、谁必须 `dispose`、状态迁到哪里。单例和长连接用重复 HMR 测泄漏；边界不确定就整页刷新。正确性优先于「完全不刷新」。

:::

**追问链：**
1. 什么是 HMR 接受边界？
2. 模块单例为什么容易在 HMR 中泄漏？
3. 什么时候应该主动 `invalidate` 而不是 `accept`？

::: details 追问参考答案

**1. 什么是 HMR 接受边界？**

它是调用 `import.meta.hot.accept` 的模块：更新在此被接住，其导入方不必重执行。没有边界时，失效沿依赖图上冒，直到入口或整页刷新。边界必须能在新模块上恢复可观察行为，并在 `dispose` 里拆掉旧副作用。接不住就不要假装局部更新成功，宁可整页刷新，也不要留下半新半旧的运行时。

**2. 模块单例为什么容易在 HMR 中泄漏？**

单例活在模块作用域时，热替换会再跑一遍模块体，旧实例上的定时器、监听和连接往往还在，于是出现双连接或重复订阅。`dispose` 必须释放旧单例，或把状态迁到可接受的外部 store。连续多次 HMR 后断言连接数和监听数不增长；页面没刷新不等于没有泄漏，这是重复实例，不是缓存。

**3. 什么时候应该主动 `invalidate` 而不是 `accept`？**

当新模块无法在现有运行时上保持协议时就应 `invalidate`：导出形状变了、副作用拆不干净、单例身份必须唯一，或父模块需要按新契约重执行。一次明确刷新，比静默双实例或半新半旧状态更安全。用关键路径的可观察行为验收，而不是看控制台有没有报错。

:::

---

### D2. 虚拟模块怎样保持稳定 id，并让 Source Map 链可还原？

::: details 参考答案

#### 基础结论

虚拟模块对外用 `virtual:plugin-name/...`，对内用 `\0` 前缀避免当磁盘文件解析。`resolveId` 与 `load` 必须共享命名空间和查询参数。每个 `transform` 都要基于上一环 map 再组合自己的映射。

#### 原理深挖

`\0` 让后续解析器不再按真实路径补扩展名或读文件系统。查询参数属于 id 的一部分，漏掉就会让 importer 对不上。字符串替换若不返回 map，或只用粗糙行偏移，监控还原会指错文件。Vite 2–7 走 Rollup 插件链，Vite 8 走 Rolldown 兼容钩子；把其他类型转成 JS 时，Rolldown 可能还要求标明 `moduleType: 'js'`。

#### 工程场景

SVG 当组件、约定式路由表、本地 mock 都走虚拟模块。过滤 id、缓存纯转换，并为 resolve / load / transform / HMR 写测试。发布前用故意抛错确认栈落在原始源码。生产 map 的上传、权限和 hidden 策略见 [工程化题库](/interview/questions/03-engineering)。

#### 反例 / 踩坑

虚拟 id 不命名空间、只在 dev 实现 `load`、中间插件丢 map、用正则改业务代码却声称「行号大概对」，都会让热更新和线上还原同时失真。

#### 资深回答模板

我先固定用户 id 和内部 `\0` id，再保证 load 只认这套契约。每个 transform 都返回组合后的 Source Map，并用故意异常验收最终行号。插件要小、可关、可测。

:::

**追问链：**
1. 为什么内部 id 要加 `\0`？
2. 多个 `transform` 怎样保持 Source Map 链？
3. 虚拟模块只在开发生效、生产为空，会出什么问题？

::: details 追问参考答案

**1. 为什么内部 id 要加 `\0`？**

`\0` 是约定的「非文件」标记，阻止后续插件按磁盘路径补扩展名、读文件或再走一遍别名。用户侧仍使用 `virtual:plugin-name/...`，由 `resolveId` 收成内部 id。没有这层转换，虚拟源码和真实文件会抢同一个解析通道，HMR 与生产构建都可能读空或读错。查询参数必须和用户 id 一起保留。这是解析约定，用来隔离文件系统，不是加密。

**2. 多个 `transform` 怎样保持 Source Map 链？**

每个钩子都要读取上一环的 map，把本次改写的位置映射回去，再把组合结果交给下一环。中间有人只返回 `code` 或用固定行偏移，链就断了。Vite 8 的 Rolldown 兼容钩子同样遵守这条规则。发布前用多层转换后的栈验收原始文件名和行号，故意抛错是最直接的证据。断链后不能靠猜行号补救。

**3. 虚拟模块只在开发生效、生产为空，会出什么问题？**

开发能 import，生产构建却按磁盘路径解析失败，或打进空模块，出现「本地正常、制品报错」。`resolveId` / `load` 必须在 `serve` 与 `build` 提供同一内容，或用 `apply` 明确降级并在构建期失败。要用 `vite build` 和 `preview` 对同一虚拟 id 做回归，不能只看开发页。缺失时应该让构建失败，而不是静默空导出。开发页通过不能代替一次生产构建。

:::

---

### D3. SSR 与浏览器 API 分裂时，Vite 应该怎样隔离模块？

::: details 参考答案

#### 基础结论

同一份源码会在 Node（或 Worker）和浏览器各执行一次。能碰 `window`、`document`、`localStorage` 的逻辑必须隔离在客户端入口，用 `import.meta.env.SSR`、条件导出或显式 `.client` / `.server` 切开。框架约定见 [Nuxt 题库](/interview/questions/23-nuxt)，这里只谈 Vite 模块图。

#### 原理深挖

SSR 外部化、`resolve.conditions` 和 `ssr.resolve.conditions` 会让同一包走到 `node` 或 `browser` 不同入口。客户端单例在服务端再执行，会造成跨请求状态泄漏；服务端模块被打包进浏览器，会把 Node API 带进前端。插件钩子可按 environment 区分 client / ssr，不要假设一份 `transform` 两端通用。

#### 工程场景

访问 `window` 的代码放进 `onMounted` 或仅客户端插件；共享逻辑写成无宿主 API 的纯函数。为会分裂的依赖配置 `ssr.noExternal` 或 `ssr.external`，并用同一用例跑 `ssrLoadModule` 与水合。样式、资源 URL 和 `import.meta.env` 要在两端语义一致。

#### 反例 / 踩坑

模块顶层读 `window`、把 Pinia 单例当请求级缓存、忽略 `exports` 的 `browser` / `node` 条件、只测客户端开发页，都会在首屏水合或 Node 启动时爆炸。

#### 资深回答模板

我先标每个模块的宿主：纯逻辑、仅客户端、仅服务端。浏览器 API 不准出现在 SSR 入口；跨请求状态不准放模块单例。用外部化配置和两端集成测试锁住解析结果。

:::

**追问链：**
1. 为什么模块顶层不能读 `window`？
2. 服务端单例为什么会串请求？
3. 条件导出导致两端行为不同时先查什么？

::: details 追问参考答案

**1. 为什么模块顶层不能读 `window`？**

SSR 加载模块时就会执行顶层代码，此时没有浏览器全局，直接抛错；即便用可选链逃过，水合仍可能和客户端首次求值不一致。浏览器 API 只能放进客户端入口、`onMounted` 或明确的 `.client` 模块。要用 Node 侧 `ssrLoadModule` 和浏览器首屏各跑一遍同一入口验收，两边导出形状也必须一致。模块顶层的宿主副作用最危险。

**2. 服务端单例为什么会串请求？**

模块作用域在进程内长期存活，A 请求写入的用户、Cookie 或 Store 会被 B 请求读到。SSR 下应按请求创建上下文，并在结束时释放。开发 HMR 还会让单例再实例化一次，掩盖泄漏。用并发两个会话的集成测试断言状态键包含请求 id，而不是看单次请求碰巧正确。跨请求复用只能留给无用户数据的只读缓存。

**3. 条件导出导致两端行为不同时先查什么？**

先打印该包在 client 与 ssr 环境解析到的真实文件，对照 `package.json` 的 `exports`、`browser` 和 `ssr.resolve.conditions`。再决定是改 `ssr.noExternal`、加别名，还是换不分裂的入口。不要只在浏览器里看开发页通过；Node 侧加载失败或水合 mismatch 才是分裂的典型症状。两端文件路径不一致时，先锁解析再改业务，不要先写兼容补丁。打印出的真实文件才是证据。

:::

---

### D4. 依赖预构建如何处理 CJS / ESM 混用？

::: details 参考答案

#### 基础结论

预构建的核心工作之一，是把浏览器看不懂的裸导入和 CJS / UMD 依赖收成可缓存的 ESM。Vite 8 用 Rolldown 做这件事，并统一了 default 导入规则；Vite 2–7 则是 esbuild 预构建对上 Rollup 生产，互操作更容易漂。

#### 原理深挖

CJS 的 `module.exports` 与 ESM `default` 并不一一对应。Vite 8 按 importer 是否为 ESM、以及 importee 的 `__esModule` 决定 default 指向整个 exports 还是 `.default`。开发预构建会重写 URL 并强缓存；生产则按整图打包。两端规则更接近，仍可能因条件导出、仅 CJS 包或错误的 `optimizeDeps.exclude` 分叉。

#### 工程场景

纯 CJS 依赖、带奇怪 `exports` 的包和链接工作区包，优先写进 `optimizeDeps.include`。需要保留原始 CJS 语义时看官方互操作说明，而不是手写一层 `default ?? module`。用同一导入语句对比 dev 与 production build 的运行结果，并在升级后重跑这些包。

#### 反例 / 踩坑

把会炸的包 `exclude` 掉却不给浏览器 ESM、用兼容层维持旧 esbuild 假设、或用 `legacy.inconsistentCjsInterop` 长期掩盖，都会把下一次升级变成事故。

#### 资深回答模板

我先报版本：Vite 8 预构建是 Rolldown，CJS default 规则以官方互操作文档为准。对可疑包显式 `include`，用同一导入对比 dev / build，不为了消告警而永久打开遗留开关。

:::

**追问链：**
1. 为什么 CJS 包常被放进 `optimizeDeps.include`？
2. Vite 8 的 default 导入规则相对以前稳在哪里？
3. `optimizeDeps.exclude` 用错会怎样？

::: details 追问参考答案

**1. 为什么 CJS 包常被放进 `optimizeDeps.include`？**

浏览器不能直接 `import` CJS。预构建会把它收成 ESM 并改写 URL；显式 `include` 避免等扫描到才重跑，也避免漏扫导致运行时语法错误。链接包和带副作用的入口同样需要提前声明。改完后看冷启动是否还触发中途 re-optimize，以及该包在开发页能否同步加载。这是稳定输入，不是加速技巧。

**2. Vite 8 的 default 导入规则相对以前稳在哪里？**

开发预构建和生产打包不再各用一套「什么时候 default 等于整个 `module.exports`」的启发式，而是按 importer 模块类型和 `__esModule` 对齐。这能消掉一类「dev 能跑、build 取到 `undefined`」的问题。仍要以官方互操作说明核对具体包，必要时给上游提修，而不是在业务里写一堆兼容分支。遗留开关只能当短期逃生舱。

**3. `optimizeDeps.exclude` 用错会怎样？**

被排除的依赖保持原始形态进入浏览器。若它是 CJS、依赖 Node 内建或需要 Vite 转换，开发页会直接语法错误或解析失败。`exclude` 只适合已经是浏览器 ESM、且要跟源码一起走插件的包。排除后必须用真实页面加载验证，不能只看预构建日志变短。排除名单要写进评审，避免后人当默认优化。

:::

---

### D5. Rolldown 分包和持久化缓存应该怎样验收？

::: details 参考答案

#### 基础结论

Vite 8 分包只使用 `build.rolldownOptions.output.codeSplitting`，用 groups 等规则表达分组，不与旧 `manualChunks` 混写。持久化缓存要分清两层：`cacheDir` 里的依赖预构建缓存，以及 Rolldown 解锁的模块级持久化缓存能力。具体开关以目标版本官方文档为准。

#### 原理深挖

对象形式 `manualChunks` 在 Vite 8 已移除，函数形式已弃用。人工分组应在默认分割不够、且有瀑布与缓存证据之后再做。公共 chunk 内容变化会改哈希，引用它的异步块即使业务未改也会换名，这是缓存级联。预构建缓存失效看裸导入图；模块级缓存失效看源文件、配置和插件输入是否变了。

#### 工程场景

先记录 Vite 版本，用路由覆盖和网络瀑布看首屏、缓存命中和重复模块。只改 `codeSplitting` 一代配置，保留 manifest 做归因。二次构建应对比耗时、失效模块范围和 chunk 清单；清 `cacheDir` 只能验证预构建层。浏览器长期缓存策略、CDN 和回滚见 [工程化题库](/interview/questions/03-engineering)。

#### 反例 / 踩坑

把 Vite 7 的 `manualChunks` 示例贴进 Vite 8、同时写两代入口、按 npm 包无限碎分，或把「删 `.vite` 变快了」说成模块级缓存已生效，都会误判。

#### 资深回答模板

我先报版本：Vite 8 只用 `build.rolldownOptions.output.codeSplitting`。默认分割优先，人工 groups 用瀑布和二次访问命中率验收；缓存则分开看 `cacheDir` 与 Rolldown 模块级失效范围。

:::

**追问链：**
1. 为什么不能继续用 `manualChunks` 讲 Vite 8 分包？
2. `cacheDir` 和模块级持久化缓存有何不同？
3. 如何证明一次分组没有造成哈希级联？

::: details 追问参考答案

**1. 为什么不能继续用 `manualChunks` 讲 Vite 8 分包？**

对象形式已被移除，函数形式已弃用；Rolldown 的稳定入口是 `build.rolldownOptions.output.codeSplitting`。兼容层能跑不等于长期接口。混写两代配置会让下次升级无法解释产物变化。分组规则、验收和回滚都应落在 `codeSplitting` 上，并用 manifest 对照 groups 是否生效。面试里也不要再把 `manualChunks` 当 Vite 8 答案，旧文档示例不能直接粘贴进新配置。

**2. `cacheDir` 和模块级持久化缓存有何不同？**

`cacheDir`（默认 `node_modules/.vite`）主要存依赖预构建和部分 Vite 缓存，`--force` 或删目录会整层重建。Rolldown 的模块级持久化缓存按模块输入复用未变化的图，能力与开关以目标版本文档为准。不能把「删 `.vite` 后冷启动变慢」直接当成模块级缓存命中证据。两层失效条件不同，排查时要分开复现，混为一谈会查错层。

**3. 如何证明一次分组没有造成哈希级联？**

固定业务提交，只改分组配置，对比 manifest 里异步 chunk 的文件名和内容哈希。若业务文件未变、只因公共包换名而大面积失效，就是级联。应缩小共享面或按变更频率拆组，并用二次访问的缓存命中率验收，而不是只看主包变小。每次只改一代 `codeSplitting` 配置，级联要用清单对照，不能口头估计。

:::

---

### D6. 插件顺序和 `enforce` 怎样决定转换结果？

::: details 参考答案

#### 基础结论

同一钩子内顺序是 `enforce: 'pre'` → Vite 核心插件 → 普通用户插件 → `enforce: 'post'`。`apply` 决定插件是否进入 `serve` 或 `build`。顺序错了往往构建成功、运行错误。

#### 原理深挖

`transform` 不是幂等的：上一环输出是下一环输入。要看原始源码的插件必须 `pre`；要看 Vite 已替换 `import.meta.env`、已处理 CSS 或已改写资源 URL 的插件必须 `post`。Vite 核心插件之间不能随意插队。Rolldown 把部分 Rollup 并行钩子改成顺序执行，更不能靠「碰巧并行」掩盖依赖。

#### 工程场景

用 `vite-plugin-inspect` 看开发态每个模块的转换链，再用构建日志核对 `apply: 'build'` 的插件是否出现。别名解析、虚拟模块和框架编译通常 `pre`；统计注入、最终校验和上传辅助常 `post`。集成测试应锁定输入源码、中间产物和最终字符串。

#### 反例 / 踩坑

两个插件互改对方输出却不声明顺序、用 `pre` 去补核心插件之后才存在的 id、以及只在开发注册却在生产缺失，都会造成「inspect 里对、制品里错」。

#### 资深回答模板

我先问插件要看的是原始源码还是 Vite 处理之后的图，再选 `pre` / 默认 / `post` 和 `apply`。用 inspect 和同一模块的构建产物对照顺序，不为了「能跑」交换两个不兼容的 transform。

:::

**追问链：**
1. `enforce: 'pre'` 和数组里靠前有何不同？
2. 为什么 `apply` 不能用 `mode` 代替？
3. 如何证明某个 transform 跑在 Vite 核心之后？

::: details 追问参考答案

**1. `enforce: 'pre'` 和数组里靠前有何不同？**

数组顺序只在同一 `enforce` 分组内生效。`pre` 会排到 Vite 核心插件之前，普通插件再靠前也到不了核心前面。要改原始 TS / Vue 源码用 `pre`；要看核心处理后再动手，应默认或 `post`。调试时同时看 `enforce` 和数组位置，不要只把插件往上挪。核心插件彼此之间也不能靠数组插队，分组比位置更优先。

**2. 为什么 `apply` 不能用 `mode` 代替？**

`apply` 跟 `command`：`serve` 是开发服务器，`build` 是生产打包。`mode` 只是环境名，`vite build --mode development` 仍应跑构建插件。用 mode 开关代理或 HMR，会在预发构建里误开开发行为，或在开发里丢掉构建期校验。分支时先看 command，再按 mode 读 env。两者混用是配置里最常见的误判。command 决定走哪条管线，mode 只决定加载哪套环境文件，两者职责不能对调。

**3. 如何证明某个 transform 跑在 Vite 核心之后？**

在开发用 inspect 看该模块的转换时间线：核心的 env 替换、CSS 和资源改写应出现在你的钩子之前。生产再对比同一文件构建产物，确认 `apply: 'build'` 的插件也在核心之后生效。若你的正则仍匹配到未替换的 `import.meta.env`，说明还在核心前面，应改为 `post` 或接受默认分组。两套证据都要留下，不能只看开发。

:::

---

### D7. 环境变量怎样在 Vite 客户端泄漏，又如何验收？

::: details 参考答案

#### 基础结论

打进客户端模块的值都可被看见。`VITE_` / `envPrefix` 只是自动暴露白名单，不是加密。泄漏来自错误前缀、`define` 硬塞、把服务端 env 对象序列化进前端，或 Source Map 带上源码里的密钥。

#### 原理深挖

`import.meta.env` 在转译期替换；没有前缀的变量默认不会出现在该对象上，但 `define`、自写插件和错误的 `loadEnv` 用法仍能注入。库的 UMD 产物、Worker 包和 SSR 客户端入口都是独立替换单元，漏扫一个就会漏。`hidden` Source Map 不写引用，不等于 map 文件里没有源码。

#### 工程场景

客户端只保留可公开的 API origin、功能开关和 client id。配置文件用 `loadEnv` 后按前缀挑字段，不要 `JSON.stringify(process.env)`。对 `dist`、Worker 和内联脚本搜密钥片段；预发构建用假密钥做一次泄漏扫描。运行时多环境配置和密钥治理见 [工程化题库](/interview/questions/03-engineering)。

#### 反例 / 踩坑

以为不写 `VITE_` 就安全、用 `define` 塞私钥、把 `.env.production` 提交进仓库、或只扫主包不扫 Worker / 虚拟模块，都是假安全。

#### 资深回答模板

我把「能出现在浏览器的值」当公开数据处理。白名单只走 `envPrefix`，`define` 只放编译常量，产物和 map 都要搜敏感片段。密钥留在 BFF 或 CI secret。

:::

**追问链：**
1. `envPrefix` 改成 `APP_` 之后还要注意什么？
2. 为什么 Source Map 也会泄漏环境变量？
3. 如何在 CI 里做最小泄漏扫描？

::: details 追问参考答案

**1. `envPrefix` 改成 `APP_` 之后还要注意什么？**

自动暴露集合会变成 `APP_*`，原来的 `VITE_*` 不再进入 `import.meta.env`，业务代码和第三方插件若仍读旧名字会得到 `undefined`。文档、类型声明和 `.env*` 要一起改。前缀变化不自动保护旧密钥：它们仍可能经 `define` 或历史产物留下。要用新前缀打一次包，并搜旧前缀是否还在客户端。Worker 和 HTML 内联脚本也要扫。

**2. 为什么 Source Map 也会泄漏环境变量？**

替换发生在转译后，但 map 若包含 `sourcesContent` 或未替换的原文，密钥仍可能出现在 `.map` 里。`hidden` 只是不在 JS 末尾写引用，文件本身还在 `dist`。应对客户端包和 map 都做敏感词扫描，生产 map 只上传受控监控后台，不随 CDN 公开。上传后要从镜像和静态目录删掉本地 map。公开 CDN 上的 map 等于公开源码和其中的替换前文本。

**3. 如何在 CI 里做最小泄漏扫描？**

在构建后的 `dist`、Worker 和内联 HTML 里搜已知密钥名、私钥头和内网域名；测试构建注入可识别的假密钥，断言它不得出现在客户端产物。扫描要覆盖 sourcemap 和虚拟模块生成的文件。失败应阻断发布，而不是只靠 code review 看 `.env` 文件名。扫描名单要和密钥轮换一起维护。假密钥必须能被唯一检索到。

:::

---

### D8. 多入口和 Monorepo 在 Vite 里怎样共用解析、又不串缓存？

::: details 参考答案

#### 基础结论

多入口共享一套解析别名和插件，但每个入口有自己的模块图和预构建输入。Monorepo 还要处理链接包、`server.fs.allow` 和包管理器 hoisting。不能假设一个 `cacheDir` 适合所有包。

#### 原理深挖

多个 HTML 或多 `build.rolldownOptions.input` 会扩大扫描到的裸导入，从而改变 `optimizeDeps` 结果。工作区包默认可能被当成源码（SSR 不外部化、开发走 HMR），也可能因解析到 `node_modules` 里的旧构建物而看不到源码。`server.fs.allow` 决定开发服务器能否读出根目录以外的文件；过宽会暴露仓库外内容。

#### 工程场景

应用包显式 `optimizeDeps.include` 链接库，库本身用 library mode 出 ESM。需要 Vite 转换的工作区包加入 `ssr.noExternal`。每个可独立开发的包使用自己的 `cacheDir` 或在命令里隔离。改库源码后，用应用入口的 HMR 和一次生产构建确认没有打到过期 `dist`。

#### 反例 / 踩坑

所有包共用一份预构建缓存、只允许读到半个 workspace、把库的 Vue 打进应用又没 external，或用不同 `mode` 却共用同一优化目录，都会出现「改了库没变化」或中途 re-optimize。

#### 资深回答模板

我先画入口和包边界：谁是应用、谁是库、谁要走 Vite 转换。链接包显式 include / noExternal，文件系统白名单收紧到 workspace，缓存按包隔离。用「改库一行」验收应用 HMR 与生产解析。

:::

**追问链：**
1. 为什么链接的 workspace 包有时改了源码却看不到更新？
2. `server.fs.allow` 过宽有什么风险？
3. 多个应用包能否共用一个 `optimizeDeps` 缓存？

::: details 追问参考答案

**1. 为什么链接的 workspace 包有时改了源码却看不到更新？**

解析可能打到包的 `dist` 或 `exports` 里的构建入口，而不是源码；预构建也可能缓存了旧内容。应让开发解析到源文件，并把该包列入 `optimizeDeps.include` 或按需 `exclude` 后走源码插件。改一行后看应用 HMR 是否命中源文件，生产构建则确认没有打进过期产物。链接方式和 `preserveSymlinks` 也要对齐。先确认解析到的真实路径，再谈缓存。

**2. `server.fs.allow` 过宽有什么风险？**

开发服务器会按请求读出白名单内的文件。放宽到整个家目录或盘符，等于把本地邻接仓库、env 和密钥文件暴露给能访问 dev server 的人。应只允许当前 workspace 根和明确的共享包路径，并避免把 dev server 监听到不可信网络。用一次越界 URL 验收应返回拒绝而不是文件内容。默认收紧，缺哪个包再加哪条。

**3. 多个应用包能否共用一个 `optimizeDeps` 缓存？**

只有裸导入图、`include` / `exclude`、锁文件和插件输入完全一致时才可能复用；否则会错用另一应用的预构建结果，引发中途 re-optimize 或运行时导出不对。默认按包使用独立 `cacheDir`。所谓加速要用同一包连续冷启动对比，而不是把整个 Monorepo 指到同一个 `.vite`。共享缓存必须先证明输入哈希相同。

:::
