# 微前端与前端架构

> **真源：** [12 微前端](/interview/questions/12-microfrontend)（主）；质量属性与模块边界见 [14 前端架构](/interview/questions/14-frontend-architecture)；壳 / 监控 / 演进案例见 [11 前端系统设计](/interview/questions/11-frontend-system-design)。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是罗列 qiankun / Garfish / MF / Wujie 功能清单，而是证明你能按 **适用边界 → 运行机制 → 工程治理 → 故障降级** 做选型答辩：

**独立交付是否刚需 → 边界怎么切 → 装载/隔离/通信契约 → 清单灰度回滚 → 观测与安全边界。**

面试官想听四类能力：

1. **问题定义：** 微前端 ≠ Monorepo ≠ 组件库；解决的是运行时独立演进与交付。
2. **机制边界：** HTML Entry 生命周期 vs 模块联邦容器；Proxy/VM 沙箱 ≠ 安全边界；Wujie 同域 iframe ≠ 跨域安全隔离。
3. **版本口径：** **Webpack 5 内置 Module Federation** 与 **独立 MF 2.0（`@module-federation/enhanced`）** 必须分开讲。
4. **架构取舍：** 先质量属性与约束表，再选框架；能用壳 + 分包 / Monorepo 就不要先上运行时装配。

口述红线（与题库冲突即扣分）：

- 「项目大」直接等于要上微前端；
- 把 MF 2.0 的 Manifest / Runtime Plugin / 动态类型倒推为所有 Webpack 5 内置联邦自带；
- 把 `shared` 当成换皮 `externals`；
- 开启 sandbox 就宣称安全评审完成；
- 因 Wujie 用了 iframe 就说已是跨域安全隔离；
- 一边迁微前端一边重写权限 / 组件库 / 全部接口，变量过多无法归因。

版本基线（题库）：qiankun 2.x、Garfish 1.x、Wujie 1.x、Module Federation 2.0；以项目锁定版本文档与实测为准。

## 知识地图

```text
组织 / 约束               运行时装配                    契约与治理                 故障 / 安全
独立交付刚需？      →    qiankun / Garfish 应用级  →  清单 / 生命周期 / Schema → 分阶段熔断
质量属性排序             MF 模块级 + shared 协商        权限 / Token 最小暴露      LKG 资产保留
领域边界 vs 菜单拆       Wujie：iframe JS + WC DOM     灰度会话固定 release       CSP / 独立域
Monorepo / 壳优先        隔离强度梯队                  观测：host/app/release     绞杀者迁移
```

主线口诀：

1. **先确认独立交付或渐进替换刚需**
2. **按业务域切页面簇，不按按钮拆**
3. **内置联邦 ≠ MF 2.0 增强层**
4. **共享身份与环境，不共享领域可变 Store**
5. **清单指针切换回滚，不覆盖同名入口文件**
6. **可信冲突隔离 ≠ 不可信安全沙箱**

## 完整讲解

### 1. 微前端解决什么？与组件库 / Monorepo / 架构约束

微前端解决多个业务域或团队在同一产品壳内 **独立开发、构建、部署、运行** 的问题。组件库共享的是源码或构建产物，仍常一起构建上线；Monorepo 统一工具链，**不天然**带来独立部署。微前端代价是加载链路、隔离、通信、版本与可观测性治理。

适合：多稳定团队、域边界清晰、独立发布，或遗留系统渐进替换。不适合：单团队小系统、模块高度耦合、发布节奏一致、无人维护平台。架构税要用发布等待、回滚粒度、首屏/重复依赖、接入与值班工时量化。

前端架构开场先澄清约束表（用户、规模、可用性/性能、团队、合规、存量、退出成本），用质量属性场景反推结构——多团队后台优先可修改性与部署独立性；大促 H5 优先性能与容灾。**不要**先决定上微前端再倒推理由。系统设计默认路径常是：**壳 + features 包 + shared（Monorepo 轻量版）**；独立发布冲突与故障隔离收益被数据证实后，再评估微前端。

