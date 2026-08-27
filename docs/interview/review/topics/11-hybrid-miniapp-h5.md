# Hybrid / 小程序 / H5

> **真源：** [19 Hybrid App](/interview/questions/19-hybrid-app)（主容器 / Bridge）；[06 uni-app / 小程序](/interview/questions/06-uniapp-miniprogram)；[05 Vant H5](/interview/questions/05-h5-vant)。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背「一套代码多端跑」口号，而是证明你能在**平台约束**下交付可审核、可观测、可回滚的链路：

**目标端约束 → 容器 / 运行时差异 → Bridge 或登录会话契约 → 包体与真机性能 → 合规与灰度回滚。**

面试官想听四类能力：

1. **差异感：** Android WebView ≠ iOS WKWebView ≠ 系统浏览器；小程序双线程 ≠ H5 DOM；uni-app 条件编译是能力边界不是复制许可证。
2. **协议感：** JSBridge 要 message id、版本、超时、取消、能力探测与来源校验；小程序登录是 code 换会话，隐私按需授权。
3. **真机感：** `setData`、原生组件层级、安全区、软键盘、返回栈必须以真机矩阵验收。
4. **合规感：** 热更新 / 资源包要签名哈希与商店条款分平台评估；审核文案与真实采集一致。

口述红线（与题库冲突即扣分）：

- 用 App 版本号替代 capability 列表；用 UA 猜 Bridge 能力；
- 把同域 WebView / 同 data store 清理当成账号隔离；
- 条件编译把业务写成井号地狱；把开发者工具指标当生产绝对真理；
- 离线队列持久化 Token / 支付材料；热更新下载原生可执行代码绕过商店；
- 把 Apple 与 Google Play 规则合并成「统一禁令」一口咬定。

具体系统、内核、框架与商店政策以目标版本和当期官方条款为准；题库强调真机与复核，不背过期政策条文当永久真理。

跨端合题最容易翻车的三种说法：「一套代码零成本」「开了 WebView 调试就等于生产可观测」「热更新等于可以绕过商店」——面试里主动否定它们，比多背三个 API 更加分。

## 知识地图

```text
选型 / 约束              小程序 / uni                 Hybrid 容器                 H5 / Vant
目标端·团队·合规    →   双线程·分包·登录隐私   →   WebView·Bridge·生命周期 → 适配·安全区·弱网
真机矩阵                 条件编译适配层               资源包签名灰度回滚         返回栈·键盘·List
发布审核 / 域名          setData / 原生组件           Cookie / SSO / 权限         埋点与 CWV 分端
```

主线口诀：

1. **先列约束与验收指标，再选容器**
2. **Bridge / 会话是版本化 RPC，不是全局注入玩具**
3. **小程序抓传输与主包，Hybrid 抓协议与隔离，H5 抓真机体验**
4. **预加载与池化有预算；隔离失败就不要跨账号复用**
5. **热更新讲供应链，不讲绕过审核**
6. **证据来自真机矩阵与分桶指标，不来自 Demo 秒开**

## 完整讲解

### 1. 选型：Hybrid / 小程序 / H5 / 更高成本方案

Hybrid = 原生壳 + WebView + Bridge + 插件 + 资源发布；适合活动、表单、多端复用与部分核心流程，重图形 / 持续后台 / 深平台集成未必合适。小程序有包体、双线程、审核与类目约束。H5 / Vant 适合投放链与站内页，但 WebView 内还有容器差异。RN / Flutter / 原生成本更高，用目标端、离线、性能预算、插件依赖与商店合规逐页选择——**不为简历追新**。决策应同时看迭代频率、端间复用、启动首屏、帧率内存、故障隔离与审核约束，用代表性真机样例比较，不能只依据框架宣传或单次跑分。

**机制：** 先列目标端、包体、审核、首开预算与团队技能，再选 Hybrid / 小程序 / H5 / 更高成本方案。约束表比框架宣传优先。

**失败形态：** 为简历追新上 RN/Flutter；用单次跑分代替真机矩阵；「一套代码零成本」开场。

**验收：** 代表页对比交付周期、缺陷与审核风险；不匹配则书面不选。### 2. 小程序双线程、分包与 uni-app 适配

逻辑层与渲染层分离：频繁、大体积 `setData` 是首要性能税——减字段、合并更新、局部更新；长列表与原生组件以微信真机为准。开发者工具可以找逻辑错误，但不能替代真机滚动与同层渲染结论。主包有体积硬顶；分包 / 预下载 / 独立分包按**首开 + 二跳**一起决策，预下载不是越多越好；公共代码下沉与图片外置要进发布清单，避免「拆了分包主包仍胖」。

