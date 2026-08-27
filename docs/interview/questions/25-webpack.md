# Webpack 面试题库

> **怎么用：** 普通题按「编译图 → 解析规则 → 产物与缓存 → 选型证据」口述 1～2 分钟；深层题按「风险 → 机制 → 验收指标 → 失败归因 → 迁移边界」展开。本篇按 **Webpack 5** 口径：资源模块（asset modules）、持久化缓存，以及 Webpack 5 内置 Module Federation 与独立 Module Federation 2.0 必须分开讲。微前端运行时、`shared` 协商与故障边界见 [微前端](/interview/questions/12-microfrontend)；本文件只讲打包原理、何时还用 Webpack，以及与 Vite / Rspack 的对比。

---

## 一、编译图、解析与产物

### Q1. Webpack 5 的编译流程里，loader 和 plugin 各负责什么？

**考察点：** Compiler / Compilation、loader 管道、Tapable 钩子和职责边界

::: details 参考答案

Compiler 读取配置后创建 Compilation。`make` 阶段从入口解析依赖并构建模块图：每个模块先经 resolver 定位，再进入 loader 管道变换源码，然后由解析器抽出依赖并继续走图；图闭合后进入 `seal`，做树摇、分包、模块编号、哈希和运行时代码生成，最后 `emit` 写出资源。

loader 只变换**单个模块**的源码，配置数组从右到左执行，`pitch` 则从左到右并可短路。plugin 通过 Tapable 钩子挂到 Compiler / Compilation 生命周期，可以改模块图、chunk、资源和运行时，不应再承担「把 Less 编成 CSS」这类单文件变换。面试要能指出当前问题落在哪一阶段，而不是背钩子名单。

:::

**追问：** 为什么配置数组里靠后的 loader 会先执行？

::: details 追问参考答案

这是管道约定：最右侧 loader 先看到磁盘上的原始文件，最左侧产出接近模块图的 JavaScript。把 `less-loader` 放右边先编译，把 `css-loader` 放中间解析 `@import`，把转译放左边。`pitch` 阶段相反，从左到右，可提前短路。只背「从右到左」不够，还要说清每层输入输出，以及中间 Source Map 有没有继续往下传。面试时最好能随手画出这一条管道。

:::

---

### Q2. Webpack 5 如何解析模块路径？和 Node 有何不同？

**考察点：** enhanced-resolve、`exports`、条件导出、完全指定 ESM 和 `fallback`

::: details 参考答案

Webpack 用 enhanced-resolve，而不是把请求原样交给 Node。相对路径和绝对路径按文件系统走；裸导入会查 `resolve.modules`（默认 `node_modules`），并应用 `alias`、`extensions`、`mainFields` 和 `conditionNames`。Webpack 5 会读取 `package.json` 的 `exports` / `imports`，按 `import`、`require`、`webpack`、`browser` 等条件选入口，因此同一包在浏览器构建和 Node 构建可能落到不同文件。

ESM 在 Webpack 5 里常要求完全指定扩展名；Webpack 5 也不再自动注入 Node 核心模块 polyfill。浏览器里要模拟 `path` 或 `buffer`，必须显式写 `resolve.fallback`，并评估体积与许可证。解析失败应先看请求字符串、issuer、条件导出和别名，而不是先删 `node_modules`。

:::

**追问：** 什么时候才应该配置 `resolve.fallback`？

::: details 追问参考答案

只有浏览器产物确实调用了 Node 核心模块，并且没有浏览器替代实现时才配 `fallback`。Webpack 5 去掉自动 polyfill，是避免无意识打进巨大垫片。先改调用方改走 Web API 或服务端，确认必须垫时再按模块逐个引入，并验收体积。不要复制一份「全量 Node fallback」模板；错误 polyfill 还会造成行为与 Node 不一致的线上差异。

:::

---

### Q3. 代码分割和 runtime chunk 分别解决什么问题？

**考察点：** `import()`、`splitChunks`、运行时清单和长期缓存

::: details 参考答案

代码分割把模块图切成可按需加载的 chunk：多入口、动态 `import()` 和 `optimization.splitChunks` 是三条主路径。`splitChunks` 按复用次数、体积和下请求数抽公共模块，降低重复下载；动态导入按路由或特性推迟执行。分包是否成功，要用产物清单和网络瀑布验证，而不是只看配置项名称。

runtime chunk 抽出 Webpack 运行时：模块缓存、`__webpack_require__`、chunk 加载映射和 HMR 客户端。若不抽出，入口文件会内嵌这份映射；任何异步 chunk 增删都会改入口内容哈希，长期缓存失效。`runtimeChunk: 'single'` 让多入口共享一份运行时，但多页应用要确认不会串用错误清单。runtime 负责加载协议，不负责业务拆包。

:::

**追问：** 不抽 runtime chunk 时，为什么入口哈希会经常变？

::: details 追问参考答案

运行时里写着当前要加载的 chunk 名和哈希对照。新增路由异步块、公共包改名或拆包结果变化，都会改这份对照表。对照表若留在入口，入口字节变化，内容哈希跟着变，即使用户只访问未改页面也会重新下载入口。抽出 runtime 后，入口业务代码可保持稳定，变化集中到体积很小的 runtime 文件。要用连续两次构建的 manifest 对比，而不是凭感觉说「哈希乱跳」。

:::

---