### 2. 边界划分与最小治理

按稳定业务能力与团队责任切 **页面簇**，不按菜单项机械拆成几十个应用，不按 Vue/React 技术栈拆同一业务流程。好边界：独立验收、独立发布、低频通信、故障可隔离。公共搜索若只是 UI → 组件库；含完整业务流程才考虑独立应用。

最小治理：应用清单（ID、负责人、入口、路由前缀、版本、健康、回滚版）；生命周期超时/重试/幂等；身份/租户/主题/埋点/事件 Schema；性能预算；安全基线（域名白名单、CSP/CORS、消息校验）；观测字段（host、app、release、traceId）；发布门禁（契约、独立运行、壳冒烟、一键回滚）。平台只治理公共面，不侵入领域实现。

分层架构要有依赖方向：页面 → 用例 → 领域 → 基础设施端口；共享包必须语义一致、变化节奏一致且有 Owner——优先复制小而不稳定的代码。

### 3. qiankun：注册、沙箱、样式、预加载、通信

`registerMicroApps` + `start`：命中 `activeRule` 加载 HTML Entry，执行 `bootstrap`（通常一次）/ `mount` / `unmount`。`loadMicroApp` 手动模式更易多实例，需去重。挂载节点从 `props.container` 查，不抢全局 `#app`。

JS 沙箱（默认 Proxy）隔离的是可信应用间全局读写冲突，**不是**浏览器安全边界；`document`、Cookie、网络、持久化存储仍可逃逸。样式：优先 Namespace / Token / lint；`strictStyleIsolation`（Shadow DOM）最强但 Portal/主题要适配；`experimentalStyleIsolation` 是实验能力且部分 at-rule 不改写。

预加载按下一跳概率分级，不能默认 `prefetch: 'all'` 抢首屏。通信：一次性上下文用 `props`；少量公共状态可用 `initGlobalState`；复杂业务回版本化事件或后端事实源。**不要直接共享 Pinia 实例。** 卸载用资源账本连续 mount/unmount ≥20 次验收。

### 4. Garfish 与选型 PoC

Garfish 可路由驱动或 `loadApp` 手动实例；`hide` 保留执行上下文换恢复速度，`unmount` 销毁上下文清沙箱副作用；`show` 会再 `render`，副作用须幂等。VM 沙箱（`new Function`/`with`/Proxy）收集 DOM/事件/定时器；动态脚本走 fetch 会遇 CORS。选型以多实例、旧应用兼容、运维经验与 **真实旧应用 PoC** 为准，不比官方 Demo 功能数。

### 5. Module Federation：角色、内置 vs 2.0、shared、故障

host 消费、remote 提供；同一应用可一身兼两职。`exposes` 映射稳定公开键；`remotes` 配消费侧别名；`shared` 登记到 Share Scope 由运行时选实例。MF 是 **模块级运行时组合**，不自带完整路由/CSS/JS 沙箱/安全隔离。

| | **Webpack 5 内置联邦** | **MF 2.0（enhanced）** |
| --- | --- | --- |
| 核心 | 导出、远程加载、依赖共享 | 在核心之上增强 |
| 典型增强 | — | Manifest、独立 Federation Runtime、Runtime Plugin、动态类型、调试配套 |
| 误区 | 配了内置插件就期待 `@mf-types` / Runtime Plugin | 混读两套文档，把「能启动」当「协商策略相同」 |
| 何时够用 | 固定少量 remote、模块导入 + shared | 动态注册、类型分发、Manifest 预取、统一重试/观测 |

`singleton` 要求作用域内一个版本；Vue 仅在跨边界共享组件/响应式/插件、确需运行时身份一致时才关键——页面级应用各自带 Vue 也可以是合理隔离。`shareKey` 不一致会静默双份；`eager` 撑大入口。双份 Vue 的症状出现在跨边界传 VNode/响应式时，不是看到双包就强制统一。

