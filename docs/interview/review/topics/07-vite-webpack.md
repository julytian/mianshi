# Vite / Webpack 构建器

> **真源：** [24 Vite](/interview/questions/24-vite)、[25 Webpack](/interview/questions/25-webpack)（主）；体积归因、制品晋级与 Source Map 门禁见 [03 工程化](/interview/questions/03-engineering)。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背插件名单，而是证明你能把「开发为何快 / 生产为何挂 / 何时换打包器」讲成可验收链路：

**版本矩阵 → 开发管线（按需 ESM + 预构建）→ 生产管线（打包 / 分包 / 压缩）→ 缓存与产物对照 → 选型与迁移边界。**

面试官想听四类能力：

1. **版本感：** 先报 Vite 主版本；Vite 2–7 与 Vite 8 的 bundler 心智不同。
2. **路径感：** 开发预构建与生产构建是两条消费路径；「本地过、生产挂」如何取证。
3. **选型感：** Webpack 5 何时仍合理；Rspack 与 Rolldown 分别替代哪条路。
4. **工程取舍：** 分包证据、持久化缓存隔离、环境变量泄漏扫描、联邦插件边界。

口述红线（与题库冲突即扣分）：

- **把 Vite 8 生产默认说成一定是 Rollup**（错误；Vite 8 默认 Rolldown + Oxc）；
- 把 Vite 7 的 `rolldown-vite` 说成已是官方默认；
- 用 `manualChunks` 当 Vite 8 长期分包答案；
- 把 Rspack 与 Rolldown 混成「都是 Rust 打包器所以一样」；
- 用 dev server 产物判断生产体积；
- 把 Webpack 5 内置 Module Federation 说成已自带 MF 2.0 Manifest / Runtime Plugin。

## 知识地图

```text
Vite 版本矩阵              开发路径                    生产路径                 选型边界
2–7: esbuild+Rollup   →   原生 ESM 按需转译      →   打包/树摇/压缩       新项目优先 Vite
8: Rolldown+Oxc            optimizeDeps 预构建         codeSplitting groups   存量 Webpack 资产
兼容层 ≠ 长期 API          HMR accept/dispose          Worker/SSR 分入口       Rspack≈留 Webpack API
env / define 泄漏面        proxy 仅开发                sourcemap hidden        Rolldown≈进 Vite 管线
```

主线口诀：

1. **先报版本，再谈引擎**
2. **开发快 ≠ 生产同图**
3. **Vite 8 分包只讲 `build.rolldownOptions.output.codeSplitting`**
4. **Rspack 留 Webpack 心智；Rolldown 换 Vite 管线**
5. **内置联邦 ≠ MF 2.0 增强层**
6. **能构建 ≠ 迁移完成（弃用警告要清零）**

## 完整讲解

### 1. Vite 开发服务器为什么快，以及版本矩阵

开发态不是「先打完整生产包再起静态服务器」。浏览器按原生 ESM 请求源码，Vite 只转译当前图里真正被访问的模块。裸导入先预构建成 ESM，并改写成带版本查询的缓存 URL——命中后浏览器可长期缓存，依赖变更才 re-optimize。

- **Vite 2–7：** 默认 esbuild 做依赖优化与 TS / JSX 转译，**生产默认 Rollup**；Vite 7 的 `rolldown-vite` 只是可选预览，不是官方默认。
- **Vite 8：** 默认 **Rolldown + Oxc**：`optimizeDeps.rolldownOptions`、转译走 `oxc`、生产与 Worker 走 `build.rolldownOptions` / `worker.rolldownOptions`。

**机制：** 冷启动快 = 未访问模块不转译 + 预构建缓存；HMR 快 = 有 accept 边界时局部替换。类型检查仍交给 IDE / `vue-tsc`，不绑进按文件转译。

**失败形态：** 失效面过宽、插件扫全仓、找不到 accept 边界 → 整页刷新；把「冷启动快」当成大仓 HMR 永远快；面试把 Vite 8 生产说成一定是 Rollup。Oxc 加快转译，不能掩盖坏的 `handleHotUpdate`。

