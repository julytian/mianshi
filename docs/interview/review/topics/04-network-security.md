# 网络与 Web 安全

> **真源：** [18 网络与安全](/interview/questions/18-network-security)（协议、缓存、CORS、XSS/CSRF、OAuth、发布一致性）。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背头字段名，而是证明你能把「慢、串版本、被打、登不上」讲成可分层证伪的链路：

**DNS / 建连 / TLS → HTTP 语义与多路复用边界 → 缓存键与新鲜度 → 凭证模型 → XSS/CSRF/CSP 纵深 → 登录与发布回滚。**

面试官想听四类能力：

1. **分层感：** 「网络慢」要拆 DNS、TCP、TLS、TTFB、下载、主线程；协议协商与回退是观察项。
2. **缓存感：** `no-cache` ≠ 不存；哈希资源长缓存 + HTML 短缓存；CDN / 浏览器 / SW 是不同层。
3. **威胁感：** CORS 不是 CSRF 防护；HttpOnly 不防 CSRF；XSS 仍可借会话发请求。
4. **工程取舍：** BFF Cookie vs SPA + PKCE；Report-Only 再强制 CSP；先资源后入口的发布顺序。

口述红线（与题库冲突即扣分）：

- 说 HTTP/2 已彻底消灭队头阻塞（忽略 TCP 层）；
- 说 QUIC / UDP「天生更快」、0-RTT 随便用；
- 把 CORS 当 CSRF 方案，或把 SameSite 说成按 origin；
- 把 client secret 打进前端、refresh 永久放 `localStorage` 当默认最佳实践；
- 以为清 CDN 就清了浏览器与 Service Worker。

十年经验口径下，面试官还在听你能不能用「约束 → 方案 → 取舍 → 验证 → 防护」讲一次缓存事故或安全治理，证据用 〔填〕。

## 知识地图

```text
连接与协议                 交付与缓存                 身份与跨源                 攻击面纵深
DNS / TCP / TLS 1.3   →   新鲜度 + 再验证      →   Cookie / Session / Token   XSS sink 治理
H1 队头 / H2 多路 / H3 QUIC  Vary / ETag / immutable  CORS 预检与凭证         CSRF 组合拳
CDN 键与回源               HTML 短缓存 vs 哈希长缓存   BFF 或 Code+PKCE         CSP nonce / TT
                           发布：先资源后入口          SameSite ≠ origin        SRI / 供应链
```

主线口诀：

1. **慢在哪一段？**（Timing 分段证伪）
2. **缓存在哪一层、键是什么？**
3. **凭证谁自动带？**（决定 CSRF 要不要管）
4. **注入源与危险 sink 在哪？**
5. **登录是 BFF 还是 public client？**
6. **发版如何回滚且旧页不 404？**

## 完整讲解

### 1. DNS、TCP、TLS：把「连不上 / 慢」拆开

DNS：浏览器 / OS 缓存 → 递归解析器 →（未命中时）根 / TLD / 权威。`A` / `AAAA` / `CNAME` 等受 TTL 与负缓存影响。DNS 不证明目标可信；DNSSEC 验完整与来源，不加密查询；DoH / DoT 加密到解析器的链路，仍不替代 TLS 身份校验。排障要分层看缓存，别一口咬「DNS 没生效」。

TCP：握手建立可靠有序字节流，不懂 HTTP，不提供机密性；丢包拖住同连接后续字节。TLS：协商套件、验证书链与主机名、密钥交换，AEAD 保护机密与完整。TLS 1.3 通常减少往返；证书有效 ≠ 业务安全。排障拆 DNS / TCP / TLS / 首字节，结合 Timing 与日志，忌统称「网络慢」。

### 2. HTTP/1.1、HTTP/2、HTTP/3 边界


**机制：** DNS 解析失败、TCP 建连慢、TLS 握手/证书问题，表现都是「打不开」但排查层不同。证书链、时钟、SNI、中间人代理是 TLS 高频点。把「弱网」和「建连失败」分开，才能决定是换 CDN、修证书还是优化应用层。

**验收：** 能按 DNS→TCP→TLS→HTTP 分层报现象；证书过期与 DNS 污染有不同取证动作。


HTTP/1.1 默认可复用连接；浏览器通常不用 pipelining，而用有限并发，慢响应仍占连接形成应用层等待。消息边界靠 `Content-Length` / chunked 等，解析不一致有走私风险。域名分片在 h2/h3 下常适得其反。