动态加载（MF 2.0）：受控清单 `registerRemotes` + `loadRemote`；改 URL **不能**假定热替换已执行模块。`remoteEntry` 可执行容器；`mf-manifest.json` 描述入口/资产/shared/类型；类型只保开发期契约。失败按 Manifest → remoteEntry → chunk → init/get → expose → shared → 执行分层；网络可有限重试，执行/契约错误立即熔断并应用级降级，保住 host。

### 6. Wujie：隔离模型与保活

JS 在同域 iframe 的独立 `window` 执行，DOM 落到主文档 Web Component（标准路径常 `attachShadow({mode:'open'})`）。这减少 Proxy 兼容工作，但 `window`/`document` 身份分裂会撞第三方库；**同域 iframe 可互访，不是跨域安全边界**。低信任应用应真正独立 origin + sandbox + 严格 `postMessage` 校验。

模式：`alive` 保活（快、耗内存，改 URL 不自动驱内部路由）；单例；重建。通信优先 props，事件带命名空间/版本；保活应用易收「幽灵事件」。性能分首次/二次/内存/后台 CPU，不能只用「秒开」Demo。

### 7. 隔离梯队、通信、权限、灰度、安全、观测

CSS：Namespace → scoped → Shadow → iframe；JS：自律 → Proxy/VM → 同域 iframe → 跨域 iframe。隔离越强，主题/弹窗/调试成本越高。Shadow **不隔离 JS**。

通信：共享只读 AuthContext/租户/主题；领域事件版本化；关键事实回后端。禁止全局可变 Store 地狱。

登录：统一身份层；前端隐藏按钮不是安全；Token 优先同域 BFF + HttpOnly Cookie；子应用独立运行走同一登录协议。

灰度：清单按桶返回不可变 release，会话固定版本；回滚切清单指针并保留整套资产。覆盖 `remoteEntry.js` 无法可靠回滚。

安全：远程入口是可执行供应链；qiankun/Garfish 部分链依赖 `eval`/`new Function`，与禁 `'unsafe-eval'` 的 CSP 冲突——高安全域优先独立域 iframe，不为兼容永久放宽 CSP。

观测：装载分阶段耗时与结果；上下文带 host/app/release/traceId；「可用」= 业务视图可交互，不只是 `mount` resolve。

### 8. 巨石迁移与四方案选型答辩

绞杀者：基线 → 最小平台契约 → 低耦合只读域试点（保留旧路由开关）→ 旧应用先当子应用再逐域替换 → 每域验收独立运行/深链/权限/卸载/灰度/回滚 → 最后收缩旧壳。首试点不要选核心交易域。Vue2/Vue3 共存：各自打包、序列化通信，不跨边界传 VNode/Pinia。

选型加权：应用/模块粒度、旧系统侵入、多实例、隔离强度、首屏、保活、类型契约、动态发布、回退、生态、团队经验、退出成本。可混用但须统一壳契约；一票否决含安全边界、CSP、深链刷新、可回滚发布等硬伤。


### 9. 架构层：依赖方向、共享泥球与系统设计默认路径

有效分层不是目录整齐，而是更换请求库/UI 时核心规则不用重写。依赖指向更稳定、更接近业务规则的一侧；跨层通过端口进入，禁止为省一步反向引用页面与 Store。共享包评估要分开「风险暴露」与「治理成本」，不能合成伪精确分数。稳定内核、平台能力、业务复用三者版本策略不同——万能 `common` 是事故源。

管理系统设计口述：先壳（会话、布局、动态路由、请求层、错误页）+ 业务包懒加载；权限以后端为准；动态组件清单要验签。微前端是演进选项，不是 MVP 默认。监控体系：错误/性能/业务漏斗分层采集，SourceMap 私有，告警对人负责；微前端场景必须带 app/release，否则无法归因。

### 10. 四方案一句话 + PoC 五项