### Q4. Webpack 5 做 tree shaking 需要哪些条件？

**考察点：** ESM 静态结构、`usedExports`、`sideEffects` 和内部图分析

::: details 参考答案

有效摇树首先要求静态 ESM `import` / `export`，让打包器在编译期看见导出是否被使用。`mode: 'production'` 会打开 `usedExports`、内部图分析（innerGraph）和模块拼接（scope hoisting）：先标记未使用导出，再在模块内部追踪赋值是否逃逸，最后把可内联模块连成更少的闭包。CommonJS 的动态 `require` 和可变 `exports` 分析弱，不能假设会被动摇掉。

第二个条件是副作用信息可信。`package.json` 的 `sideEffects: false` 允许直接跳过未被引用的文件；若包在导入时注册 polyfill、改全局或引入 CSS，必须改成精确的 glob 列表，否则样式和初始化会丢。`/*#__PURE__*/` 只帮助压缩器删除纯计算调用，不能代替 `sideEffects`。验收应看产物里符号是否消失，而不是看配置开关是否打开。

:::

**追问：** 为什么 `sideEffects: false` 会导致样式丢失？

::: details 追问参考答案

该标记告诉 Webpack：这个包里没被引用的文件都可以整文件删掉。只写 `import 'pkg/style.css'` 或依赖包入口顺带导入样式时，若 CSS 文件被当成无副作用，就不会进入模块图，最终 CSS 提取不到规则。正确做法是把 `*.css`、`*.scss` 或明确的初始化文件列入 `sideEffects`，再对比提取后的样式和视觉回归。不要为了体积数字给业务包一刀切 `false`。

:::

---

### Q5. Webpack 5 的 asset modules 如何替代 url-loader 和 file-loader？

**考察点：** `asset/resource`、`asset/inline`、`asset/source` 和自动阈值

::: details 参考答案

Webpack 5 用内置资源模块承接静态文件，不必再为常见图片、字体安装 `file-loader`、`url-loader` 或 `raw-loader`。`asset/resource` 发出独立文件并导出 URL，对应 file-loader；`asset/inline` 做成 data URL，对应 url-loader；`asset/source` 导出源字符串，对应 raw-loader；`asset` 按 `parser.dataUrlCondition.maxSize` 在文件和内联之间自动选择。

输出文件名用 `generator.filename`，公共路径仍走 `output.publicPath`。从 Webpack 4 迁过来时，要同时删掉旧 loader 规则，避免同一文件被处理两次。资源模块解决的是「文件怎么变成模块导出」，并不替代需要编译的 loader，例如 SVG 转 React 组件、雪碧图或图片压缩仍要专用 loader 或插件。

:::

**追问：** 什么时候还不能只用 asset modules？

::: details 追问参考答案

当文件需要先变换语义再交给打包器时，资源模块不够。SVG 要转成框架组件、图片要做压缩或精灵图、字体要做子集，这些步骤仍依赖专用 loader 或插件，资源模块只负责最终发出文件或 data URL。应先画「变换还是发出」：纯拷贝和按体积内联用 `asset`，有 AST 或编码变换就留在 loader 链，并确认不要让旧 `file-loader` 与 `type: 'asset'` 叠在同一规则上。

:::

---

## 二、开发、缓存与构建器选型

### Q6. development 和 production 模式差在哪些默认行为？

**考察点：** `mode`、压缩与树摇、模块 ID、dev server 和验收环境

::: details 参考答案

`mode` 会一次性打开一组默认优化，而不是只改 `process.env.NODE_ENV` 字符串。`production` 默认开启压缩、真实内容哈希、`usedExports`、内部图分析、模块拼接，以及确定性的 module / chunk ID，追求可缓存、可复现的最小产物。`development` 保留可读模块名、更便宜的 Source Map，关闭压缩和激进拼接，让重建和堆栈服务调试。

`webpack-dev-server` 默认在内存中提供资源并配合 HMR，不能代表生产体积、哈希稳定性和 CDN 缓存。性能、分包和 Source Map 策略必须用与 CI 相同的 production 命令验收。`mode: 'none'` 关闭全部默认，只适合完全自管优化的场景；日常项目应显式选择 development 或 production，避免「一半像开发、一半像生产」的混合配置。

:::

**追问：** 为什么不能用 dev server 的产物判断生产体积？

::: details 追问参考答案

开发服务为了重建速度，通常不压缩、不拼接模块、使用命名 ID 和廉价 Source Map，异步块边界也常与生产 `splitChunks` 不一致。内存中的资源没有真实内容哈希和 CDN 路径，体积和请求数都会偏大或偏怪。体积、缓存命中和首屏瀑布必须用 CI 同款 production 构建加 visualizer、manifest 对照。dev server 只证明开发期能否跑通，不能当发布证据。

:::

---

### Q7. Webpack 5 持久化缓存什么时候会失效，什么时候不该失效？

**考察点：** `cache.type: 'filesystem'`、`buildDependencies`、snapshot 和缓存键

::: details 参考答案

`cache: { type: 'filesystem' }` 把模块构建结果写到磁盘，避免每次冷启动重做 loader。合法失效应来自：Webpack 版本变化、配置被声明为 `buildDependencies`、`cache.version` / `cache.name` 变化，以及被 snapshot 盯住的文件内容变化。`node_modules` 默认落在 `snapshot.managedPaths`，打包器按包身份视为稳定，而不是每次都深扫文件。

