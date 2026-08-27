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

开发态不是「先打完整生产包再起静态服务器」。浏览器按原生 ESM 请求源码，Vite 只转译当前图里真正被访问的模块。裸导入先预构建成 ESM，并改写成带版本查询的缓存 URL。

- **Vite 2–7：** 默认 esbuild 做依赖优化与 TS / JSX 转译，**生产默认 Rollup**；Vite 7 的 `rolldown-vite` 只是可选预览。
- **Vite 8：** 默认 **Rolldown + Oxc**：`optimizeDeps.rolldownOptions`、转译走 `oxc`、生产与 Worker 走 `build.rolldownOptions` / `worker.rolldownOptions`。

类型检查仍交给 IDE / `vue-tsc`，不绑进按文件转译。冷启动快不代表大仓 HMR 一直快：失效面过宽、插件扫全仓、找不到 accept 边界都会整页刷新。Oxc 加快转译，不能掩盖坏的 `handleHotUpdate`。

### 2. 插件钩子、env 与 optimizeDeps

`resolveId` 收稳定 id（含虚拟模块 `\0`）；`load` 取源码；`transform` 改写并返回可组合 Source Map。Vite 8 扩展 Rolldown 插件接口，并行钩子在 Rolldown 中按顺序执行。虚拟模块必须 resolve + load 成对，查询参数是 id 一部分。

`import.meta.env` 按 `envPrefix`（默认 `VITE_`）暴露；是构建期替换，不是服务端秘密保险箱。`define` 做标识符级替换，值应 `JSON.stringify`。没有前缀仍可能经 `define` / 自写插件泄漏——产物与 map 都要扫。

预构建缓存在 `node_modules/.vite`：新依赖、新入口、`include`/`exclude`、锁文件变化会 re-optimize。Vite 8 应迁到 `optimizeDeps.rolldownOptions`；旧 `esbuildOptions` 仅兼容层。反复删 `.vite` 不是根因分析。

### 3. 生产构建、分包与「开发过、生产挂」

即便 Vite 8 用 Rolldown + Oxc 统一 bundler，开发和生产仍是两条消费路径：开发按需 + HMR；生产整图打包、tree-shake、拆 chunk、压缩，并应用 `apply: 'build'` 插件。条件导出、`ssr.external`、仅客户端模块仍可能只在生产暴露。

**Vite 8 分包只使用 `build.rolldownOptions.output.codeSplitting`（groups 等）**；对象形式 `manualChunks` 已移除，函数形式已弃用。兼容层能改写部分旧配置 ≠ 应继续混写两代入口。验收用 manifest + 网络瀑布；公共 chunk 哈希变化会级联异步块失效。

`cacheDir` 主要是依赖预构建缓存；Rolldown 模块级持久化缓存是另一层，开关以目标版本文档为准——别把「删 `.vite` 变慢」直接当模块级命中证据。

library mode：对等依赖（如 `vue`）必须 external，写在 `build.rolldownOptions`；打进 bundle 会出现双运行时。Worker 用 `new URL(..., import.meta.url)` 或 `?worker`；Vite 8 配 `worker.rolldownOptions`。

### 4. SSR 外部化、CSS、mode vs command

SSR 默认外部化多数 npm 依赖，让 Node 直接加载；需走 Vite 管线的列入 `ssr.noExternal`。框架约定见 Nuxt 题库，本题只谈模块图。浏览器 API 禁止出现在 SSR 入口顶层；服务端单例会串请求。

CSS Modules 用 `*.module.css`；Vite 8 默认 Lightning CSS 压缩，可临时回退 `build.cssMinify: 'esbuild'`（需自装 esbuild）。`additionalData` 给每个 Sass 打针会扩大 HMR 失效面。

`command` 是 `serve` / `build`；`mode` 是环境名。`vite build --mode development` 仍是生产构建命令，只是加载 `.env.development`——不会得到开发服务器行为。`server.proxy` 只作用于开发，生产靠网关；代理通 ≠ Cookie Domain 在预发一致。

### 5. 升级到 Vite 8：如何确认切到 Rolldown / Oxc