- qiankun：HTML Entry + single-spa 生命周期 + Proxy 沙箱，路由应用模型清晰、案例多。
- Garfish：loader + VM/快照沙箱 + 实例 `hide/show`，手动控制更显式。
- Module Federation：模块容器与 Share Scope；要完整应用装配需自建壳或组合框架；**先分清内置与 2.0**。
- Wujie：同域 iframe JS + Web Component DOM，保活强，但同域非安全边界。

PoC 必测：真实旧应用接入改动；首次/二次加载瀑布；样式/全局/动态脚本隔离；并行多实例与重复卸载；入口故障灰度回滚与定位链路。一票否决写进 ADR：CSP/安全边界、深链刷新、可回滚发布、核心 SDK 兼容、内存预算。

### 11. 通信与权限再强调

初始化用 props；通知用版本化事件；写操作与强一致回后端。保活应用切走仍可能收事件——回调检查激活代次。多租户切换要提升会话代次、清空租户键缓存与保活实例，服务端仍校验归属。权限服务不可用时：高风险默认拒绝；只读可有签名短 TTL 快照并明示降级，绝不能前端超时就全量放行。



### 12. 主壳职责与业务职责：讲不清就别拆

主壳拥有：导航前缀、身份会话、租户、主题 Token、装载器、错误边界、应用清单、观测字段规范。业务拥有：页面、领域状态、API 适配、领域事件生产、自身性能预算内的资源。交叉处必须写 Owner：例如「菜单图标映射」是壳扩展点，「审批流业务组件」是业务包。若删除某一子应用会导致另一子应用无法启动，说明边界切错或通信做成了网状依赖——应合并或上收编排，而不是继续加总线协议。

灰度与回滚演练每季度至少一次：人为让某 remote Manifest 404，验证熔断、降级文案、LKG 切换与告警路由是否命中正确 Owner。演练记录进 ADR，比多写一份框架对比文档更能证明治理能力。安全分级：内部可信应用可用 Proxy/VM 防冲突；第三方与高敏感报表必须独立域。不为接入微前端在整站永久打开 `'unsafe-eval'`。



### 13. 与构建器专题的衔接（答辩加分）

微前端运行时问题不要在 Webpack 题里硬讲完，反之亦然。打包题答：内置还是 MF 2.0、eager 是否撑入口、shareKey 是否对齐。运行时题答：Share Scope 选版本、容器 init/get、Manifest 阶段失败、应用级熔断。Rspack/Vite 上的联邦集成深度以对应文档为准，PoC 前写进矩阵。壳用 Webpack、新业务用 Vite 可以，但必须统一清单、身份、观测与错误边界，并由适配层隐藏框架细节——混用不等于两套生命周期重复管理同一边界。

最后用组织语言收口：微前端是组织扩展工具，不是技术时尚。没有平台 Owner、没有契约测试、没有回滚演练，拆得越细，事故越大。把这句话放在开场或收尾，面试官会记住你的判断力。



### 14. 常见错误表述对照（默写）

| 错误说法 | 正确口径 |
| --- | --- |
| 仓库多就是微前端 | 看独立构建部署与故障隔离 |
| 开了 sandbox 就安全 | 防冲突≠安全沙箱 |
| Webpack5 联邦=MF2.0 | 增强层另有 Manifest/Runtime 等 |
| shared 等于 externals | 运行时协商，失败形态不同 |
| Wujie 用了 iframe 即跨域隔离 | 同域执行仍可互访 |
| 先全量微前端再补治理 | 先契约与平台能力，再扩大装配 |

把表当成开场自我校正清单，比临场编术语安全。


## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 团队数、发布冲突、遗留栈、CSP、多实例、首屏预算 |
| **方案** | 不上 / Monorepo 壳 / qiankun·Garfish / MF / Wujie |
| **取舍** | 架构税 vs 独立交付；隔离强度 vs 适配成本 |
| **验证** | PoC 五项、host×remote 矩阵、重复卸载、灰度回滚 |
| **复发防护** | 清单签名、资产保留窗口、契约双版本、独立运行入口 |