HTTP/2：二进制帧、多 stream 交错、HPACK。某一响应慢不再挡住其他 stream 的**应用层**发送；但所有 stream 仍共享一条 TCP 字节流——段丢失会传输层队头阻塞。要确认真协商了 `h2`、代理是否降级。

HTTP/3 映射到 QUIC（常在 UDP）：集成 TLS 1.3 与多路流，一流丢包通常不堵死其他流；连接迁移视实现与网络环境。不是「UDP 更快」；受阻应回退 h2/h1。0-RTT 仅用于可重放安全的请求。证据坑位：〔填〕协议协商占比与回退观察。

### 3. HTTP 缓存、CDN 与可回滚发布


**机制：** HTTP/1.1 队头阻塞与连接数限制推动多域名与合并；HTTP/2 多路复用降队头阻塞，但大文件仍可占满带宽；HTTP/3/QUIC 改善弱网建连与丢包恢复，不自动让应用更快——请求数、缓存、主体积仍是主因。不要把「上了 HTTP/3」当性能故事结尾。

**失败形态：** 用 HTTP/2 为过度分包辩护；忽略证书与中间盒对 h3 的影响。


新鲜度：`max-age` / `s-maxage`、`Expires`、`Age` 等；过期后带 `If-None-Match` / `If-Modified-Since` 再验证，可 304。强 ETag 表示所选表示逐字节等价，不同 `Content-Encoding`（gzip / br / identity）是不同表示，须不同强 ETag，并在最终编码确定后生成或按编码分别改写；若只想表达解码后语义等价，用弱 ETag。`Last-Modified` 精度与时钟边界较弱。源站或 CDN 按请求动态选编码时，应 `Vary: Accept-Encoding`，避免共享缓存把 br 响应发给不支持的客户端；CDN 可规范化有限变体，但不能丢掉实际能力差异，也要避免源站与边缘重复压缩。`no-cache` = 用前必须再验证（仍可能存储）；`no-store` 才要求不存。含 `Authorization` 的请求默认受共享缓存限制，只有响应显式满足规范允许共享的指令时才可共享；Cookie 请求没有同等自动禁存规则，Cookie 也不会自动成为缓存键。用户私有或敏感内容优先 `private` / `no-store`；确需共享须先证明与用户无关，再设计完整缓存键与授权边界。`Vary` 扩展缓存键：漏了会串数据，维度过多又降命中。浏览器缓存、Service Worker、CDN、应用缓存是不同层，必须分别定义失效与观测。

CDN 在边缘 PoP 按主机、路径、查询、头与厂商规则建键；可终止 TLS、压缩、WAF、请求合并——每项都是具体配置，不是「用了 CDN」自动保证。风险：错误键、私有当公开、Host / 查询投毒、失效传播延迟、回源风暴。源站只允许受信 CDN 访问并验证真实客户端 IP 头。发布优先版本化 URL，purge 作补救；用 `Age`、`Via`、供应商缓存状态及多地域探测验证。

发布模型（D2）：静态资产内容哈希 + 长期 `public, max-age=31536000, immutable`；HTML / manifest 短缓存或再验证。顺序：**先上传全部哈希资源并校验完整性，再原子切换入口**；旧资源保留到活跃页淘汰。浏览器缓存、CDN、Service Worker 是独立层，purge 清不掉所有客户端副本；SW 还可能让旧页面与新 fetch 处理器并存，数据和消息协议必须跨版本兼容。回滚靠切入口，并确认旧资源仍可访问。反模式：同名覆盖配长缓存、先发 HTML 再传 chunk、一键清 CDN 当清客户端、激活新 worker 立刻删旧缓存。证据坑位：〔填〕HTML 与哈希资源的 Cache-Control 对照表与一次跨版本回滚演练。

资深收口：「用内容寻址把缓存问题转成版本选择：资源不可变、入口可再验证、先资源后入口；分别观测三层，回滚只切入口并以真实页面加载验证。」

### 4. Cookie / Session / Token 与 CORS