条件编译（`#ifdef MP-WEIXIN` / `H5` / `APP-PLUS`）只表达真正平台差异；支付、登录、文件系统沉到 `platform` 适配层，页面调统一接口；文件级拆分优于满屏 ifdef。生命周期在 Vue / 小程序 / App 间并非一一对应，禁止假设同名钩子同语义。`rpx` 按屏宽折算；与 H5 rem/vw 混用要固定设计稿基准。input / video / map / canvas 有层级与同层渲染坑。

登录：code → 服务端换会话 → 前端持可控会话；续期与失效路径要状态机。隐私 scope 按需申请、可拒绝、可引导设置页；用户信息 / 手机号等受政策与组件约束，不能按旧「一键拿资料」口述。合法域名、隐私指引、订阅消息进发布门禁；审核驳回常因文案与采集不一致。npm / 插件锁版本、评估主包、可回滚——H5 能用的包 ≠ 小程序能用。

**机制：** 逻辑层与渲染层分离，`setData` 是首要性能税；主包硬顶下按首开+二跳拆分包；条件编译只表达真差异，支付/登录沉适配层。登录是 code 换会话的状态机，隐私按需可拒。

**失败形态：** 开发者工具指标当生产真理；预下载越多越好拖慢首开；ifdef 井号地狱；旧「一键拿用户资料」口述。

**验收：** 真机滚动与同层渲染；主包体积门禁；隐私拒绝路径产品化。证据坑位：〔填〕主包体积与一次审核驳回原因。

### 3. Hybrid：WebView 差异、Bridge、生命周期与返回栈

Android WebView（Chromium 体系、厂商碎片）与 iOS WKWebView（WebKit、多进程）API、Cookie、进程恢复不能直接类比。建立 Android 版本 × WebView 版本与 iOS 版本矩阵；UA 相似只是线索。

Bridge 当跨进程 RPC：唯一 message id、协议 version、method、页面身份、导航代次；稳定成功 / 错误联合类型；超时≠副作用未发生，故要取消语义与幂等键。启动握手返回细粒度 capability（如 `camera.capture@2`），**App 版本不能替代能力表**。Android 敏感通道优先 `WebViewCompat.addWebMessageListener` + 精确 HTTPS `allowedOriginRules`，并校验 `sourceOrigin` / `isMainFrame`；legacy `addJavascriptInterface` 不能承担逐消息来源鉴权。iOS 注意 handler 强引用环与主线程交付。页面销毁批量拒绝未完成调用，防串页回调。主版本不兼容直接拒绝并降级；次版本只增加可选字段，旧端忽略未知字段，不能悄悄改既有错误码含义。

生命周期：前后台、WebContent 进程终止、内存回收都是正常故障模型。关键草稿增量持久化；恢复校验用户与 App / 资源 / schema 版本后对账服务端；旧 Bridge 上下文全部 `CONTEXT_LOST`。Native 返回栈与 Web 路由要协议化同步，避免双栈各管各的导致「按返回没反应 / 一次退出两层」。调试用同一 trace 串 Web Console 与 Native 日志，生产关闭未授权调试入口。

**机制：** Bridge 当版本化 RPC：message id、capability 握手、超时≠副作用未发生、销毁批量 reject。Android/iOS WebView 差异进真机矩阵；返回栈与 Web 路由协议化同步。

**失败形态：** UA 猜能力；App 版本号替代 capability；串页回调；双栈各管导致返回失灵。

**验收：** 跨页压测迟到回调；能力协商契约测；生产关未授权调试。证据坑位：〔填〕Bridge 失败率与一次串页修复。

### 4. Cookie、权限、文件与启动白屏

Cookie / SSO 依赖真实页面 origin（`localhost`、自定义 scheme、框架配置都会改 SameSite / CORS 假设）。iOS 独立持久 `WKWebsiteDataStore(forIdentifier:)` 仅 **iOS 17+**；低版本敏感隔离用独立非持久 store，或放弃跨账号池化。`WKBackForwardList` 无公开清空 API——要空历史就新建 WKWebView。Android 多 Profile 能力要检测后在 UI 线程创建并立即绑定；不能把「事后清共享 store」当隔离。Capacitor / Cordova / uni-app App 的本地 origin 差异必须写进联调清单，否则会出现「浏览器能登录、App 内 Cookie 全丢」的假 bug。