**验收：** 先报主版本再谈引擎；构建日志可见 Rolldown/Oxc 路径；连续保存 20 次断言连接数不增长（模块作用域单例接不住就 `invalidate`）。

口述红线再钉死一次：Vite 7 的 `rolldown-vite` ≠ Vite 8 官方默认；不能用「都是 Rust」把 Rspack 与 Rolldown 混谈。开发快证明的是按需转译模型，不是生产体积一定更优——生产证据必须来自 `build`/`preview` 与同一次制品的瀑布，而不是 dev server。

### 2. 插件钩子、env、optimizeDeps 与钩子顺序

`resolveId` 收稳定 id（含虚拟模块 `\0`）；`load` 取源码；`transform` 改写并返回可组合 Source Map。Vite 8 扩展 Rolldown 插件接口，并行钩子在 Rolldown 中按顺序执行——更不能靠「碰巧并行」掩盖依赖。同一钩子内：`enforce: 'pre'` → Vite 核心 → 普通插件 → `post`。`apply` 跟 command（`serve`/`build`）不跟 mode。要看原始源码用 `pre`；要看 env 替换与资源改写之后用 `post`。虚拟模块用户侧 `virtual:…`，内部 `\0`；必须 resolve + load 成对，查询参数是 id 一部分；每个 `transform` 必须组合 Source Map，只在 dev 实现 `load` 会导致「本地过、制品空」。

`import.meta.env` 按 `envPrefix`（默认 `VITE_`）暴露；是构建期替换，不是服务端秘密保险箱。`define` 做标识符级替换，值应 `JSON.stringify`。没有前缀仍可能经 `define` / 自写插件泄漏——产物与 map 都要扫。

预构建缓存在 `node_modules/.vite`（或 `cacheDir`）：新依赖、新入口、`include`/`exclude`、锁文件变化会 re-optimize。Vite 8 应迁到 `optimizeDeps.rolldownOptions`；旧 `esbuildOptions` 仅兼容层。反复删 `.vite` 不是根因分析。Monorepo 链接包要显式 `optimizeDeps.include` / `ssr.noExternal`，`server.fs.allow` 收紧到 workspace；多应用默认独立 `cacheDir`。

CJS default：Vite 8 按 importer 是否 ESM 与 `__esModule` 对齐规则，消掉一类「dev 能跑、build 取到 undefined」。可疑包显式 `include`；`exclude` 错用会把 CJS 原样送进浏览器。遗留互操作开关只能当短期逃生舱。

**验收：** 虚拟模块双端都有内容；产物/map 假密钥扫描阻断；钩子依赖不靠并行碰巧。

### 3. 生产构建、分包、体积归因与「开发过、生产挂」

即便 Vite 8 用 Rolldown + Oxc 统一 bundler，开发和生产仍是两条消费路径：开发按需 + HMR；生产整图打包、tree-shake、拆 chunk、压缩，并应用 `apply: 'build'` 插件。条件导出、`ssr.external`、仅客户端模块仍可能只在生产暴露。

**Vite 8 分包只使用 `build.rolldownOptions.output.codeSplitting`（groups 等）**；对象形式 `manualChunks` 已移除，函数形式已弃用。兼容层能改写部分旧配置 ≠ 应继续混写两代入口。验收用 manifest + 网络瀑布；公共 chunk 哈希变化会级联异步块失效。

`cacheDir` 主要是依赖预构建缓存；Rolldown 模块级持久化缓存是另一层，开关以目标版本文档为准——别把「删 `.vite` 变慢」直接当模块级命中证据。

体积归因接到工程化：treemap 归属、import 链、直接/传递依赖、插件是否误带。固定同一构建模式复测 gzip/brotli、首屏下载与重复模块。Vite 2–7 诊断 `manualChunks`；Vite 8 诊断 `codeSplitting`。体积与请求数权衡：过碎增加调度与解析税，过大拖垮首屏；用关键路由总字节、请求链深度、主线程时间与 RUM 说话。