**案例 A — 「为技术栈自由上了微前端，首屏更慢」**

- 约束：两团队想各用组件库版本。
- 方案：先量化发布冲突；能 Monorepo + 兼容组共享则共享；必须异构则计入体积预算并设性能门禁。
- 取舍：体验一致性 vs 升级解耦。
- 验证：重复依赖字节、LCP、接入工时。
- 防护：平台 Owner + 性能预算；无平台能力不上。

**案例 B — 「配了 Webpack 联邦却按 MF 2.0 文档找 Manifest」**

- 约束：固定三个 remote。
- 方案：内置能力够用则锁内置；需要动态注册/类型/Runtime Plugin 再评 enhanced，并做版本矩阵。
- 取舍：增强治理能力 vs 协议与依赖复杂度。
- 验证：容器 init/get、shared 快照、新旧 remote 互操作。
- 防护：文档与插件版本写进 ADR，禁止混读。

**案例 C — 「remoteEntry 404，无限重试打爆 CDN」**

- 约束：午高峰发布清错缓存。
- 方案：按阶段分类；网络有限抖动重试；执行/契约熔断；清单切 LKG；应用级降级保住壳。
- 取舍：短暂降级 vs 整站白屏。
- 验证：拨测引用 chunk 完整；会话固定 release。
- 防护：不可变发布 + 旧资产窗口 + 合成巡检。

**案例 D — 「Sandbox 开了仍被当成安全方案」**

- 约束：要嵌第三方报表。
- 方案：第三方改独立 origin iframe + 最小 sandbox + 消息白名单；内部应用才用 Proxy/VM 防冲突。
- 取舍：集成体验 vs 爆炸半径。
- 验证：CSP、凭证不经 props 扩散、熔断单 app。
- 防护：信任分级写入安全基线。

证据坑位（填你的数）：

- 独立发布占比〔填〕；联动发版次数〔填〕；回滚耗时〔填〕。
- 子应用装载 P95〔填〕；重复框架体积〔填〕。
- 重复卸载 20 次后监听/堆增量〔填〕；入口故障 MTTR〔填〕。

微前端与架构合题的终局不是选对框架商标，而是组织是否付得起契约、观测与回滚的台账。先用约束表与质量属性排序决定要不要装配；要用就先分清应用级与模块级、内置联邦与 MF 2.0、冲突隔离与安全隔离。试点必须可退回单体或独立站。把独立发布占比、装载 P95 与演练 MTTR 带进答辩，比罗列四套 API 更像负责人。


## 追问树

**主问：什么时候上微前端？什么时候坚决不上？**

- L1：独立交付 / 渐进替换 vs 单团队耦合。  
  - L2：如何量化架构税？试点失败如何退？  
    - L3：与 Monorepo / 懒加载如何分工？收口：约束表 + 4～8 周数据。

**主问：内置 Module Federation 和 MF 2.0 差在哪？**

- L1：核心协议 vs Manifest/Runtime/类型增强。  
  - L2：哪些需求必须 enhanced？混合新旧 remote？  
    - L3：shared/singleton/Vue 何时必须单例？收口：运行时快照 + 版本矩阵。

**主问：qiankun 沙箱能隔离什么？**

- L1：可信冲突，非安全边界。  
  - L2：document 逃逸；如何证明卸载干净？  
    - L3：样式模式如何选？收口：资源账本 + 不可信走独立域。

**主问：Wujie 为什么用 iframe + Web Component？**

- L1：JS 环境隔离 + DOM 承载。  
  - L2：同域为何不是安全边界？保活/单例/重建怎么选？  
    - L3：幽灵事件如何防？收口：激活代次 + 事件目录。

**主问：巨石后台怎么渐进迁移？**