相机 / 定位 / 文件：系统权限在 Native，Web 只发起；拒绝与降级路径产品化。上传下载走受控通道，文件 URI 与权限按平台测。启动白屏拆阶段：原生启动、容器创建、导航、资源、JS、业务首屏；预加载有命中率与内存预算。池化只服务预先设计的隔离域。FCP 不等于业务首屏，白屏应按无有效内容的持续区间与超时失败率统计，并关联版本与冷暖启动。

**机制：** Cookie/SSO 依赖真实页面 origin；账号隔离看独立 store 能力（iOS 17+ 等），低版本勿跨账号池化。权限在 Native，Web 只发起。白屏拆原生启动→容器→导航→资源→JS→业务首屏。

**失败形态：** 事后清共享 store 当隔离；浏览器能登、App 内 Cookie 全丢未写进联调清单；用 FCP 冒充业务首屏。

**验收：** 切账号后 Cookie/历史/草稿；白屏分阶段看板。证据坑位：〔填〕一次串号登录与隔离域改造。

### 5. 资源热更新与商店合规

在线资源走 HTTP 缓存语义；离线包要版本清单、签名、每文件 hash、大小上限、兼容范围；独立目录下载校验后**原子切换指针**，失败沿用旧版。TLS 只保护传输，不能替代制品签名与防回滚。灰度分桶稳定；熔断回 LKG。文件 hash 能发现内容变化，但不能单独证明来源——清单需受信私钥签名，客户端再校验版本与防回退。

合规分平台：Apple 评估 2.5.2 与 4.7 / 4.7.2 等条件；Google Play 对 WebView / 解释器 JavaScript 有例外但仍受内容政策约束——**不能合并成一条统一禁令**，每次发布复核当期条款。回滚不依赖从商店外下发 dex / `.so` 等原生可执行代码。历史批准不是永久许可；有疑问时走正式审核或完整 App 版本发布，不为赶工期踩红线。

**机制：** 离线包要清单签名、每文件 hash、原子切指针、灰度与 LKG；TLS 只保护传输。Apple/Google 条款分平台评估，不能合成统一禁令。

**失败形态：** 热更新下发原生可执行代码；只靠文件 hash 无签名；历史批准当永久许可。

**验收：** 失败沿用旧版；熔断切 LKG；发布前复核当期条款。证据坑位：〔填〕一次资源回滚耗时。

### 6. H5 / Vant：适配、安全区、弱网、键盘与列表

适配：vw / rem / 现代响应式先定目标；viewport 常 `width=device-width, initial-scale=1, viewport-fit=cover`；Vant 按 375 约定，改根字号别带飞组件库。大屏限宽、横屏降级、折叠屏保守布局要有产品策略。安全区：协议声明唯一消费者——原生已 inset 则 H5 不再叠加，全屏铺边才由 H5 `env()` 或 Bridge 可信值。

滚动穿透、软键盘顶起、固定底栏要状态机恢复，不能只 `overflow:hidden` 碰运气。弱网：骨架 / 超时文案 / 可重试读；写路径幂等。离线队列只存最小非敏感载荷与幂等键，**禁止** Token、支付材料、身份证；恢复数据当不可信输入重新鉴权校验。物理返回 / 右滑与路由栈协议一致；列表返回恢复绑定路由 key、筛选与数据版本，交易字段过期必须刷新。

Vant List / PullRefresh：分页状态、空态、错误态、加载锁防抖；图片懒加载兼顾占位与流量。首屏抓关键路径 JS 与 LCP 资源；活动页可少引整库。埋点异步且不影响 CWV；分端 p75 看 LCP / INP / CLS（题库基线：良好 LCP ≤ 2.5 s、INP ≤ 200 ms、CLS ≤ 0.1，以当期官方为准）。WebView 内还要把原生启动到导航的阶段与 H5 CWV 分开归因，不能让 LCP 独自背锅。

**机制：** 适配与安全区声明唯一 inset 消费者；弱网读写状态机；List/PullRefresh 防抖锁；CWV 分端 p75（良好 LCP≤2.5s、INP≤200ms、CLS≤0.1，以当期官方为准）。

**失败形态：** 原生与 H5 各加一次安全区；Axios 全局自动重试创建；离线队列存 Token/支付材料。

**验收：** 刘海/横条真机；弱网重放下单；队列无敏感载荷。证据坑位：〔填〕H5 分端 LCP/INP 与一次重复下单修复。

### 7. 监控与故障归因