以 `vite` 包主版本、changelog 和构建日志为准，不是沿用「预构建一定 esbuild、生产一定 Rollup」。应看到可迁到 `oxc`、`optimizeDeps.rolldownOptions`、`build.rolldownOptions` 的弃用提示。真正完成迁移：长期配置换新入口、弃用警告清零、对象 `manualChunks` 删除，dev / build / SSR / Worker / preview 同提交回归。复杂项目可先在 Vite 7 换 `rolldown-vite` 隔离打包器问题，再升 8。

### 6. Webpack 5：编译图、分割与缓存

Compiler 创建 Compilation：`make` 建模块图（resolver → loader 管道 → 抽依赖），`seal` 树摇 / 分包 / 哈希，`emit` 写出。loader 变换单模块（配置数组右→左）；plugin 挂 Tapable 生命周期。

代码分割：多入口、`import()`、`splitChunks`。runtime chunk 抽出加载映射；不抽则异步块增删常改入口哈希，长期缓存失效。tree shaking 要静态 ESM + 可信 `sideEffects`；`sideEffects: false` 可能误删 CSS。asset modules（`asset/resource|inline|source|asset`）替代常见 file/url/raw-loader。

`cache.type: 'filesystem'` 合法失效来自版本、`buildDependencies`、`cache.version/name`、snapshot；不该失效却失效常因 name 未隔离 mode。改配置仍命中旧缓存 = 缺 `buildDependencies`。Webpack 与 Rspack **不能**共用同一缓存目录。

`devtool`：开发常见 `eval-cheap-module-source-map`；生产用 `hidden-source-map` 上传监控后删 `.map`。HMR 是开发模块替换协议，不是生产热更新方案。

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

存量大仓通常不应立刻整仓迁 Vite：先量化冷启动 / HMR / CI / 插件锁定 / 联邦协议。痛点主要是速度且要留配置 → 常先评 Rspack；新入口可 Vite，核心仓待 loader 有替代再迁。Webpack 4 应先升到 5（资源模块、持久化缓存、无自动 Node polyfill），再换引擎，否则差异无法归因。

### 8. Module Federation 打包边界（点到为止）

`shared` 是运行时版本协商，不是换皮 `externals`。打包侧决定登记进 Share Scope、`singleton`、`requiredVersion`、`eager`；真正选实例在运行时。

**Webpack 5 内置 `ModuleFederationPlugin`** 提供容器与共享核心能力；**独立 Module Federation 2.0（`@module-federation/enhanced`）** 才有 Manifest、Federation Runtime、Runtime Plugin、动态类型等增强——**不能**把 MF 2.0 能力倒推为所有 Webpack 5 项目自带。运行时协商、故障边界见微前端专题。

### 9. HMR、虚拟模块、Monorepo 与 Source Map（两端对照）

Vite：`import.meta.hot.accept` 是接受边界，`dispose` 拆旧副作用；模块作用域单例热替换会造第二份实例——连续保存 20 次断言连接数不增长，接不住就 `invalidate`。虚拟模块用户侧 `virtual:…`，内部 `\0`；每个 `transform` 必须组合 Source Map，只在 dev 实现 `load` 会导致「本地过、制品空」。Monorepo 链接包要显式 `optimizeDeps.include` / `ssr.noExternal`，`server.fs.allow` 收紧到 workspace；多应用默认独立 `cacheDir`。

Webpack：HMR 经 WebSocket 推哈希再拉 `hot-update`；无 accept 则冒泡整页刷新。loader 链任一环丢 map，最终栈会停在中间 JS；生产 map 必须绑定同一次制品，不能事后重打。`DefinePlugin` 与 Vite `define` 一样是印发字面量：漏 `JSON.stringify` 会变成标识符；密钥与内网地址不能走构建期注入。多环境晋级优先运行时配置（见工程化题库）。

### 10. 迁移剧本：同一 SHA 双跑，而不是口号换栈