不该失效却失效，通常是缓存名没隔离 `mode`、把无关环境变量写进 `version`，或 CI 缓存键包含了易变路径。该失效却命中，通常是改了配置却没把配置文件列入 `buildDependencies`，或手工改了 `node_modules` 却没改版本。面试要能说出「谁被当成输入、谁被当成不可变」，而不是只会删 `.cache`。

:::

**追问：** 改了 webpack 配置却仍命中旧缓存，缺了什么？

::: details 追问参考答案

文件系统缓存不会自动把所有配置来源算进哈希。主配置必须写入 `buildDependencies.config`，被 `require` 的拆分配置、loader 选项文件和会改变变换结果的环境也要进入 `version` 或依赖列表。只改未被声明的文件时，snapshot 认为输入没变，就会复用旧模块。修复后用一次故意改 loader 选项验证会失效，再确认无关改动仍能命中，避免从此靠删缓存开发。

:::

---

### Q8. Webpack 5 常见 Source Map 类型该如何选择？

**考察点：** `devtool`、cheap / module / hidden / nosources 和生产泄漏

::: details 参考答案

`devtool` 决定映射精度和重建成本。`eval-*` 把模块包进 `eval`，重建快、质量差；`cheap` 省略列信息；带 `module` 才会把 loader 链之前的 TypeScript、Vue 或 Babel 源码纳入映射。开发期常见平衡是 `eval-cheap-module-source-map`：能跳回原始源，又不付完整列映射的重建税。

生产不要把带源码的 map 公开到 CDN。`hidden-source-map` 生成独立 `.map` 但不写 `sourceMappingURL`，便于 CI 上传监控平台后从发布目录删除；`nosources-source-map` 保留行列映射、去掉 `sourcesContent`，降低源码全文泄漏，但仍可能暴露路径。`inline-*` 会显著撑大可下载体积，不适合生产。还原必须绑定同一次构建的制品和 release，不能事后重打一个 map 冒充。

:::

**追问：** `cheap` 和 `module` 分别牺牲或保留了什么？

::: details 追问参考答案

`cheap` 牺牲列映射，只保证行级跳转，换更快的生成和更小的 map；堆栈停在压缩后的同一行时，定位会变粗。`module` 保留 loader 之前的原始源，否则你看到的是 Babel 或 vue-loader 输出的中间 JS，和仓库行号对不上。开发期通常两个都要：`cheap` 控成本，`module` 保原始文件。生产排障需要精确列时，再用完整 `source-map` 或 `hidden-source-map`，而不是把 eval 地图上传监控。

:::

---

### Q9. Webpack HMR 的更新是怎样落到模块上的？

**考察点：** 推送哈希、hot-update、`module.hot.accept` 和冒泡刷新

::: details 参考答案

开发服务器在重新编译后通过 WebSocket 推送本次编译哈希。客户端再请求对应的 `hot-update.json` 和 `hot-update.js`，运行时用新的模块工厂替换旧工厂。若模块或其祖先调用了 `module.hot.accept`，就在约定边界替换并执行 dispose / accept 回调；CSS 经 `style-loader` 一类实现通常自接受。没有任何边界接受时，更新冒泡到入口，最终整页刷新。

HMR 是开发期的模块替换协议，不保证应用状态可迁移。持有旧闭包、未 dispose 的定时器、已创建的客户端或订阅，都可能在替换后继续跑。业务代码要在 accept 边界重置状态，或承认该类改动只能刷新。不要把 HMR 成功当成生产热更新方案，生产模块替换是另一套发布与版本问题。

:::

**追问：** 为什么有的文件改动能 HMR，有的只能整页刷新？

::: details 追问参考答案

运行时从被改模块沿依赖父级查找 accept 边界。叶子模块或 CSS 常自接受，所以只换局部；没有 `module.hot.accept` 的入口、插件初始化或改了运行时契约的文件，会一直冒泡到根，只能整页刷新。框架 loader 会给组件补接受，但改到 bootstrap、路由表或全局单例时仍可能失败。应先看是谁接受、dispose 有没有清副作用，而不是先怀疑 WebSocket 断了。

:::

---

### Q10. 新项目或存量项目，如何在 Webpack 和 Vite 之间选型？

**考察点：** 开发模型、生态锁定、Module Federation、验收证据和迁移成本

::: details 参考答案

先比开发模型和约束，而不是比口号。Vite 开发期以原生 ESM 加载源码，依赖预构建加速冷启动，生产在 Vite 2–7 走 Rollup、在 Vite 8 走 Rolldown；HMR 通常更细、配置更少。Webpack 5 在开发和生产都走同一套模块图，loader / plugin 生态更旧更全，内置 Module Federation，适合已经绑在 Webpack 插件或联邦协议上的仓库。

新项目若没有 Webpack 专有插件或联邦硬约束，优先 Vite，用构建时间和交互证据说话。存量 Webpack 5 若生产稳定、自定义 loader 多，应先问「当前痛的是冷启动、HMR 还是 CI」，再决定留下、换 Rspack 或迁 Vite。不要为了简历迁栈。微前端机制不在本题展开，需要联邦运行时细节时转到 [微前端](/interview/questions/12-microfrontend)。

:::

**追问：** 已有大型 Webpack 5 项目是否应该立刻迁到 Vite？