贯穿 navigation id、page instance、message id、request id、服务端 trace；日志带 App / 系统 / WebView / 资源包 / 页面 / Bridge 版本与导航代次；脱敏。前端异常 ≠ Native 崩溃 ≠ WebContent 终止。小程序侧同样要分「逻辑层错误 / 渲染问题 / 审核配置」。用分桶长尾排序，不看平均值报喜。

**机制：** 同一 trace 串 navigation/page/message/request/服务端；日志带 App/系统/WebView/资源包/Bridge 版本；前端异常 ≠ Native 崩溃 ≠ WebContent 终止。

**失败形态：** 开了 WebView 调试就当生产可观测；只看平均值；小程序逻辑错误与审核配置混谈。

**验收：** 分桶长尾看板；脱敏字段白名单；版本关联告警。### 8. uni-app App / Capacitor / Cordova：名字像不代表行为像

uni-app App 端属于其跨端编译与运行体系，页面形态与原生渲染能力随模式、平台、插件变化，不能假设与小程序 / H5 完全一致。Capacitor 强调现代 Web 嵌入原生工程、原生项目可见；Cordova 生态长但要逐项评估维护状态。三者本地页面 origin 可能是 `localhost`、自定义 scheme 或框架配置——Cookie、SameSite、OAuth 回调必须按运行时 origin 重做，不能沿用普通 HTTPS 站点假设。迁移时盘点插件 API、导航、文件 URI、权限与签名，名称相似 ≠ 行为一致，要用真机契约测试分版本灰度。没有真机矩阵与回滚方案的「一套代码」只是演示。

**机制：** uni-app App / Capacitor / Cordova 本地 origin、插件与导航行为各异；Cookie/OAuth 按运行时 origin 重做；迁移用真机契约测试分版本灰度。

**失败形态：** 名称相似当行为一致；无回滚的「一套代码」上生产。

**验收：** origin/权限/文件 URI 分端清单；灰度可回滚。### 9. 小程序发布供应链与支付 / 分享闭环

发布链路：开发 → 体验 → 审核 → 灰度。合法域名、隐私指引、类目与权限声明进门禁；体验版不等于审核通过。插件与 npm：锁版本、评估主包占用、保留回滚包；支付、分享、`open-type` 等要用户手势与结果确认，服务端验签防刷，不能只信前端回调。订阅消息按场景申请，拒绝与关闭路径产品化，避免「为了触达把用户烦走」。Storage 有容量与键治理：会话与草稿分区，敏感最小留存，注销清理；WebView 与主包数据边界写清楚，防止 H5 页假定能读到小程序私有存储。多环境域名与请求合法域名清单要可追溯，切环境不能靠改代码里的魔法字符串。

**机制：** 开发→体验→审核→灰度；支付/分享要手势与服务端验签；Storage 分区与注销清理；域名清单可追溯。

**失败形态：** 体验版当审核通过；只信前端支付回调；切环境改魔法字符串。

**验收：** 发布门禁含隐私/域名；支付验签；回滚包可取。### 10. H5 弹层、键盘与返回：做成可恢复状态机

遮罩打开时锁住背后滚动，关闭后恢复原滚动位置；多层弹层要栈，而不是全局一个 `overflow` 开关。软键盘顶起：区分浏览器与 App WebView，优先用视觉视口 / Bridge 高度事件，避免只听 `resize` 猜。第三方原生键盘 SDK 通过 Bridge 约定 shown / hidden / height，展示期间暂停 H5 自己的位移修复。物理返回：先关弹层 / 再退路由 / 最后交给原生——协议写死消费者顺序。列表页缓存绑定路由键、筛选与数据版本；价格库存过期必须刷新，不能为保 `scrollTop` 长期展示旧价。

**机制：** 弹层栈恢复滚动；键盘用视觉视口/Bridge 高度；物理返回顺序：关弹层→退路由→交原生。

**失败形态：** 全局一个 overflow 开关；只听 resize 猜键盘；保滚动长期展示旧价。

**验收：** 多层弹层与返回栈真机；过期字段强制刷新。### 11. 弱网读体验与离线写边界

读：超时骨架、可重试、关键字段优先；图片懒加载与占位控制流量。写：请求状态机 idle / pending / unknown / success / failure；Axios 全局自动重试创建类接口是事故源。离线队列只存完成恢复所需的最小非敏感载荷与幂等键；复杂草稿优先服务端。支付超时只查单不自动重发。Service Worker 若启用，只缓存版本化静态与明确可公开 GET，HTML 短缓存或 Network First；部分 WebView 不支持 SW，必须保留在线降级。`navigator.onLine` 只表示网络接口状态，不保证业务服务可达，不能单独作为可提交条件。