生产 Source Map：Vite 用 `hidden` 生成独立 map 不写引用，CI 上传监控后从发布目录删除；没有 `nosources` 这个 Vite 取值，排除 `sourcesContent` 走底层 `sourcemapExcludeSources` 或监控平台。缺 map 时不能事后重打冒充，只能结合 chunk 名、用户路径与二分回滚。

library mode：对等依赖（如 `vue`）必须 external，写在 `build.rolldownOptions`；打进 bundle 会出现双运行时。Worker 用 `new URL(..., import.meta.url)` 或 `?worker`；Vite 8 配 `worker.rolldownOptions`。

**「开发过、生产挂」取证三步：** 同一锁文件与提交；对比失败模块在 dev 与 `vite build`/`preview` 的解析路径与条件导出；确认 `apply:'build'` 插件与压缩假设。不要先改业务代码碰绿。

公共 chunk 策略要同时看复用度与变更频率：把高频变更业务塞进「公共」会拖垮长期缓存命中。验收不只看首屏总字节，还要看二次访问命中率与主线程解析时间——过碎与过大都会在不同网络形态上翻车。

### 4. SSR 外部化、CSS、mode vs command

SSR 默认外部化多数 npm 依赖，让 Node 直接加载；需走 Vite 管线的列入 `ssr.noExternal`。框架约定见 Nuxt 题库，本题只谈模块图。浏览器 API 禁止出现在 SSR 入口顶层；服务端单例会串请求。

CSS Modules 用 `*.module.css`；Vite 8 默认 Lightning CSS 压缩，可临时回退 `build.cssMinify: 'esbuild'`（需自装 esbuild）。`additionalData` 给每个 Sass 打针会扩大 HMR 失效面。

`command` 是 `serve` / `build`；`mode` 是环境名。`vite build --mode development` 仍是生产构建命令，只是加载 `.env.development`——不会得到开发服务器行为。`server.proxy` 只作用于开发，生产靠网关；代理通 ≠ Cookie Domain 在预发一致——预发要对齐 Domain/Path/Secure/SameSite，客户端用相对 `/api`。

**失败形态：** 用 `vite build --mode development` 当「开发构建行为」；把代理通当成生产 Cookie 策略已对齐；SSR 入口顶层读 `window` 只在 preview 暴露。

**验收：** command/mode 矩阵写进 README；预发 Set-Cookie 与文档域名对照；SSR 入口无浏览器 API 顶层导入。

CSS 侧再补一句：Lightning CSS 是 Vite 8 默认压缩路径；回退 esbuild 要显式安装并说明原因。Sass `additionalData` 的「全局变量方便」会用 HMR 失效面买单——主题 Token 更适合 CSS 变量或按入口显式导入。

### 5. 升级到 Vite 8：如何确认切到 Rolldown / Oxc

以 `vite` 包主版本、changelog 和构建日志为准，不是沿用「预构建一定 esbuild、生产一定 Rollup」。应看到可迁到 `oxc`、`optimizeDeps.rolldownOptions`、`build.rolldownOptions` 的弃用提示。

**完成迁移四步：** 主版本与 changelog → 长期配置换新入口 → 弃用警告清零（对象 `manualChunks` 删除）→ dev / build / SSR / Worker / preview 同提交回归。复杂项目可先在 Vite 7 换 `rolldown-vite` 隔离打包器问题，再升 8。「能构建」≠ 迁移完成。

**验收：** 构建日志引擎正确；弃用警告 0；五条路径回归通过；PR 模板含版本/分包入口/缓存隔离/产物扫描/联邦插件版本六问。

文件系统缓存与预构建缓存要分桶：mode、打包器、CI job key 任一变化都应换 name/version，避免「错误输入被当成可复用输出」。Webpack↔Rspack 迁移对照尤其严禁共用缓存目录。

兼容层能让旧配置暂时可构建，但下次框架去兼容层会集中爆雷——迁移窗口内必须把对象 `manualChunks`、`esbuildOptions` 等旧入口清掉。升级答辩固定口径：主版本与 changelog、新配置入口、弃用警告清零、五条路径回归；「能构建」只是起点。