::: details 追问参考答案

通常不应该立刻整仓迁移。先量化痛点：冷启动、HMR、CI 分钟数、插件锁定和联邦协议。若主要是构建速度且配置要兼容 Webpack，Rspack 往往比改写到 Vite 更短。若团队已在新应用用 Vite，可让新入口先走 Vite，核心仓待 loader 有替代后再迁。没有产物对照、运行时烟测和回滚方案的大迁移，风险高于收益。

:::

---

### Q11. Rspack 和 Rolldown 分别提供怎样的替代路径？

**考察点：** Webpack 兼容面、Vite 8 管线、插件可移植性和分阶段迁移

::: details 参考答案

Rspack 瞄准 Webpack 兼容：配置、loader 和一部分 plugin 能沿用，用 Rust 换构建时间，适合「还要 Webpack 心智，但受不了 JS 打包器速度」的仓库。迁移先对照官方兼容表，处理依赖 Webpack 内部钩子或未实现特性的插件，再用同一提交对比产物清单、运行时行为和 CI 耗时。它不是 100% 兼容承诺，但路径是替换打包器，而不是改写应用组织方式。

Rolldown 瞄准 Rollup 兼容，是 Vite 8 默认生产与统一 bundler 方向，不接受一份 Webpack 配置当输入。走 Rolldown 意味着进入 Vite 管线：开发期 ESM、插件是 Vite / Rolldown 接口，分包配置也不能照搬 `splitChunks`。两条路不要混谈：要留 Webpack API 就评估 Rspack；要换开发模型就评估 Vite 8 / Rolldown。Module Federation 在各打包器上的集成深度不同，机制细节仍看 [微前端](/interview/questions/12-microfrontend)。

:::

**追问：** 为什么迁 Rspack 通常比迁 Vite 的阻力更小？

::: details 追问参考答案

Rspack 尽量吃现有 `webpack.config`、loader 链和团队对模块图、`splitChunks`、`devtool` 的知识，变更集中在兼容缺口和构建速度。迁 Vite 要换开发服务器、插件接口、环境变量和环境心智，生产分包模型也不再是 `splitChunks`。阻力小不等于一定选 Rspack：新项目若没有 Webpack 资产，直接 Vite 更干净。用同一提交的配置改动量、失败插件数和产物差异来证明。

:::

---

## 三、深层场景题

### D1. 循环依赖和副作用标记会怎样联手破坏摇树？

::: details 参考答案

#### 基础结论

循环依赖让模块在求值完成前被读取，导出可能是未初始化绑定；错误的 `sideEffects` 则让打包器删掉「看起来没人用、实际上有全局效果」的文件。两者叠加时，轻则运行时 `undefined`，重则 CSS、polyfill 或注册逻辑消失，而且 production 才显现。

#### 原理深挖

Webpack 把模块包进工厂函数，循环时会先登记再执行，ESM 绑定是活的，但仍受暂时性死区约束；CJS 则可能拿到不完整的 `exports`。摇树依赖静态导入和副作用表：`sideEffects: false` 允许跳过未被引用的文件，并不分析你在循环里「稍后才会用到」的隐式初始化。内部图分析只能追踪模块内赋值，不能修复环上的初始化顺序。

#### 工程场景

典型环是 `utils → services → utils`，或组件 barrel 互引。开发模式因模块边界松、未压缩，可能碰巧能跑；生产拼接后执行顺序一变就炸。治理先用环检测画出环，把类型、常量和纯函数抽到无业务依赖的底层，再给真实有副作用的 CSS / polyfill 写精确 `sideEffects` glob。用生产构建加单测覆盖环上首次访问的导出。

#### 反例 / 踩坑

看见体积大就把所有包标 `sideEffects: false`；用 `export *` barrel 把环藏起来；开发能跑就当环不存在；把「循环警告当噪声关掉」却不看生产入口。这些都会让摇树和初始化问题拖到发布。

#### 资深回答模板

我先画环和副作用清单：环用拆文件或反转依赖打断，副作用用精确 glob 而不是全局 `false`。再用 production 产物确认导出初始化顺序和样式 / polyfill 仍在，而不是只看开发模式绿灯。

:::

**追问链：**
1. 开发能跑、生产环上报 `undefined` 通常是什么原因？
2. `export *` 会怎样掩盖循环和摇树问题？
3. 如何验收 `sideEffects` 改动没有误删文件？

::: details 追问参考答案

**1. 开发能跑、生产环上报 `undefined` 通常是什么原因？**

开发模式模块边界多、不拼接、执行时机更松，循环里第一次读到的绑定可能已被赋值。生产开启拼接和压缩后，工厂合并、执行顺序更紧，活绑定仍可能停在暂时性死区。应在生产构建里复现首次访问路径，把环拆开或把读取推迟到函数调用内，而不是关优化碰绿。

**2. `export *` 会怎样掩盖循环和摇树问题？**

星号再导出把命名空间摊平，调用方看不出真实依赖边，环和未使用导出都更难被人和工具看见。Webpack 对再导出的分析也更保守，该摇的摇不掉，该保留的副作用文件却可能因入口看起来「没直接引用」被跳过。公共入口应显式列出稳定导出，内部文件按方向单向依赖。

**3. 如何验收 `sideEffects` 改动没有误删文件？**