遗留仓真实锁通常是：自定义 loader/plugin、Webpack 4 残留、Node polyfill、多入口 HTML、内置联邦。路径建议：先升干净 Webpack 5 并打开 filesystem 缓存拿基线 → 痛点是 CI/冷启动且要留配置则开 Rspack 分支 → 新微应用可 Vite 起步，壳层保持原打包器直到协议稳定。双跑最少看：入口与异步 chunk 清单、重复模块、关键路由体积、Source Map 还原、单测/关键 E2E、CI 墙钟、失败插件列表；有联邦再加 host×remote 冒烟。两边缓存目录必须隔离。自定义插件无替代、联邦矩阵未过、或当前 WP5 已满足体验时，应明确**不迁移**并写复审日期——拒绝迁移和推进迁移一样需要证据。

面试收口句：「我先报版本矩阵，再讲开发/生产两条路径，最后用同一提交的产物清单和弃用警告清零证明迁移完成；Rspack 与 Rolldown 分别对应留 Webpack API 与进 Vite 管线，绝不混谈。」


### 11. 体积归因与请求数：工程化题里怎么接到构建器

体积问题先看见再归因：treemap 归属、import 链、直接/传递依赖、插件是否误带。固定同一构建模式复测 gzip/brotli、首屏下载与重复模块。Vite 2–7 诊断 `manualChunks`；Vite 8 诊断 `codeSplitting`——旧配置可能被兼容层转换，但不能当长期接口。体积与请求数权衡：过碎增加调度与解析税，过大拖垮首屏；用关键路由总字节、请求链深度、主线程时间与 RUM 说话。

生产 Source Map：Vite 用 `hidden` 生成独立 map 不写引用，CI 上传监控后从发布目录删除；没有 `nosources` 这个 Vite 取值，排除 `sourcesContent` 走底层 `sourcemapExcludeSources` 或监控平台。Webpack 侧 `hidden-source-map` / `nosources-source-map` 语义相近但配置名不同，不要混套。缺 map 时不能事后重打冒充，只能结合 chunk 名、用户路径与二分回滚。

### 12. 插件顺序、CJS 互操作与「能跑」的假象

同一钩子内：`enforce: 'pre'` → Vite 核心 → 普通插件 → `post`。`apply` 跟 command 不跟 mode。要看原始源码用 `pre`；要看 env 替换与资源改写之后用 `post`。Rolldown 把部分并行钩子改顺序执行，更不能靠「碰巧并行」掩盖依赖。

CJS default：Vite 8 按 importer 是否 ESM 与 `__esModule` 对齐规则，消掉一类「dev 能跑、build 取到 undefined」。可疑包显式 `include`；`exclude` 错用会把 CJS 原样送进浏览器。遗留互操作开关只能当短期逃生舱。

面试收口再强调一次：**Vite 8 生产默认不是 Rollup；Rspack 不是 Rolldown；内置联邦不是 MF 2.0。** 三句说错任一句，前面讲得再顺也容易被一票否决。



### 13. 配置评审时我最常问的六个问题

1. 当前 Vite 主版本是多少？生产日志里是 Rolldown 还是仍在讲 Rollup 默认？
2. 分包配置是否只保留一代入口？有没有并行的 `manualChunks` 残留？
3. `optimizeDeps` / `ssr.noExternal` / `server.fs.allow` 是否写了原因与验收方式？
4. 文件系统缓存的 name/version/CI key 是否隔离 mode 与打包器？
5. 客户端产物与 Source Map 是否做过密钥与内网域名扫描？
6. 若存在 Module Federation：用的是内置插件还是 enhanced？文档链接指向哪一套？

把这六问变成 PR 模板，构建事故会少很多。十年经验不是多背两个钩子名，而是让「版本、证据、回滚」成为默认语言。面对「要不要迁 Vite」时，先要冷启动/HMR/CI 分钟数/插件锁定表，再决定留 WP5、上 Rspack 还是新入口 Vite——没有表就拒绝拍板。



### 14. Webpack 深层故障口述：摇树、分包、缓存污染