### 6. Webpack 5：编译图、分割、摇树与缓存污染

Compiler 创建 Compilation：`make` 建模块图（resolver → loader 管道 → 抽依赖），`seal` 树摇 / 分包 / 哈希，`emit` 写出。loader 变换单模块（配置数组右→左）；plugin 挂 Tapable 生命周期。

代码分割：多入口、`import()`、`splitChunks`。runtime chunk 抽出加载映射；不抽则异步块增删常改入口哈希，长期缓存失效。过度 `splitChunks`：HTTP/2 消除不了每个小脚本的调度与解析税，runtime 映射变长还会伤害长期缓存——收回时提高 `minSize`、合并过碎 vendor，用二次访问命中率与主线程解析时间验收。

tree shaking 要静态 ESM + 可信 `sideEffects`；`sideEffects: false` 可能误删 CSS。环上的暂时性死区会在 production 拼接后以 `undefined` 出现，开发却「碰巧能跑」。`export *` barrel 会摊平依赖边，让环与未使用导出更难看清。asset modules（`asset/resource|inline|source|asset`）替代常见 file/url/raw-loader。

`cache.type: 'filesystem'` 合法失效来自版本、`buildDependencies`、`cache.version/name`、snapshot；不该失效却失效常因 name 未隔离 mode。改配置仍命中旧缓存 = 缺 `buildDependencies`。缓存污染是「错误输入被当成可复用输出」：隔离靠 name/version/CI key；取证靠对比输入哈希与命中记录，删目录只能消症状。手工改 `node_modules` 常不触发失效。Webpack 与 Rspack **不能**共用同一缓存目录——序列化不兼容。

`devtool`：开发常见 `eval-cheap-module-source-map`；生产用 `hidden-source-map` 上传监控后删 `.map`（`nosources-source-map` 语义相近但配置名与 Vite 不同，不要混套）。loader 链任一环丢 map，最终栈会停在中间 JS；生产 map 必须绑定同一次制品。HMR 经 WebSocket 推哈希再拉 `hot-update`，是开发协议不是生产热更新。`DefinePlugin` 与 Vite `define` 一样是印发字面量：漏 `JSON.stringify` 会变成标识符；密钥与内网地址不能走构建期注入，多环境晋级优先运行时配置。

**验收：** runtime chunk 抽出后入口哈希在异步块增删时保持稳定；缓存 miss/hit 能用输入哈希解释；生产 map 与制品同一次构建绑定。摇树事故优先查 `sideEffects` 与 barrel `export *`，不要先怪压缩器。

### 7. 选型：Vite vs Webpack；Rspack vs Rolldown

先比开发模型和约束，不比口号。

| 路径 | 适合 | 不适合误判 |
| --- | --- | --- |
| **Vite（新项目默认）** | 无 Webpack 专有插件 / 联邦硬约束 | 「简历好看就迁」 |
| **留下 Webpack 5** | 生产稳定、自定义 loader 多、内置联邦已绑死 | 用 dev server 体积当生产证据 |
| **Rspack** | 还要 Webpack 心智与配置，但受不了 JS 打包器速度 | 当成 100% 兼容承诺 |
| **Vite 8 / Rolldown** | 换开发模型与插件接口，进入 Vite 管线 | 拿一份 `webpack.config` 直接喂 Rolldown |

**Rspack**：瞄准 Webpack 兼容面，用 Rust 换构建时间；迁移对照官方兼容表，同一 SHA 比产物清单 / 运行时 / CI 耗时。

**Rolldown**：瞄准 Rollup 兼容，是 Vite 8 默认生产与统一 bundler 方向；**不接受** Webpack 配置当输入；分包也不能照搬 `splitChunks`。

存量大仓通常不应立刻整仓迁 Vite：先量化冷启动 / HMR / CI / 插件锁定 / 联邦协议。痛点主要是速度且要留配置 → 常先评 Rspack；新入口可 Vite，核心仓待 loader 有替代再迁。Webpack 4 应先升到 5（资源模块、持久化缓存、无自动 Node polyfill），再换引擎，否则差异无法归因。没有冷启动/HMR/CI 分钟数/插件锁定表，应拒绝拍板「要不要迁 Vite」。