先列出导入即执行的文件：CSS、polyfill、扩展注册、locale。改标记后对比生产 CSS 体积、入口执行日志和关键页面视觉，并在 CI 对故意导入副作用文件做断言。只看 JS gzip 变小不够；少掉的字节里如果是全局初始化，线上会以「偶发无样式」或「API 未打补丁」出现。

:::

---

### D2. `splitChunks` 过度分包会带来什么伤害，如何收回？

::: details 参考答案

#### 基础结论

过度分包把公共模块切成大量小 chunk，请求数、连接建立、解析编译和运行时映射成本会吃掉「理论缓存收益」。默认策略先用证据说话：瀑布、缓存命中和主线程耗时，而不是按 npm 包名无限 `cacheGroups`。

#### 原理深挖

`splitChunks` 按 `minSize`、`minChunks`、`maxAsyncRequests`、`maxInitialRequests` 和 cacheGroups 切图。`minSize` 过低或一组规则一个 vendor，会产生几十个仅数 KB 的文件；HTTP/2 多路复用也消除不了每个脚本的下载调度和解析税。runtime 还要维护更长的 chunk 映射，入口或 runtime 哈希更容易连带变化。异步块之间再互相等公共块，会形成请求瀑布。

#### 工程场景

先看默认拆分下的路由覆盖和二次访问命中。只有重复模块体积大、变更频率低、且瀑布显示值得独立缓存时，再加一条 cacheGroup。每次只改一个阈值，保留 manifest 和 HAR。收回过度分包时提高 `minSize`、合并过碎的 vendor、降低 `maxAsyncRequests`，并确认 runtime chunk 没有因为映射膨胀而失去缓存意义。

#### 反例 / 踩坑

把每个 `node_modules` 包都拆成独立文件、把 `minSize` 调到接近 0、开发和生产用两套完全不同的 cacheGroups 却只优化其中一套、只看「chunk 数量变多」当成绩，都会让首屏更慢。

#### 资深回答模板

我先用默认 `splitChunks` 加产物清单建立基线，再按变更频率和瀑布决定是否抽稳定大库。过度碎包就回升 `minSize`、合并 cacheGroups，用二次访问命中率和主线程解析时间验收，而不是追求 chunk 个数。

:::

**追问链：**
1. HTTP/2 是否意味着拆得越细越好？
2. 怎样判断一条 cacheGroup 该不该留下？
3. 过度分包如何伤害 runtime 的长期缓存？

::: details 追问参考答案

**1. HTTP/2 是否意味着拆得越细越好？**

不是。多路复用降低队头阻塞，但每个小脚本仍有请求调度、压缩字典、解析和编译成本，移动网和冷缓存更明显。过碎还会让关键路径变成一串互相等待的异步块。应看连接数、TBT 和是否挡住首屏，而不是用「已经是 HTTP/2」为无限 `cacheGroups` 辩护。

**2. 怎样判断一条 cacheGroup 该不该留下？**

看它是否抽出了变更频率低、体积足够、且被多条路由复用的模块，并用二次访问命中率证明浏览器真的复用了该文件。若组内模块跟业务一起高频改，或体积低于请求税，就删掉这条规则。每次只留能在 manifest 和 HAR 上指认收益的组，避免按供应商名字堆规则。

**3. 过度分包如何伤害 runtime 的长期缓存？**

chunk 越多，运行时里的加载映射越长、变动越频繁。即使业务入口没改，映射增删也会改 runtime 字节和哈希，用户每次发布都重下运行时；若没抽 runtime，入口会一起失效。应用 visualizer 和连续构建的 runtime / 入口哈希对照，确认拆包收益没有被映射抖动抵消。

:::

---

### D3. loader 链上的 Source Map 丢失通常出在哪一环？

::: details 参考答案

#### 基础结论

最终 `devtool` 只决定怎么写出地图，中间每个 loader 都必须基于上一环的 map 再组合自己的变换。任一环丢 map 或只做粗糙行偏移，监控还原就会指到中间代码甚至错误文件。

#### 原理深挖

一条链常常是源语言 → 框架编译 → 语法降级 → 资源导出。`module` 类 `devtool` 要求这些变换都返回 Source Map；`cheap` 则在最终图上丢掉列。loader 若只返回字符串、用错误的 `inputSourceMap`，或生产关了 loader 的 `sourceMap` 选项，Webpack 只能从中间 JS 继续映射。资源模块和第三方包若未带 map，栈会停在 `node_modules` 产物行。

#### 工程场景

排障时从最终栈的文件名判断停在哪一层：停在 `.vue` 或 `.ts` 说明链完整；停在 loader 输出的 `.js` 说明缺 `module` 或某 loader 没传 map。给 Babel、TypeScript、Vue 和 CSS 相关 loader 打开与环境匹配的 `sourceMap`，生产用 `hidden-source-map` 上传监控后删除 `.map`。发版用故意抛错确认行列落在仓库源码，并绑定同一 release。

#### 反例 / 踩坑

开发开 `eval`、生产突然换完整 map 却不回归 loader 选项；其中一个 loader 关 map 提速；用格式化后的线上文件估行号当正式定位；把 Vite 的 `build.sourcemap` 取值套到 Webpack `devtool` 上。

#### 资深回答模板