Session 常把状态放服务端，浏览器持随机会话 ID；Cookie 是按 Domain / Path / Secure / SameSite 等规则**可能自动携带**的容器。Token 是凭证格式或引用，Bearer 谁拿到谁可用，未必无状态。浏览器同站应用常用 `Secure; HttpOnly; SameSite=Lax/Strict` 主机会话 Cookie，并叠加 CSRF 防护。`HttpOnly` 防脚本直接读，不防 CSRF，XSS 下仍可借会话请求。可被脚本读的 Token 暴露给 XSS；放 `localStorage` 不会自动随请求发送，但不是「安全存储」。

CORS：同源策略限制脚本**读**跨源响应。简单请求也可发出，但读响应仍需 ACAO 等；否则先 OPTIONS 预检。带凭证须精确 Origin + `Access-Control-Allow-Credentials: true`，不能 `*`；动态回显 Origin 前要白名单，并 `Vary: Origin`。CORS **不阻止**普通表单等跨站发送，故不是 CSRF 防护；非浏览器客户端也不受 CORS 约束。

### 5. CSRF、XSS、CSP 与供应链


**机制补充：** Cookie 的 `HttpOnly`/`Secure`/`SameSite` 与路径域决定凭证面；Token 放 localStorage 扩大 XSS 爆炸半径。CORS 是浏览器强制的读限制，不是服务器授权模型——服务端仍要鉴权。简单请求与预检、带 cookie 的 `credentials` 是高频追问。

**失败形态：** 前端「隐藏按钮」当权限；CORS `*` 配 `credentials`；把 CORS 当 CSRF 防护。


CSRF：利用浏览器自动携带 Cookie、HTTP 认证等环境凭证，让用户在攻击者页面触发目标站有副作用请求。防护应组合：会话 Cookie 选合适 `SameSite`，状态变更拒绝 GET，使用不可预测且绑定会话的 CSRF Token，校验 `Origin`，必要时以 `Referer` 作受控回退，高风险操作二次确认。`SameSite` 按 schemeful site 而非 origin；同站不同源 / 不可信子域仍可能互打；Lax 对部分顶级导航放行，None 要求 Secure，旧客户端与嵌入场景有边界。`HttpOnly` 只阻止读 Cookie，不阻止自动发送。CORS 不是 CSRF 防护。同步 Token 或双提交 Cookie 都需防 XSS、子域注入与比较错误；双提交若未签名绑定，可能受子域 Cookie 注入影响。服务端必须做最终校验，支付等接口具备幂等与重放防护。OAuth 回调与跨站支付单独建模，不放宽全局策略。

XSS：存储型 / 反射型通常由服务端把不可信输入带入 HTML；DOM XSS 由前端把 URL、消息或存储数据传入 `innerHTML`、`insertAdjacentHTML`、`eval`、脚本 URL 等危险 sink。核心是按输出上下文编码并避免拼接：文本用 `textContent`，属性、URL、CSS、JavaScript 上下文分别处理，不能用一次 HTML 转义覆盖所有位置。必须展示富文本时用维护良好的 sanitizer，固定允许元素、属性与 URL 协议；框架模板默认转义不覆盖 `v-html`、DOM API、第三方组件与 SSR 水合边界。CSP 是纵深防御，不替代消除注入点。HttpOnly 可减少凭证被读走，但 XSS 仍可代发请求。工程上还应依赖治理、代码审查、静态规则、CSP 报告与安全测试。

CSP：通过响应头限制脚本、样式、连接、框架等来源。脚本策略优先每次响应不可预测的 nonce，或对静态内联用精确 hash，移除 `unsafe-inline` 与宽泛源。`'strict-dynamic'` 让获得 nonce / hash 信任的脚本把信任传给其动态加载脚本，现代浏览器会忽略传统 host allowlist；旧浏览器可能不理解，策略可保留受控 host 作兼容回退，但不能误以为两者在所有客户端同时生效。nonce 必须由服务端为每个响应生成，不能写进静态 bundle、缓存后复用或由不可信输入控制。hash 匹配精确字节。先用 Report-Only 收集违规并去噪，再逐步强制；报告可能含 URL 等敏感信息，要最小化与脱敏。`frame-ancestors` 控制嵌入来源，不等同 `frame-src`。Trusted Types 约束部分 sink 的值类型；全局创建「原样返回字符串」的 default policy 会架空它。治理覆盖应用、SSR、微前端与第三方；CI 做模板 / 依赖 / CSP 回归。