决策信号（口述可画表，不是另背小抄）：新应用无 WP 专有插件 → Vite 8；冷启动/CI 痛且配置资产重 → 评 Rspack；要换开发模型与生态 → Vite 8/Rolldown；内置联邦已绑死且稳定 → 可留 WP5，增强需求再评 MF 2.0；Webpack 4 残留 → 先升 5 再谈换引擎。

### 8. Module Federation 打包边界（点到为止）

`shared` 是运行时版本协商，不是换皮 `externals`。打包侧决定登记进 Share Scope、`singleton`、`requiredVersion`、`eager`；真正选实例在运行时。`eager` 撑大入口；`shareKey` 不一致会静默双份。

**Webpack 5 内置 `ModuleFederationPlugin`** 提供容器与共享核心能力；**独立 Module Federation 2.0（`@module-federation/enhanced`）** 才有 Manifest、Federation Runtime、Runtime Plugin、动态类型等增强——**不能**把 MF 2.0 能力倒推为所有 Webpack 5 项目自带。运行时协商、故障边界见微前端专题。打包题答到：内置还是 enhanced、eager 是否撑入口、shareKey 是否对齐；运行时协商甩到 [09](/interview/review/topics/09-microfrontend-architecture)。

**失败形态：** 配了内置插件却按 MF 2.0 文档找 Manifest / Runtime Plugin；把 `shared` 当 `externals` 期望构建期缺依赖即失败——实际是运行时协商，失败形态与取证完全不同。

**验收：** ADR 写明插件包名与文档链接；host×remote 冒烟含 shared 快照；入口体积对比 eager 开关前后。

### 9. HMR、虚拟模块、Monorepo 与迁移剧本

Vite：`import.meta.hot.accept` 是接受边界，`dispose` 拆旧副作用；模块作用域单例热替换会造第二份实例。Webpack：无 accept 则冒泡整页刷新。

迁移剧本：遗留仓真实锁通常是自定义 loader/plugin、Webpack 4 残留、Node polyfill、多入口 HTML、内置联邦。路径：先升干净 Webpack 5 并打开 filesystem 缓存拿基线 → 痛点是 CI/冷启动且要留配置则开 Rspack 分支 → 新微应用可 Vite 起步，壳层保持原打包器直到协议稳定。双跑最少看：入口与异步 chunk 清单、重复模块、关键路由体积、Source Map 还原、单测/关键 E2E、CI 墙钟、失败插件列表；有联邦再加 host×remote 冒烟。两边缓存目录必须隔离。自定义插件无替代、联邦矩阵未过、或当前 WP5 已满足体验时，应明确**不迁移**并写复审日期——拒绝迁移和推进迁移一样需要证据。

口令收口：**Vite 8 生产默认不是 Rollup；Rspack 不是 Rolldown；内置联邦不是 MF 2.0。** 三句说错任一句，前面讲得再顺也容易被否决。

若面试官偏工程效能：主动接制品晋级、运行时配置、Source Map 上传后删除、体积归因流水线。若偏业务架构：联邦边界甩到微前端，并强调「先 Monorepo 壳，再运行时装配」。看人下菜，但版本与边界红线句子不变。迁移对照必须各自干净缓存各打一次；没有同 SHA 双跑清单就不要宣称「兼容完成」。 构建器面试的胜负手在版本矩阵、两条消费路径、缓存隔离键与一次失败发布的回滚面——留下 CI 分钟数、弃用警告清零耗时与分包前后 LCP，故事才闭环。