我把 Source Map 当成链路产物：每个 loader 都要交回组合后的 map，`devtool` 只负责精度和是否暴露引用。用一发故意异常验收最终行列，生产 map 只进监控、不进 CDN。

:::

**追问链：**
1. 栈停在 Babel 输出而不是 TypeScript 源，缺了什么？
2. 为什么生产不能事后重新打一份 map？
3. loader 为了速度关闭 `sourceMap` 有什么代价？

::: details 追问参考答案

**1. 栈停在 Babel 输出而不是 TypeScript 源，缺了什么？**

说明最终图没有 `module` 信息，或 TypeScript / ts-loader / babel 没把上一环 map 传下去。Webpack 只能从 Babel 产出的 JS 映射，行号对仓库 `.ts` 会整体错位。打开链路中每个转译器的 `sourceMap`，并改用带 `module` 的 `devtool`，再用同一行故意 `throw` 看监控还原是否落到原文件。

**2. 为什么生产不能事后重新打一份 map？**

Source Map 必须对应那一次压缩、拼接和模块编号的精确字节。事后用「相近配置」重打，依赖解析、压缩顺序或内容哈希只要有一点不同，行列就会指错。正确做法是 CI 对同一制品生成并上传 map，release 与 JS 字节一起归档。缺 map 时只能用 chunk 名、用户路径和二分回滚缩小范围，不能假装有映射。

**3. loader 为了速度关闭 `sourceMap` 有什么代价？**

该环之后的所有映射都以它的输出当「源」，开发跳转和线上还原都会停在中间代码。省下的是这一环生成 map 的时间，换来的是排障成本。若某 loader 确实是瓶颈，应缩小 include、用持久化缓存，而不是先拆掉映射。需要关时也只关确认不影响验收的开发路径，生产排障链必须完整。

:::

---

### D4. 持久化缓存被污染时，如何隔离和取证？

::: details 参考答案

#### 基础结论

缓存污染是「错误输入被当成可复用输出」。隔离靠 `cache.name` / `cache.version` 和 CI 缓存键；取证靠对比本次输入哈希与命中记录，而不是一上来删目录。删缓存只能消除症状，不能解释下次为何再脏。

#### 原理深挖

文件系统缓存按配置、Webpack 版本、`buildDependencies` 和 snapshot 决定能否复用模块。`mode`、`target`、自定义 `DefinePlugin` 值若没进入 `name` 或 `version`，development 产物可能被 production 复用，或分支 A 的 loader 选项被分支 B 命中。`managedPaths` 把 `node_modules` 当不可变，手工改包或换锁文件未反映到版本时，会继续用旧变换。不同操作系统或 Node 版本共享同一 CI 缓存键，也会掺进原生绑定或不兼容序列化。

#### 工程场景

把 `cache.name` 设为 `mode + target`，把锁文件、会改变内联值的环境列入 `version` 或 CI key。CI 按操作系统、Node 版本、Webpack / Rspack 身份分桶，禁止 Webpack 与 Rspack 共用目录。怀疑污染时保留缓存元数据，对比命中模块的构建输入和当前配置 diff，再用一次干净缓存和一次命中缓存的产物哈希对照。确认根因后再决定是否作废该桶。

#### 反例 / 踩坑

全员文档写「不行就删 `node_modules/.cache`」；本地和 CI 共享可写缓存盘却不分 `mode`；把整个家目录缓存进 CI；污染后不记录是哪次依赖或环境变化引入的。

#### 资深回答模板

我先问缓存把什么当成输入：配置、锁文件、mode、Node 和打包器身份都必须在 name / version / CI key 里。对照命中记录和产物哈希定位脏桶，修隔离后再复现「该命中命中、该失效失效」。

:::

**追问链：**
1. 为什么 Webpack 和 Rspack 不能共用同一缓存目录？
2. 手工改 `node_modules` 为什么常常不触发失效？
3. CI 缓存键至少要包含哪些维度？

::: details 追问参考答案

**1. 为什么 Webpack 和 Rspack 不能共用同一缓存目录？**

两者序列化格式、模块图实现和 loader 执行细节并不保证兼容，复用同一目录会把对方的中间结果当成合法命中，表现为难复现的错模块或难解释的失效。缓存目录和 CI 桶必须带打包器名字与主版本。迁移对照应在各自干净缓存下各打一次，而不是「为了公平」复用旧桶。

**2. 手工改 `node_modules` 为什么常常不触发失效？**

`snapshot.managedPaths` 默认把依赖目录当包版本稳定，不再按文件内容深比较。patch-package 未反映到版本、直接改安装结果、或锁文件未纳入 `buildDependencies` 时，缓存仍认为输入没变。本地验证依赖变化应改版本或暂时移出 managedPaths，并确认 CI 键包含锁文件，而不是指望它自动发现你的手工编辑。

**3. CI 缓存键至少要包含哪些维度？**

至少包含操作系统与 CPU 架构、Node 主版本、打包器及主版本、锁文件哈希、`mode` / `target`，以及会改变 `DefinePlugin` 或 loader 选项的环境摘要。少任一维都可能跨环境复用。键要稳定可复现，不要放时间戳或 PR 号导致永远冷启动；污染后按维度作废单桶，而不是清掉所有分支的缓存。

:::

---

### D5. `DefinePlugin` 做环境注入时，哪些值会变成安全事故？

::: details 参考答案

#### 基础结论