第三方脚本与页面同权限：先减少数量与权限，再固定版本、自托管或受控 CDN、SRI、CSP、隔离 iframe、变更审查与运行监控。SRI 按 `integrity` hash 验证下载字节；跨源脚本完整性校验还需资源服务器 CORS 响应并通常配合 `crossorigin`，否则可能因 CORS 失败而不执行。SRI 不覆盖脚本运行后的网络、动态加载与业务滥用。建立第三方资产清单、业务所有者、数据访问与到期日；锁版本与 lockfile；营销脚本放隔离域 / sandbox iframe；敏感页默认不加载；远程开关快速熔断。反模式：对 `latest.js` 写固定 integrity；SRI 却未配跨源 CORS；允许第三方读 DOM / Cookie / 表单；只扫依赖漏洞不审构建插件与发布账户。证据坑位：〔填〕CSP 报告收敛与一次 CSRF Token / SameSite 组合验收。

### 6. 登录：BFF 优先，SPA 走 Code + PKCE

优先同源 BFF：浏览器持 Secure / HttpOnly / 合适 SameSite 的随机会话 Cookie，BFF 保管与刷新 OAuth Token，并同时做 CSRF 防护。纯 SPA 是公开客户端，代码可被检查，**不能**安全放 `client_secret`，用 Authorization Code + PKCE：先取得短期 code，再以客户端保存的 verifier 换 Token，把兑换绑定到发起者。

OAuth 管委托授权（受限 Access Token 访问资源）；OIDC 在其上加 ID Token / UserInfo / 身份声明。两者不能混为「登录协议」或「Token 格式」。授权服务器发 Token；OIDC 客户端验证 ID Token；资源服务器验证 Access Token。PKCE 在授权服务器支持时可承担回调 CSRF 防护（题库对 RFC 9700 的口径）；`state` 可在其他场景防 CSRF 或关联本地事务；OIDC `nonce` 把 ID Token 绑定到认证请求——按流程选用，不要求三者永远同时。不要对回调 code 校验它不存在的 `aud` / 签名 / `exp`。

Access Token 短期并限 audience / scope；refresh rotation 每次刷新更换凭证，旧凭证重放触发 token family 撤销；并发刷新要服务端或客户端协调，否则误判重放后无限刷新。前端对并行 401 做 single-flight 刷新并限次；失败清理状态并重新认证。授权端始终严格注册与匹配 `redirect_uri`。RFC 6749 下仅当授权请求含 `redirect_uri` 时 Token 请求才必须带相同值；OAuth 2.1 draft-15 的 Token 请求已无该参数——讲版本边界时以题库为准。会话支持撤销、设备列表与密钥轮换；日志只记 token 指纹、会话 ID 的不可逆关联与事件原因，不写 Cookie / Authorization / refresh 原文。证据坑位：〔填〕会话 Cookie 属性清单与刷新失败态处理。

反模式清单（面试可主动说）：client secret 打进 bundle；refresh 永久放 `localStorage`；认为 HttpOnly 可防 CSRF；仅解码 ID Token 不验签与 claims；把 Authorization 写入错误日志或监控 breadcrumb。

### 7. 首屏网络慢与安全头收口

同一次 trace 拆 DNS、建连、TLS、排队、TTFB、下载、浏览器处理，再沿 CDN / 网关 / 源站证伪。「网络慢」不是根因。Resource Timing 阶段可能因连接复用而为 0，也受 `Timing-Allow-Origin` 限制；h2 / h3 会改变连接与排队模型。TTFB 含网络往返、边缘处理与源站计算，不能直接等同后端耗时。统一 navigation / trace id，采集协议、连接复用、缓存状态、地域、网络类型、Server-Timing 与 CWV；异常样本看瀑布、PoP、回源日志与分布式追踪；用受控冷暖缓存、多地域与不同协议对照；业务百分位验收。忌：只 ping；见 TTFB 高就怪数据库；关缓存实验结果当用户现状；代理抓包改变 h3 协商；日志打出 code / token。