- L1：绞杀者步骤。  
  - L2：为何首试点不选交易域？Vue2/3 共存？  
    - L3：完成度指标？收口：独立运行与回滚验收，不搬仓即完成。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| 边界 / 治理 | [12-microfrontend Q1](/interview/questions/12-microfrontend)、[D1](/interview/questions/12-microfrontend)、[D2](/interview/questions/12-microfrontend)、[Q2](/interview/questions/12-microfrontend) |
| qiankun | [12-microfrontend Q3](/interview/questions/12-microfrontend)–[Q5](/interview/questions/12-microfrontend)、[D3](/interview/questions/12-microfrontend)、[D4](/interview/questions/12-microfrontend) |
| Garfish | [12-microfrontend Q6](/interview/questions/12-microfrontend)、[Q7](/interview/questions/12-microfrontend)、[D5](/interview/questions/12-microfrontend)、[D6](/interview/questions/12-microfrontend) |
| MF 基础 / 2.0 / shared | [12-microfrontend Q8](/interview/questions/12-microfrontend)、[D7](/interview/questions/12-microfrontend)、[D8](/interview/questions/12-microfrontend) |
| 动态加载 / Manifest / 故障 | [12-microfrontend Q9](/interview/questions/12-microfrontend)、[D9](/interview/questions/12-microfrontend)、[D10](/interview/questions/12-microfrontend) |
| Wujie | [12-microfrontend Q11](/interview/questions/12-microfrontend)–[Q13](/interview/questions/12-microfrontend)、[D11](/interview/questions/12-microfrontend) |
| 隔离通信权限灰度安全观测 | [12-microfrontend Q14](/interview/questions/12-microfrontend)–[Q18](/interview/questions/12-microfrontend)、[D12](/interview/questions/12-microfrontend)、[D13](/interview/questions/12-microfrontend) |
| 迁移与选型 | [12-microfrontend Q19](/interview/questions/12-microfrontend)、[D15](/interview/questions/12-microfrontend)、[D14](/interview/questions/12-microfrontend) |
| 质量属性 / 模块边界 | [14-frontend-architecture Q1](/interview/questions/14-frontend-architecture)、[D1](/interview/questions/14-frontend-architecture)、[Q3](/interview/questions/14-frontend-architecture) |
| 管理后台壳演进 | [11-frontend-system-design Q1](/interview/questions/11-frontend-system-design) |
| 联邦打包侧 | [25-webpack D6](/interview/questions/25-webpack) |

相关复习页：[架构速记](/interview/review/sheets/06-architecture)、[Vite/Webpack 专题](/interview/review/topics/07-vite-webpack)。

## 15 分钟口述验收清单

1. **（1 分钟）战场句：** 独立交付刚需 → 契约治理 → 故障降级；先约束后框架。
2. **（2 分钟）边界：** 微前端 vs 组件库 vs Monorepo；页面簇切分信号。
3. **（2 分钟）MF 口径：** 内置 vs MF 2.0 对照表；shared ≠ externals；Vue 单例条件。
4. **（2 分钟）qiankun/Garfish：** 生命周期；沙箱非安全；预加载预算。
5. **（2 分钟）Wujie：** iframe+WC 模型；同域非安全边界；保活取舍。
6. **（2 分钟）治理：** 清单灰度回滚；通信所有权；Token/CSP。
7. **（2 分钟）故障：** 加载阶段分类；应用级边界；LKG。
8. **（2 分钟）工程收口：** 选型矩阵或迁移事故（数字〔填〕）。

自检口令：

- 「Webpack 5 内置联邦有没有 Manifest/Runtime Plugin？」→ **核心没有；那是 MF 2.0 增强层。**
- 「开了 sandbox 就安全？」→ **否；防冲突 ≠ 安全沙箱。**
- 「Wujie 用了 iframe 就是跨域隔离？」→ **同域执行仍可互访；低信任要独立 origin。**
- 「项目大就要微前端？」→ **否；先看独立交付与平台能力。**