`DefinePlugin` 是编译期标识符替换，写进 bundle 的值对浏览器用户都是可读的。它不是加密，也不是运行时配置服务。密钥、对内网地址、未设计为公开的令牌都不能走这条路径；需要「一份制品多环境晋级」时，应改用运行时配置。

#### 原理深挖

插件按键名做静态替换，值必须是完整表达式，通常用 `JSON.stringify` 包成字符串字面量；漏掉的话 `production` 会变成标识符 `production` 而不是字符串。替换发生在压缩之前，死代码消除会按替换后的布尔值裁剪分支，因此错误的环境值不仅泄漏，还会切错功能开关。`EnvironmentPlugin` 同样是构建期注入。前端环境分层与密钥边界的一般原则见 [工程化](/interview/questions/03-engineering)。

#### 工程场景

只注入明确可公开的 API 前缀、特性开关和构建元数据，并在代码评审和打包扫描里搜常见密钥形态。同一制品要进测试 / 预发 / 生产时，把环境差放到带 schema 的运行时配置，构建只留不变的公开默认值。CI 用 secret 调构建没问题，但 secret 不能出现在 Define 的值里。发版后抽查 bundle 字符串，确认没有内网主机名和令牌。

#### 反例 / 踩坑

把 `process.env` 整个摊进前端；以为不叫 `SECRET` 就不算泄漏；本地 `.env` 有调试私钥并被 Define 打进 development 包后误传到预发；用 Define 模拟「运行时换环境」却要求每次改环境都重建。

#### 资深回答模板

我把 Define 当成会印发的字面量：只能放可公开常量，值必须 `JSON.stringify`，并用 bundle 扫描验收。密钥留在服务端或 BFF；多环境晋级走运行时配置，不靠重打带秘密的包。

:::

**追问链：**
1. 为什么漏掉 `JSON.stringify` 会得到错误运行结果？
2. 构建期注入和运行时配置该如何分工？
3. 如何证明某次构建没有把密钥打进包？

::: details 追问参考答案

**1. 为什么漏掉 `JSON.stringify` 会得到错误运行结果？**

Define 替换的是标识符文本。值写成 `production` 会变成变量 `production`，未定义就运行时异常；写成未加引号的 URL 片段可能变成非法语法。`JSON.stringify` 把它变成合法字面量，布尔和数字才能参与死代码消除。代码评审应同时看键和值的序列化，单测可用编译后字符串断言，而不是只断言 `process.env.NODE_ENV` 在 Node 进程里的值。

**2. 构建期注入和运行时配置该如何分工？**

构建期只放编译期就能定死、且可公开的量，例如公开 API 前缀和会参与树摇的特性开关。测试、预发、生产要共用一份不可变制品时，环境差必须运行时读取，并带 schema 与失败默认值。密钥和内网地址两边都不能进浏览器。分工写进发布清单，避免有人用「再打一个包」绕过晋级。

**3. 如何证明某次构建没有把密钥打进包？**

对同一制品做字符串扫描：已知 secret 名称、令牌形态、内网主机和私钥头。CI 在上传前失败即阻断，并把扫描范围覆盖 JS、inline asset 和 Source Map。本地 `.env` 不得进入可分享产物。抽查不能代替扫描，因为压缩后的字符串仍可能完整保留密钥。

:::

---

### D6. Module Federation 共享依赖版本应遵循哪些打包原则？

::: details 参考答案

#### 基础结论

`shared` 是运行时版本协商，不是普通 `externals`。打包侧只决定把哪些依赖登记进 Share Scope、是否 `singleton`、`requiredVersion` 与是否 `eager`；真正选哪一份实例发生在运行时。Webpack 5 内置 `ModuleFederationPlugin` 只提供容器与共享核心能力，不能按独立 Module Federation 2.0（`@module-federation/enhanced`）的 Manifest、运行时插件和动态类型来假设。机制、故障和 Vue 单例细节见 [微前端](/interview/questions/12-microfrontend)。

#### 原理深挖

构建时要把共享包从应用 chunk 里扣下或做成可被运行时替换的槽位，并写入版本与策略。`eager: true` 会把共享模块打进当前入口，增大首包并削弱按需。`shareKey` 不一致则双方登记的不是同一槽位，运行时会静默双份。内置联邦与 MF 2.0 增强运行时的产物元数据不同，混读两套文档会把「构建能启动」误当成「协商策略相同」。

#### 工程场景

只共享高重复成本或必须身份一致的依赖；其余让应用自带并计入体积。升级策略按范围版本协商，而不是口头约定「大家都用最新」。Webpack 5 内置够用就锁内置插件；需要 Manifest、运行时注册和类型分发再评估 MF 2.0，并做 host×remote 版本矩阵。打包验收看入口是否被 eager 撑大、重复模块是否来自 key 不一致，运行时协商把证据留给微前端题库。

#### 反例 / 踩坑

把所有 `dependencies` 标成 singleton；同时配 `shared` 和 `externals` 导致运行时缺模块；按 MF 2.0 文档去开 Webpack 5 内置插件的 Runtime Plugin；用「再分享一个包」解决体积，却不做首包和故障半径评估。

#### 资深回答模板

我先分清 Webpack 5 内置联邦和 MF 2.0 增强层，再只共享有证据的依赖，并检查 `shareKey`、版本范围和 eager 对入口的影响。协商与降级不在打包题里展开，转到微前端题库用运行时快照说话。