**机制：** 读路径骨架/超时/重试；写路径 idle→pending→unknown→success/failure；离线队列最小非敏感载荷+幂等键；支付超时只查单；SW 仅缓存可公开资源且保留在线降级。

**失败形态：** 创建接口全局自动重试；队列持久化 Token；用 onLine 当可提交条件。

**验收：** 弱网重放不双单；队列无敏感字段；不支持 SW 的 WebView 仍可完成主路径。证据坑位：〔填〕弱网下单成功率与幂等拦截次数。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 目标端、包体、审核、首开预算、权限、团队技能 |
| **方案** | uni 适配层 / 原生分端 / Hybrid 页粒度 / 纯 H5 |
| **取舍** | 复用速度 vs 平台体验与合规成本 |
| **验证** | 真机矩阵、主包体积、桥失败率、返回栈、审核用例 |
| **复发防护** | 能力协商、契约测试、资源签名、灰度熔断 |

**案例 A — 「Bridge 偶发把上一页回调打到新页」**

- 约束：快速打开多 WebView。
- 方案：message id + 导航代次；销毁批量 reject；能力握手。
- 取舍：协议变严 vs 调用方要处理取消。
- 验证：跨页压测迟到回调。
- 防护：契约测试进 CI。

**案例 B — 「主包超限，预下载越加越慢」**

- 约束：微信主包硬顶。
- 方案：按首开/二跳拆分包；公共下沉；图片外置；预下载按下一跳概率。
- 取舍：二跳等待 vs 首开。
- 验证：体积表 + 真机指标。
- 防护：体积门禁与依赖准入。

**案例 C — 「池化 WebView 串号登录」**

- 约束：低端机想复用容器。
- 方案：iOS 17+ 才独立持久 store；低版本非持久或禁止跨账号池化；要空历史则新建实例。
- 取舍：内存 vs 隔离。
- 验证：切账号后 Cookie/历史/草稿。
- 防护：隔离域写入架构说明。

**案例 D — 「弱网重复下单」**

- 约束：H5 提交按钮连点 + 超时重试。
- 方案：请求状态机；幂等键；超时只查单；队列不存敏感凭证。
- 取舍：实现复杂度 vs 资损。
- 验证：弱网重放。
- 防护：写接口幂等 CR 清单。

**案例 E — 「安全区顶底各加一次，页面像被垫高」**

- 约束：沉浸式 WebView + Vant 底栏。
- 方案：协议声明唯一 inset 消费者；能力位协商；真机验收刘海与横条。
- 取舍：实现简单 vs 双端责任清晰。
- 验证：沉浸式 / 普通导航分测。
- 防护：安全区用例进发布清单。

证据坑位（填你的数）：

- 主包 / 分包体积〔填〕；首开与二跳〔填〕。
- Bridge 失败率 / 超时 p95〔填〕；白屏分阶段耗时〔填〕。
- 审核驳回次数与原因 Top〔填〕；热更新回滚耗时〔填〕。

跨端终局不是框架商标，而是你是否付得起真机矩阵、协议版本与合规复核的台账。小程序侧用传输字节与主包硬顶说话，Hybrid 侧用 capability 与隔离域说话，H5 侧用弱网幂等与返回栈协议说话。把主包体积、桥失败率和一次审核整改清单带进答辩，比演示「秒开」更像负责人。面试官若追问「你们是不是 all-in uni-app」，回答应回到约束表与退出成本，而不是表态站队。

## 追问树

**主问：小程序为什么卡？你怎么查？**

- L1：双线程与 `setData` 体积。  
  - L2：分包与预下载如何权衡？  
    - L3：原生组件层级？收口：真机 + 传输字节。

**主问：JSBridge 最小安全协议有哪些字段？**

- L1：id / version / method / 代次 / 错误契约。  
  - L2：为何不能只用 App 版本？Android 来源怎么验？  
    - L3：超时与取消语义。收口：握手 capability + 销毁清理。

**主问：Hybrid 热更新怎么讲才合规？**

- L1：签名、hash、原子切换、防回滚。  
  - L2：Apple / Google 为何要分开评估？  
    - L3：失败如何回 LKG？收口：供应链 + 当期条款复核。

**主问：H5 在 WebView 里返回键乱了怎么办？**