安全响应头：HSTS 在有效期内强制 HTTPS，可减少协议降级与 SSL stripping；`includeSubDomains` 与 preload 影响面大，启用前须确保子域长期支持 HTTPS。未 preload 且无既有 HSTS 状态时，首次 HTTP 访问仍是边界。`X-Content-Type-Options: nosniff` 要求按声明 MIME 处理，须同时返回正确 `Content-Type`，尤其避免上传内容被当脚本或 HTML。CSP `frame-ancestors` 控制谁可嵌入，是现代点击劫持防护；`X-Frame-Options` 作旧客户端回退但能力较弱。`Referrer-Policy` 限跨站泄漏，`Permissions-Policy` 限敏感能力。安全头须与资源、嵌入和 OAuth 流程一起测；扫描器「有头」≠ 策略正确；反向代理与 CDN 也可能覆盖或只给部分状态码添加。


发布与安全收口：缓存键与 `Vary` 决定能否错发用户（个性化响应慎用公共 CDN 缓存，`Vary: Cookie` 几乎等于不可缓存）；HTML 与带 hash 的静态资源要用不同 TTL；回滚要保留旧资产窗口。CSP 是纵深防御不是银弹；供应链要锁文件、审计与最小权限 token。登录优先 BFF + HttpOnly Cookie；若 SPA 纯前端授权码流必须 PKCE，并讲清 refresh 存放与轮换。


十年口径：网络与安全题要分层取证，并把缓存、凭证面、注入面接到同一发布回滚能力上。协议升级不是故事结尾，缓存与鉴权才是。 登录讲 BFF+Cookie 或 SPA+PKCE 二选一要说清约束；CSP 与供应链是纵深，修注入点仍是第一优先级。

 证据坑位填你自己的缓存命中率、CSP report 量与一次登录方案约束表。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | 同站 / 跨站、是否 BFF、CDN、合规、旧客户端 |
| **方案** | 缓存分层、凭证模型、CSP 节奏、发布窗口 |
| **取舍** | 兼容 vs 严格；长缓存命中 vs 回滚复杂度 |
| **验证** | 多地域探测、安全回归、跨版本加载、报告噪声 |
| **复发防护** | 发布清单、门禁、熔断开关、脱敏规范 |

**案例骨架 A — 「发版后大量 chunk 404」**

- 约束：用户停留旧页，新版已上。
- 方案：先资源后入口；保留旧哈希窗口；入口可回切。
- 取舍：存储成本。
- 验证：旧 HTML 跨版本加载 E2E。
- 防护：版本清单 + 禁止先删旧资产。

**案例骨架 B — 「HTML 长缓存导致半新半旧」**

- 约束：要极致命中率。
- 方案：HTML 短 TTL / 再验证；JS/CSS 哈希 + immutable。
- 取舍：入口多几次再验证。
- 验证：〔填〕Cache-Control 对照与灰度。
- 防护：CI 检查入口缓存头。

**案例骨架 C — 「以为上了 CORS 就防 CSRF」**

- 约束：Cookie 会话。
- 方案：SameSite + CSRF Token + Origin + 非 GET 变更。
- 取舍：表单 / 跨站支付单独开口。
- 验证：跨站表单用例应失败。
- 防护：安全测验进 CR；禁 GET 删除。

**案例骨架 D — 「SPA 把 refresh 放 localStorage」**

- 约束：无 BFF 的短期现实。
- 方案：Code + PKCE；最小化 Token 暴露；规划迁 BFF。
- 取舍：XSS 面仍大于 HttpOnly 会话。
- 验证：XSS 演练与刷新并发。
- 防护：禁 secret 进包；日志脱敏。

**案例 E — 「上了 HTTP/2 仍慢，继续拆了 80 个 chunk」**

- 约束：移动网冷缓存。
- 方案：回升合并粒度；先看关键路径总字节与主线程解析；h2/h3 不取消请求税。
- 取舍：理论缓存粒度 vs 调度成本。
- 验证：HAR 请求数、TBT、二次访问命中。
- 防护：分包变更要带瀑布证据。

**案例 F — 「CSP 报了但 XSS 仍在」**

- 约束：有 CSP 却仍拼 HTML。
- 方案：修注入点；CSP 作纵深；序列化转义；禁随意 `unsafe-inline` 例外长期化。
- 取舍：第三方小部件接入变烦。
- 验证：XSS 夹具 + CSP report 归零。
- 防护：模板默认转义；富文本白名单。

## 追问树

**主问：用户说首屏网络慢，你怎么拆？**

- L1：Timing 各段含义；TTFB 含什么。  
  - L2：h2/h3 与缓存如何改模型？  
    - L3：如何验收？收口：百分位 + 脱敏 trace，不靠单次本机。