:::

**追问链：**
1. 为什么不能把 `shared` 理解成换皮的 `externals`？
2. `eager` 在打包结果上最容易伤害什么？
3. 什么信号说明该去看微前端题库而不是继续调 Webpack？

::: details 追问参考答案

**1. 为什么不能把 `shared` 理解成换皮的 `externals`？**

`externals` 假定全局已经存在一份实现，构建直接留空；`shared` 会登记版本与策略，由运行时在 Share Scope 里挑选或回退到自己的副本。缺全局、版本不符或 singleton 冲突时，两者失败形态完全不同。打包配置只能声明参与协商的模块，不能省掉运行时矩阵。把 shared 当 external 用，常见结果是运行时缺模块或双运行时。

**2. `eager` 在打包结果上最容易伤害什么？**

它把共享模块打进当前入口，换「不必再等异步共享块」的确定性，代价是入口体积和缓存粒度变差，所有消费该入口的页面都先下载这份依赖。多个 remote 各自 eager 同一大库时，首屏和重复字节会一起恶化。只对必须同步拿到的单例开 eager，并用入口 visualizer 验收，而不是给所有 shared 默认 eager。

**3. 什么信号说明该去看微前端题库而不是继续调 Webpack？**

一旦问题落到 host / remote 角色、Share Scope 选版本、容器 `init/get`、Manifest / Snapshot、隔离或加载失败分类，就超出打包原理。Webpack 题只负责：内置插件还是 MF 2.0、eager 与入口、shareKey 是否对齐。运行时协商、Vue 身份和故障边界应转到 [微前端](/interview/questions/12-microfrontend) 用同一套术语继续答。

:::

---

### D7. 大型遗留 Webpack 项目应如何规划迁移，而不是赌一次重写？

::: details 参考答案

#### 基础结论

先盘点锁定因素，再选「留下 Webpack 5、换成 Rspack，还是新入口走 Vite」，用同一提交的双跑证据推进。迁移单位是可回滚的构建目标，不是口号上的技术栈更换。没有产物对照和运行时烟测的大爆炸重写，通常会把构建问题变成业务回归。

#### 原理深挖

遗留仓的真实锁通常是：自定义 loader / plugin、Webpack 4 残留规则、Node polyfill、多入口 HTML、以及 Webpack 5 内置联邦。Webpack 4 应先升到 5，吃下资源模块、持久化缓存和「无自动 Node polyfill」，再谈换引擎。Rspack 保留 Webpack 心智，适合速度优先且配置资产重；Vite / Rolldown 换开发模型，适合新应用或已经没有 Webpack 专有钩子的子系统。联邦机制仍按内置与 MF 2.0 分开，细节链到 [微前端](/interview/questions/12-microfrontend)。

#### 工程场景

列一张表：插件兼容性、联邦、SSR、自定义 loader、CI 分钟数、HMR 痛点。先修 Webpack 5 警告和重复规则，打开文件系统缓存拿到基线。若痛点是 CI 和冷启动且配置要留下，开 Rspack 分支对同一 git SHA 比清单、运行时和测试。新微应用可以 Vite 起步，壳层保持原打包器直到协议稳定。每次只扩一个入口，保留旧配置回滚。

#### 反例 / 踩坑

Webpack 4 未升级就直跳 Vite；按博客删掉全部自定义 loader；联邦应用按 Vite 文档假设能力对等；双跑时共用污染的持久化缓存；用「本地感觉快了」代替 CI 统计和产物哈希对照。

#### 资深回答模板

我先升到干净的 Webpack 5 并量基线，再按锁定因素选 Rspack 或 Vite。新入口可以先走新管线，核心仓用同一 SHA 双跑和可回滚配置推进，不为迁移而迁移。

:::

**追问链：**
1. 为什么强调先把 Webpack 4 升到 5？
2. 双跑对照最少要看哪些证据？
3. 什么情况下应明确选择「不迁移」？

::: details 追问参考答案

**1. 为什么强调先把 Webpack 4 升到 5？**

Webpack 5 已经改变资源模块、持久化缓存、Node polyfill 和联邦内置方式。从 4 直接跳 Vite 或 Rspack，会把升级语义、兼容缺口和业务回归混在一次差异里，失败无法归因。先在 Webpack 5 去掉废弃 loader、补 `fallback`、让生产构建可复现，再换引擎，对照才有共同基线。这一步本身也常已收回一部分构建时间。

**2. 双跑对照最少要看哪些证据？**

同一 git SHA 上比较：入口与异步 chunk 清单、重复模块、关键路由体积、Source Map 能否还原、单测 / 关键 E2E、CI 墙钟时间和失败插件列表。有联邦时再加上 host×remote 冒烟，细节仍走微前端题库。两边缓存目录必须隔离。没有清单和运行时证据，不能把「构建通过」写成迁移完成。

**3. 什么情况下应明确选择「不迁移」？**

当自定义插件没有替代、联邦或 SSR 在目标打包器上未通过矩阵、团队没有双跑和回滚预算，或当前 Webpack 5 加持久化缓存已满足 CI 与开发体验时，应明确不迁。把决定写成约束和复审日期，把时间用于修警告和分包证据。拒绝迁移和推进迁移一样，都需要可核验的成本与风险，而不是情绪性保旧。

:::