若时间只够一分钟：报版本、画双路径、点出 Rspack/Rolldown/MF 三条边界、甩一个带数字的事故。口径说错是硬伤，细节不全可以后补。版本口径说错一票否决；其余回题库深挖即可。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | Vite 主版本、插件锁定、联邦协议、CI 分钟数、是否 Monorepo |
| **方案** | 留 WP5 / Rspack / Vite 8；分包入口一代配置；缓存 name 隔离 |
| **取舍** | 兼容缺口、配置改动量、开发模型切换成本 |
| **验证** | 同 SHA 双跑清单、弃用警告清零、瀑布与二次访问命中 |
| **复发防护** | 升级检查表、缓存分桶、产物密钥扫描 |

**案例 A — 「Vite 8 升完还能构建，面试却说生产是 Rollup」**

- 约束：团队文档仍写 Vite 5 心智。
- 方案：改口径与配置入口到 `rolldownOptions` / `oxc`；删对象 `manualChunks`。
- 取舍：短期兼容层便利 vs 下次去兼容层事故。
- 验证：构建日志引擎、弃用警告、dev/build/preview 回归。
- 防护：升级检查表进 PR 模板。

**案例 B — 「过度 splitChunks，首屏更慢」**

- 约束：HTTP/2，但移动网冷缓存。
- 方案：回升 `minSize`、合并过碎 vendor；先默认策略再证据化 cacheGroup。
- 取舍：理论缓存粒度 vs 请求/解析税。
- 验证：HAR 请求数、TBT、二次访问命中、runtime 哈希稳定性。
- 防护：每次只改一个阈值，保留 manifest。

**案例 C — 「开发代理登录通，预发 Cookie 丢」**

- 约束：本地 `server.proxy` 到后端。
- 方案：生产网关对齐 Domain/Path/Secure/SameSite；客户端用相对 `/api`。
- 取舍：本地便利配置不能原样搬 Nginx。
- 验证：预发 Set-Cookie 与文档域名对照。
- 防护：环境对照清单进发布门禁。

**案例 D — 「DefinePlugin / VITE_ 把密钥打进包」**

- 约束：一份制品多环境晋级。
- 方案：构建期只放可公开常量；密钥留 BFF；多环境走运行时配置 schema。
- 取舍：每次改环境重建 vs 运行时注入治理。
- 验证：CI 扫 `dist`/Worker/map 假密钥。
- 防护：扫描阻断发布；禁止 `JSON.stringify(process.env)`。

**案例 E — 「filesystem 缓存命中了错误输入」**

- 约束：多 mode / 多打包器同机 CI。
- 方案：`cache.name`/`version` 隔离；`buildDependencies` 纳入 webpack/rspack 配置与锁文件；迁移对照各自干净缓存。
- 取舍：缓存命中率 vs 错误复用风险。
- 验证：故意改 loader 选项后必须 miss；命中记录与输入哈希对照。
- 防护：缓存分桶写进 CI 模板；禁止 WP 与 Rspack 共用目录。

证据坑位（填你的数）：冷启动 P50〔填〕；生产 CI 构建分钟数〔填〕；升级 Vite 8 弃用警告→0 耗时〔填〕；首屏关键 JS gzip〔填〕；过度分包回收后 LCP 变化〔填〕；filesystem 缓存分桶命中率〔填〕。


## 追问树

**主问：Vite 开发为什么快？Vite 8 引擎是什么？**

- L1：原生 ESM + 按需 + 预构建。  
  - L2：2–7 vs 8 矩阵；能否说生产一定 Rollup？  
    - L3：如何确认已切 Rolldown/Oxc？收口：主版本 + 日志 + 新配置入口 + 警告清零。

**主问：为什么还会「开发过、生产挂」？**

- L1：两条消费路径，统一 bundler ≠ 同模块图。  
  - L2：条件导出 / ssr.external / apply:build。  
    - L3：如何固定提交对比？收口：dev + build + preview 解析日志。

**主问：Vite 8 怎么分包？**

- L1：只用 `codeSplitting`，不混 `manualChunks`。  
  - L2：`cacheDir` vs 模块级缓存。  
    - L3：如何证明无哈希级联？收口：manifest 对照 + 二次访问命中。

**主问：Webpack 和 Vite 怎么选？Rspack / Rolldown？**