摇树要静态 ESM 与可信副作用表；环上的暂时性死区会在 production 拼接后以 `undefined` 出现，开发却「碰巧能跑」。`export *` barrel 会摊平依赖边，让环与未使用导出更难看清。过度 `splitChunks`：HTTP/2 消除不了每个小脚本的调度与解析税，runtime 映射变长还会伤害长期缓存。收回时提高 `minSize`、合并过碎 vendor，用二次访问命中率与主线程解析时间验收。

缓存污染是「错误输入被当成可复用输出」。隔离靠 name/version/CI key；取证靠对比输入哈希与命中记录，删目录只能消症状。手工改 `node_modules` 常不触发失效，因为 managedPaths 按包身份视为稳定。Webpack 与 Rspack 序列化不兼容，严禁共用缓存目录。迁移对照必须各自干净缓存各打一次。

`DefinePlugin` / 环境注入事故与 Vite 侧同类：能进浏览器的值都是公开数据；多环境晋级用运行时配置。联邦打包题只答到 shareKey/eager/内置与 2.0 分界，运行时协商甩到微前端专题——这是边界感，不是偷懒。

### 15. 一张「构建器决策」小抄

| 信号 | 倾向 |
| --- | --- |
| 新应用、无 WP 专有插件 | Vite 8 |
| 冷启动/CI 痛，配置资产重 | 评 Rspack |
| 要换开发模型与生态 | Vite 8 / Rolldown |
| 内置联邦已绑死且稳定 | 可留 WP5，增强需求再评 MF 2.0 |
| Webpack 4 残留 | 先升 5 再谈换引擎 |

答辩时把表拍在白板上，比背钩子列表更有架构味道。



### 16. 十五分钟里如何分配构建器口述时间

前两分钟只做三件事：报 Vite 主版本与「8 默认 Rolldown/Oxc、不是 Rollup」；画开发按需与生产整图两条路径；声明 Rspack≠Rolldown、内置联邦≠MF 2.0。中间八分钟按听众兴趣二选一深挖：要么 Vite 插件/预构建/分包验收，要么 Webpack loader/runtime chunk/缓存隔离。最后五分钟用一个自己的迁移或分包事故走「约束→方案→取舍→验证→防护」，数字必须来自真实项目坑位。超时就砍配置细节，不砍版本口径与证据——口径说错是硬伤，细节不全可以后补。

若面试官是工程效能方向，主动提：制品晋级与运行时配置、Source Map 上传后删除、体积归因流水线。若是业务架构方向，主动把联邦边界甩到微前端，并强调「先 Monorepo 壳，再运行时装配」。看人下菜，但红线句子不变。


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

证据坑位（填你的数）：

- 冷启动 P50〔填〕；生产 CI 构建分钟数〔填〕。
- 升级 Vite 8 后弃用警告数〔填〕→ 0 的耗时〔填〕。
- 关键屏关键 JS gzip〔填〕；过度分包回收后 LCP 变化〔填〕。

构建器面试的胜负手往往不在「谁更快」口号，而在你是否能在白板上画出版本矩阵、两条消费路径、缓存隔离键，以及一次失败发布的回滚面。把 Vite 8 / Rolldown、Rspack、Webpack 5、MF 内置与 2.0 的边界说清，已经超过多数背配置的候选人。留下你自己的 CI 分钟数、弃用警告清零耗时与分包前后 LCP，故事才闭环。


在追问「开发过生产挂」时，固定三步取证：同一锁文件与提交；对比失败模块在 dev 与 `vite build`/`preview` 的解析路径与条件导出；确认 `apply:'build'` 插件与压缩假设。不要先改业务代码碰绿。升级答辩则固定四步：主版本与 changelog、新配置入口、弃用警告清零、五条路径回归（dev/build/SSR/Worker/preview）。两套步骤比临场发挥稳。

自检时再默念一遍：Vite 8 生产默认 Rolldown；分包只讲 codeSplitting；Rspack 留 Webpack 心智；Rolldown 进 Vite 管线；内置联邦没有 MF 2.0 的 Manifest 与 Runtime Plugin。五句全对，构建器专题就不容易翻车。

若时间只够一分钟收口：报版本、画双路径、点出 Rspack/Rolldown/MF 三条边界、甩一个带数字的事故。够用了。

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