**主问：`no-cache` 和 `no-store`？**

- L1：能否存储、是否必须再验证。  
  - L2：哈希资源与 HTML 策略如何配？  
    - L3：Vary / ETag 与编码表示？收口：分层观测，不混 SW。

**主问：为什么 CORS 防不了 CSRF？**

- L1：CORS 管读与预检，不挡简单跨站发送。  
  - L2：自动凭证模型与 SameSite 边界。  
    - L3：Token + Origin 如何组合？收口：服务端授权前置。

**主问：XSS 与 CSP 你怎么落地？**

- L1：source / sink；框架转义覆盖不了什么。  
  - L2：nonce / hash / strict-dynamic。  
    - L3：Trusted Types 与报告脱敏？收口：先消注入再纵深。

**主问：浏览器登录你推荐哪套？**

- L1：为何优先 BFF Cookie。  
  - L2：SPA 为何 Code + PKCE、为何无 secret。  
    - L3：refresh rotation 与并发刷新？收口：角色拆分验证，日志不落 Token。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| DNS | [18-network Q1](/interview/questions/18-network-security) |
| TCP / TLS | [18-network Q2](/interview/questions/18-network-security) |
| HTTP/1.1 | [18-network Q3](/interview/questions/18-network-security) |
| HTTP/2 | [18-network Q4](/interview/questions/18-network-security) |
| HTTP/3 / QUIC | [18-network Q5](/interview/questions/18-network-security) |
| HTTP 缓存 | [18-network Q6](/interview/questions/18-network-security) |
| CDN | [18-network Q7](/interview/questions/18-network-security) |
| Cookie / Session / Token | [18-network Q8](/interview/questions/18-network-security) |
| CORS | [18-network Q9](/interview/questions/18-network-security) |
| CSRF | [18-network Q10](/interview/questions/18-network-security)、[D5](/interview/questions/18-network-security) |
| XSS | [18-network Q11](/interview/questions/18-network-security)、[D4](/interview/questions/18-network-security) |
| CSP | [18-network Q12](/interview/questions/18-network-security) |
| OAuth / OIDC / PKCE | [18-network Q13](/interview/questions/18-network-security)、[D3](/interview/questions/18-network-security) |
| 安全响应头 | [18-network Q14](/interview/questions/18-network-security) |
| 首屏网络排查 | [18-network D1](/interview/questions/18-network-security) |
| 缓存与发布 | [18-network D2](/interview/questions/18-network-security) |
| 供应链 / SRI | [18-network D6](/interview/questions/18-network-security) |

相关复习页：[Web 与计算机基础速记](/interview/review/sheets/01-web-fundamentals)、[浏览器渲染专题](/interview/review/topics/03-browser-rendering)。

## 15 分钟口述验收清单

开始前准备一张纸，按时勾选；任一勾不上就回去补题库对应题。

1. **（1 分钟）战场句：** 协议分层 + 缓存分层 + 凭证威胁模型 + 纵深防御。
2. **（2 分钟）连接与协议：** TLS 1.3 直觉；h2 仍有 TCP 队头；h3 边界与回退。
3. **（2 分钟）缓存：** no-cache / no-store；哈希 vs HTML；Vary / ETag。
4. **（2 分钟）发布：** 先资源后入口；三层缓存；回滚切入口。
5. **（2 分钟）CORS vs CSRF：** 自动凭证；SameSite 按 site；组合防护。
6. **（2 分钟）XSS / CSP：** sink 清单；nonce；Report-Only → 强制。
7. **（2 分钟）登录：** BFF 优先；SPA Code+PKCE；禁 secret；刷新纪律。
8. **（2 分钟）案例收口：** 五步模板讲缓存或安全案（〔填〕）。

自检口令（必须能脱口而出）：

- 「HTTP/2 还有队头阻塞吗？」→ **应用层多路改善了，TCP 丢包仍可能堵整连接。**
- 「CORS 防 CSRF 吗？」→ **不防。**
- 「`no-cache` 是不缓存吗？」→ **不是；是用前再验证。**
- 「SPA 能放 client_secret 吗？」→ **不能；公开客户端走 PKCE。**

- 「CORS 能当 CSRF 防护吗？」→ **不能。**
- 「localStorage 放 Token 的风险？」→ **XSS 下凭证面扩大。**