- L1：模型与锁定因素，不比口号。  
  - L2：Rspack 留 WP API；Rolldown 进 Vite 管线。  
    - L3：大仓立刻迁 Vite？收口：量化痛点 + 同 SHA 双跑 + 可回滚。

**主问：联邦在打包题里讲到哪？**

- L1：shared ≠ externals；eager 伤入口。  
  - L2：内置 MF vs MF 2.0 增强层。  
    - L3：何时转到微前端题库？收口：运行时协商 / 故障边界不在本题展开。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| Vite 开发 / 插件 / optimizeDeps | [24-vite Q1](/interview/questions/24-vite)–[Q4](/interview/questions/24-vite) |
| SSR / library / Worker / CSS | [24-vite Q5](/interview/questions/24-vite)–[Q9](/interview/questions/24-vite) |
| mode/command、升级 Rolldown | [24-vite Q10](/interview/questions/24-vite)–[Q12](/interview/questions/24-vite)、[D5](/interview/questions/24-vite) |
| HMR / 虚拟模块 / CJS | [24-vite D1](/interview/questions/24-vite)、[D2](/interview/questions/24-vite)、[D4](/interview/questions/24-vite) |
| 环境变量泄漏 | [24-vite D7](/interview/questions/24-vite)；[03-engineering](/interview/questions/03-engineering) |
| Webpack 流程 / 分割 / tree shaking | [25-webpack Q1](/interview/questions/25-webpack)–[Q5](/interview/questions/25-webpack) |
| 缓存 / Source Map / HMR | [25-webpack Q7](/interview/questions/25-webpack)–[Q9](/interview/questions/25-webpack) |
| 选型与 Rspack/Rolldown | [25-webpack Q10](/interview/questions/25-webpack)、[Q11](/interview/questions/25-webpack)、[D7](/interview/questions/25-webpack) |
| 联邦打包原则 | [25-webpack D6](/interview/questions/25-webpack)；运行时 → [12-microfrontend](/interview/questions/12-microfrontend) |
| 体积归因 / 制品晋级 | [03-engineering Q4](/interview/questions/03-engineering)、[D1](/interview/questions/03-engineering)、[D5](/interview/questions/03-engineering) |

相关复习页：[工程与质量速记](/interview/review/sheets/03-engineering-quality)、[微前端架构专题](/interview/review/topics/09-microfrontend-architecture)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 先报 Vite 主版本；开发按需 vs 生产打包。
2. **（2 分钟）Vite 8 口径：** Rolldown+Oxc；**生产不是默认 Rollup**；配置入口迁完。
3. **（2 分钟）插件与 env：** resolve/load/transform；`VITE_` 非加密；产物扫描。
4. **（2 分钟）分包与缓存：** 只用 `codeSplitting`；两层缓存区分；级联验收。
5. **（2 分钟）Webpack 5：** loader vs plugin；runtime chunk；filesystem 缓存输入。
6. **（2 分钟）选型：** Vite / 留 WP5 / Rspack / Rolldown 四象限各一句。
7. **（2 分钟）联邦边界：** 内置 vs MF 2.0；shared ≠ externals。
8. **（2 分钟）工程收口：** 用模板讲一次升级或分包事故（数字〔填〕）。

自检口令：

- 「Vite 8 生产默认是 Rollup 吗？」→ **否；默认 Rolldown（+ Oxc）。**
- 「还能用 manualChunks 讲 Vite 8 吗？」→ **对象形式已移除；用 codeSplitting。**
- 「Rspack 和 Rolldown 一样吗？」→ **不一样：兼容 Webpack vs 进入 Vite/Rollup 管线。**
- 「Webpack 5 内置联邦 = MF 2.0？」→ **不等于；增强层另论。**
- 「dev server 体积能当生产证据吗？」→ **不能；必须同一次 `build`/`preview` 制品。**
- 「WP 与 Rspack 能共用 filesystem 缓存吗？」→ **不能；序列化不兼容。**
- 「能构建等于迁移完成吗？」→ **否；弃用警告清零 + 五路径回归才算。**