- L1：双栈协议谁消费返回事件。  
  - L2：弹层 / 键盘如何插入状态机？  
    - L3：列表恢复与数据过期。收口：协议 + 真机手势矩阵。

**主问：uni-app 何时该拆端？**

- L1：复用率、审核节奏、体验差异。  
  - L2：条件编译失控信号。  
    - L3：退出成本。收口：代表性页 PoC + 缺陷基线。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| Hybrid 架构 / WebView | [19-hybrid-app Q1](/interview/questions/19-hybrid-app)、[Q2](/interview/questions/19-hybrid-app) |
| Bridge 协议 / 安全 | [19-hybrid-app Q3](/interview/questions/19-hybrid-app)、[Q4](/interview/questions/19-hybrid-app)、[D1](/interview/questions/19-hybrid-app)、[D2](/interview/questions/19-hybrid-app) |
| 生命周期 / 返回栈 / Cookie | [19-hybrid-app Q5](/interview/questions/19-hybrid-app)–[Q7](/interview/questions/19-hybrid-app)、[D4](/interview/questions/19-hybrid-app) |
| 白屏池化 / 热更新合规 | [19-hybrid-app D3](/interview/questions/19-hybrid-app)、[Q10](/interview/questions/19-hybrid-app)、[Q13](/interview/questions/19-hybrid-app)、[D8](/interview/questions/19-hybrid-app) |
| 选型 | [19-hybrid-app D9](/interview/questions/19-hybrid-app) |
| 条件编译 / 分包 / 登录隐私 | [06-uniapp-miniprogram Q1](/interview/questions/06-uniapp-miniprogram)、[Q3](/interview/questions/06-uniapp-miniprogram)、[Q4](/interview/questions/06-uniapp-miniprogram)、[Q5](/interview/questions/06-uniapp-miniprogram)、[D2](/interview/questions/06-uniapp-miniprogram)–[D4](/interview/questions/06-uniapp-miniprogram) |
| setData / 真机性能 | [06-uniapp-miniprogram Q9](/interview/questions/06-uniapp-miniprogram)、[D1](/interview/questions/06-uniapp-miniprogram)、[D5](/interview/questions/06-uniapp-miniprogram) |
| H5 适配 / 安全区 / 弱网 | [05-h5-vant Q1](/interview/questions/05-h5-vant)–[Q4](/interview/questions/05-h5-vant)、[D1](/interview/questions/05-h5-vant)、[D3](/interview/questions/05-h5-vant) |
| 键盘返回 / Bridge / List | [05-h5-vant Q5](/interview/questions/05-h5-vant)、[Q6](/interview/questions/05-h5-vant)、[Q9](/interview/questions/05-h5-vant)、[Q10](/interview/questions/05-h5-vant)、[D2](/interview/questions/05-h5-vant)、[D4](/interview/questions/05-h5-vant)、[D5](/interview/questions/05-h5-vant) |

相关复习页：[移动跨端速记](/interview/review/sheets/05-mobile-cross)。

## 15 分钟口述验收清单

1. **（1 分钟）战场句：** 约束 → 容器差异 → 协议 → 真机与合规。
2. **（2 分钟）选型：** 何时 Hybrid / 小程序 / H5；验收指标是什么。
3. **（2 分钟）小程序：** 双线程与 `setData`；主包分包；登录隐私。
4. **（2 分钟）uni 适配：** 条件编译治理；生命周期不等价。
5. **（2 分钟）Bridge：** id/版本/能力/来源；销毁清理。
6. **（2 分钟）容器隔离：** Cookie/store/历史；iOS 17+ 边界。
7. **（2 分钟）H5 体验：** 安全区协议、弱网幂等、返回栈。
8. **（2 分钟）工程收口：** 热更新或主包治理案例（数字〔填〕）。

自检口令：

- 「App 版本能否代替 capability？」→ **不能。**
- 「清共享 data store 能否当账号隔离？」→ **不能；可能伤及其他实例。**
- 「条件编译能否写满业务文件？」→ **否；差异进适配层。**
- 「Apple 与 Google 热更新同一句话？」→ **否；分平台评估当期条款。**

若时间只够一分钟收口：报目标端约束、点名双线程/`setData` 与 Bridge 协议字段、强调真机矩阵与分平台合规、甩一个主包或串页回调治理数字。够用了。其余按风险进题库深挖，不现场编插件配置。跨端面试的胜负手往往是「约束说得清、差异讲得开、证据拿得出」，而不是框架清单背得多全。
