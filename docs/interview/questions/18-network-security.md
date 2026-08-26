# 网络与 Web 安全面试题库

> **怎么用：** 普通题按「协议目标 → 浏览器行为 → 威胁边界 → 工程验证」口述 1～2 分钟；深层题按「结论 → 原理 → 场景 → 失败模式 → 验证」展开。本文区分协议规范、浏览器约束与具体部署实现；版本、算法和兼容性以目标浏览器、服务端、代理及 CDN 的实测结果为准。

> **关键边界：** CORS 是浏览器读取响应的跨源授权机制，不是认证，也不能单独防 CSRF；`HttpOnly` 限制脚本读取 Cookie，但不阻止浏览器携带它发起 CSRF 请求。`SameSite` 能降低部分跨站请求风险，但受同站定义、导航、兼容性和业务流程限制。前端是可检查的不可信客户端，不能安全保存 OAuth `client_secret`。

---

## 一、网络协议与交付

### Q1. 浏览器访问域名时，DNS 解析经历哪些环节？

**考察点：** DNS 递归与迭代、缓存、记录类型、DoH / DoT、工程排障

::: details 参考答案

浏览器先检查自身和操作系统缓存，再由系统解析器向配置的递归解析器查询。递归解析器若未命中缓存，会从根、顶级域和权威 DNS 逐级获得委派与最终记录；这是典型实现路径，不代表每次都完整查询。`A` / `AAAA` 指向地址，`CNAME` 提供别名，HTTPS / SVCB 可携带服务参数，最终仍受 TTL、负缓存和解析器策略影响。

DNS 只负责名称到服务信息的解析，不证明目标可信；DNSSEC 验证数据来源和完整性，也不加密查询。DoH / DoT 加密客户端到解析器的链路，但解析器仍可见查询，且不替代 TLS 的服务器身份验证。工程上应设置合理 TTL、灰度切流与多地域权威服务，排障时分别观察浏览器、系统、递归解析器和权威层，避免把旧缓存直接归因于「DNS 未生效」。

:::

**追问：** DNS TTL 到期后是否所有用户都会立刻拿到新地址？

::: details 追问参考答案

不会。TTL 约束缓存新鲜期，但已有连接、浏览器与系统缓存、递归解析器预取或最小 TTL 策略都可能延长实际切换；不同记录和地域也可能不一致。发布时应让新旧地址并存可用，提前降低 TTL，并通过多地解析、连接和业务指标确认收敛，不能依赖某个本地 `dig` 结果代表全部用户。

:::

---

### Q2. TCP 建连、可靠传输与 TLS 握手分别解决什么问题？

**考察点：** 三次握手、序列号、拥塞控制、TLS 1.3、证书链、会话恢复

::: details 参考答案

TCP 通过握手建立双向序列号空间，以确认、重传、流量控制和拥塞控制提供有序可靠字节流；它不理解 HTTP 消息，也不提供机密性。丢包会影响同一 TCP 连接上后续字节交付，具体重传和拥塞算法属于实现。TLS 在传输之上协商版本与密码套件、验证证书链和主机名、完成密钥交换，并用 AEAD 保护机密性与完整性。

TLS 1.3 通常减少握手往返，会话恢复可进一步降低成本。证书有效不等于业务安全，只证明经信任链验证的身份绑定；私钥保护、协议配置、撤销能力和应用鉴权仍需单独治理。排障要拆分 DNS、TCP、TLS 和首字节时间，结合抓包、浏览器 Timing、服务端日志及代理指标，而不是把所有连接错误称为「网络慢」。

:::

**追问：** TLS 1.3 的 0-RTT 数据为什么有重放风险？

::: details 追问参考答案

0-RTT 使用先前会话材料，让客户端在完整握手确认前发送 early data；攻击者可能捕获并向同一或多个接入点重放。TLS 层的反重放部署很难给出跨节点绝对保证，因此 0-RTT 只应承载可安全重复、无副作用或具业务幂等键的操作，不能用于转账、下单等一次性动作；服务端还应允许拒绝 early data 并回退到正常握手。

:::

---

### Q3. HTTP/1.1 的持久连接、队头阻塞和消息边界如何理解？

**考察点：** Keep-Alive、流水线、Content-Length、Chunked、代理一致性

::: details 参考答案

HTTP/1.1 默认可复用 TCP 连接，减少重复握手。请求与响应在一个连接上按字节顺序传输；浏览器通常不采用 HTTP pipelining，而是使用有限并发连接，因此慢响应仍会占住连接并形成应用层队头等待。消息边界由 `Content-Length`、分块传输编码或连接关闭等规则决定，客户端、代理和源站若解析不一致，可能产生请求走私。

工程上要正确设置长度、超时和连接复用，避免同时发送冲突边界信息，并让所有代理采用一致、严格的解析策略。HTTP/1.1 的性能不只由连接数决定，域名分片会增加 DNS、握手和连接竞争，在 HTTP/2 / 3 下通常适得其反。

:::

**追问：** 为什么增加同域并发连接不是解决 HTTP/1.1 阻塞的通用方案？

::: details 追问参考答案

更多连接可以短期并行，但会增加 DNS 后的 TCP / TLS 握手、拥塞窗口竞争、服务器资源和移动网络耗电，也不能消除单个大响应或源站排队。浏览器还有每源连接上限。应先减少关键请求、压缩与分块响应、合理缓存，再通过协议升级和实际瀑布图验证，不以连接数作为单一调优旋钮。

:::

---

### Q4. HTTP/2 如何复用连接，为什么仍可能出现队头阻塞？

**考察点：** Binary Framing、Stream、HPACK、优先级、TCP 队头阻塞

::: details 参考答案

HTTP/2 把消息拆成二进制帧，在一个连接上用多个 stream 交错传输，并用 HPACK 压缩头部；某个响应慢不再阻止其他 stream 的应用层帧被发送。流控分连接和 stream 两级，优先级只是调度信号，浏览器、代理和服务器的支持策略可能不同，不能把规范能力等同于部署效果。

所有 stream 仍共享一条有序 TCP 字节流。底层丢失一个 TCP 段时，后续已到达字节也要等待重传，因此会发生传输层队头阻塞。单连接还可能成为拥塞、故障和连接迁移的边界。工程上需同时检查是否真正协商了 `h2`、中间代理是否降级、服务端并发和流控配置，而不是仅看 URL 使用 HTTPS。

:::

**追问：** HTTP/2 Server Push 为什么不应作为首选优化？

::: details 追问参考答案

Push 很难准确知道客户端缓存和真实优先级，可能重复传输、抢占带宽；主流浏览器已移除或不再支持 HTTP/2 Push。应优先使用可缓存的内容哈希资源、`preload`、`preconnect` 或 103 Early Hints，并用目标浏览器验证。规范曾提供能力，不代表当前部署和客户端仍可依赖。

:::

---

### Q5. HTTP/3 与 QUIC 的核心变化和边界是什么？

**考察点：** QUIC、UDP、独立流、连接迁移、0-RTT、部署回退

::: details 参考答案

HTTP/3 把 HTTP 映射到 QUIC。QUIC 通常在 UDP 上由用户态实现，集成 TLS 1.3、可靠传输、拥塞控制和多路流；一个流的丢包通常只阻塞该流，不像 HTTP/2 over TCP 那样阻塞全部流。连接 ID 支持网络地址变化后的连接迁移，但是否成功取决于实现、NAT、防火墙和服务端策略。

QUIC 不是「UDP 天生更快」：首次连接、CPU、丢包、网络设备和 UDP 限制都影响收益，受阻时客户端应回退 HTTP/2 或 HTTP/1.1。QUIC 0-RTT 同样存在重放边界，只能用于可重放安全的请求。部署时通过 Alt-Svc 或 HTTPS 记录等方式发现能力，观测真实协商协议、握手、丢包、回退率和业务延迟，区分协议规范与 CDN 的具体实现。

:::

**追问：** HTTP/3 是否彻底消除了队头阻塞？

::: details 追问参考答案

没有。它消除了不同 QUIC stream 之间由单一 TCP 有序字节流造成的传输层队头阻塞，但同一 stream 内仍需有序交付；QPACK 在特定动态表依赖下也可能等待。应用自身的串行依赖、服务端排队和主线程阻塞仍存在。因此要用分层指标定位，不能把协议升级当作所有阻塞的自动修复。

:::

---

### Q6. HTTP 缓存如何判断新鲜度并完成再验证？

**考察点：** Cache-Control、内容编码协商、ETag、Vary、私有响应

::: details 参考答案

缓存先根据方法、状态码、响应指令和缓存键判断可存储性，再用 `Cache-Control: max-age` / `s-maxage`、`Expires`、`Date`、`Age` 等计算新鲜度。新鲜响应可直接复用；过期后携带 `If-None-Match` / `If-Modified-Since` 再验证，源站可返回 304。强 ETag 表示所选表示逐字节等价，不同 `Content-Encoding` 产生不同表示，必须使用不同强 ETag；若只想表达解码后语义等价，应使用弱 ETag。`Last-Modified` 的精度和时钟边界较弱。

内容编码通过请求的 `Accept-Encoding` 协商，响应以 `Content-Encoding` 声明实际表示，例如 gzip 或 br；同一 URL 的不同编码是不同表示。源站或 CDN 若按请求动态选择编码，应返回 `Vary: Accept-Encoding`，避免共享缓存把 br 响应发给不支持的客户端。CDN 可把等价的 `Accept-Encoding` 值规范化为有限变体，并统一决定在边缘压缩还是缓存源站压缩结果；但不能丢失实际能力差异，也要避免源站与边缘重复压缩。强 ETag 必须在最终编码表示确定后生成或按编码分别改写，不能让 gzip、br 和 identity 共用同一个强验证器。

`no-cache` 表示使用前必须再验证，不等于不存；`no-store` 才是要求不存储。含 `Authorization` 的请求默认受共享缓存存储限制，只有响应显式满足规范允许共享的指令时才可共享；Cookie 请求没有同等的自动禁存规则，Cookie 也不会自动成为缓存键。用户私有或敏感内容应优先 `private` 或 `no-store`；确需共享时，必须先证明响应与用户无关，再显式设计完整缓存键和授权边界。`Vary` 会扩展缓存键，遗漏编码或语言维度可能串数据，维度过多又会降低命中。浏览器缓存、Service Worker、CDN 和应用缓存是不同层，必须分别定义失效和观测。

:::

**追问：** 为什么带内容哈希的静态资源适合 `immutable` 长缓存？

::: details 追问参考答案

文件内容变化会生成新 URL，旧 URL 可长期保持不可变，因此可设置很长 `max-age` 和 `immutable`，既提高命中又避免频繁再验证。HTML 或资源清单应短缓存或可再验证，用于指向新哈希资源。若同一 URL 覆盖内容，长缓存会造成版本漂移；回滚也应发布可引用的旧哈希，而不是依赖全网立即清缓存。

:::

---

### Q7. CDN 如何缓存和分发内容，常见风险是什么？

**考察点：** PoP、回源、缓存键、失效、源站保护、个性化数据

::: details 参考答案

CDN 在边缘 PoP 接收请求，按主机、路径、查询、请求头及供应商规则构造缓存键；命中直接返回，未命中或过期则回源并缓存。它可终止 TLS、压缩、做 WAF 和请求合并，但每项能力都是具体部署配置，不是 CDN 这一名称自动保证。

风险集中在错误缓存键、把私有响应当公开内容、Host / 查询参数投毒、失效传播延迟和回源风暴。应区分 `Authorization` 请求的默认共享缓存限制与 Cookie 不会自动禁存、也不会自动入键的事实；私有内容优先 `private` / `no-store`，只有确认用户无关时才显式共享并设计完整键。还要明确可缓存状态码，规范化键但保留影响响应的维度；源站只允许受信 CDN 访问并验证真实客户端 IP 头。发布优先采用版本化 URL，purge 作为补救，并用 `Age`、`Via`、供应商缓存状态及多地域探测验证。

:::

**追问：** CDN 缓存命中高，为什么源站仍可能被打垮？

::: details 追问参考答案

大量新键、恶意随机查询、同时过期、未缓存错误或个性化请求都可能穿透；热点对象失效时多个 PoP 还会并发回源。需要规范缓存键、请求合并、stale-if-error / stale-while-revalidate、分层缓存、限流和源站容量保护。命中率是总体比例，必须同时看回源 QPS、热点分布和失效时峰值。

:::

---

## 二、身份、跨源与浏览器安全

### Q8. Cookie、Session 和 Token 应如何选择与组合？

**考察点：** 状态位置、Cookie 属性、Bearer Token、撤销、存储边界

::: details 参考答案

Session 通常把会话状态放在服务端，浏览器仅持有随机会话 ID；Cookie 是传输容器，可由浏览器按 Domain、Path、Secure、SameSite 等规则自动携带。Token 是凭证格式或引用，Bearer Token 谁拿到谁可用，未必无状态，也不天然比 Session 安全。选择取决于客户端类型、撤销、扩展性、跨域和威胁模型。

浏览器同站应用常用 `Secure; HttpOnly; SameSite=Lax/Strict` 的主机会话 Cookie，并配合 CSRF 防护。`HttpOnly` 防止 JavaScript 直接读取，但 XSS 仍可借用户会话发请求，也不防 CSRF。可由脚本读取的 Token 暴露给 XSS；放 localStorage 不会自动随请求发送，却不是「安全存储」。服务端应限制有效期、受众和权限，支持撤销、会话轮换与设备管理，日志不得记录 Cookie、Authorization 或 refresh token。

:::

**追问：** JWT 是否意味着服务端无需保存任何状态？

::: details 追问参考答案

不意味着。JWT 可自包含声明，但密钥轮换、注销、撤销、设备会话、权限变更和 refresh token 重放检测仍常需服务端状态。验证还必须固定算法、检查签名、`iss`、`aud`、`exp`、`nbf` 等，不能只解码。过大的 JWT 还增加每次请求成本；是否采用应由跨服务验证需求决定，而非追求「无状态」口号。

:::

---

### Q9. CORS 的预检、凭证和响应头如何工作？

**考察点：** 同源策略、Simple Request、Preflight、Credentials、缓存

::: details 参考答案

同源策略限制脚本读取跨源响应。满足有限方法、头部和 Content-Type 条件的请求可直接发送，响应仍需 `Access-Control-Allow-Origin` 才能被脚本读取；其他请求通常先发 OPTIONS 预检，询问允许的方法、头部和凭证。预检成功只允许浏览器发送正式请求；正式响应仍要通过 `Access-Control-Allow-Origin`、凭证场景下的 `Access-Control-Allow-Credentials` 等 CORS 检查后才会暴露给脚本。任何一步都不表示用户已认证或请求安全。

带凭证请求需要客户端设置 credentials，服务端返回精确 Origin 和 `Access-Control-Allow-Credentials: true`，不能用 `*` 放行凭证；动态回显 Origin 前必须白名单校验，并正确设置 `Vary: Origin` 避免共享缓存串响应。CORS 不阻止普通表单、图片等跨站发送请求，因此不是 CSRF 防护；非浏览器客户端也不受浏览器 CORS 执行约束。

:::

**追问：** 为什么「请求在控制台报 CORS」不等于服务端没收到？

::: details 追问参考答案

简单跨源请求会先实际发送，再由浏览器因响应缺少允许头而阻止脚本读取；带预检的请求也可能是 OPTIONS 已到服务端而正式请求未发。应在 Network 面板区分预检和正式请求，并查服务端日志。不能通过关闭浏览器安全策略解决生产问题，应修正受控 Origin、方法、头部、凭证和缓存配置。

:::

---

### Q10. CSRF 的成立条件和防护组合是什么？

**考察点：** 自动携带凭证、SameSite、CSRF Token、Origin 校验、幂等

::: details 参考答案

CSRF 利用浏览器自动携带 Cookie、HTTP 认证等环境凭证，让用户在攻击者页面触发目标站点的有副作用请求。防护应组合使用：会话 Cookie 选择合适 `SameSite`，状态变更拒绝 GET，使用不可预测且绑定会话的 CSRF Token，校验 `Origin`，必要时以 `Referer` 作受控回退，并对高风险操作二次确认。

`SameSite` 按 site 而非 origin 判断，同站不同源仍可能互相攻击；顶级导航、旧客户端、第三方登录和嵌入场景也有边界。`HttpOnly` 只阻止读 Cookie，不阻止自动发送。CORS 不是 CSRF 防护。同步 Token 或双提交 Cookie 都需防 XSS、子域注入和比较错误；服务端必须做最终校验，并让支付、转账等接口具备幂等和重放防护。

:::

**追问：** 使用 `SameSite=Lax` 后为什么仍应评估 CSRF Token？

::: details 追问参考答案

Lax 会允许部分顶级跨站导航携带 Cookie，且 SameSite 的同站边界包含可能不可信的子域；兼容策略和业务 OAuth 跳转也可能要求放宽。虽然正确使用非 GET 状态变更会降低风险，但高价值操作仍应采用 Token 与 Origin 校验形成纵深防御，并测试真实浏览器和登录回调流程，而不是把单一属性视为绝对保证。

:::

---

### Q11. XSS 有哪些类型，前端应如何系统防护？

**考察点：** Stored、Reflected、DOM XSS、上下文编码、Sanitization

::: details 参考答案

存储型和反射型 XSS 通常由服务端把不可信输入带入 HTML 响应；DOM XSS 则由前端把 URL、消息或存储数据传入 `innerHTML`、`insertAdjacentHTML`、`eval`、脚本 URL 等危险 sink。核心是按输出上下文编码并避免拼接：文本使用 `textContent`，属性、URL、CSS 和 JavaScript 上下文分别处理，不能用一次 HTML 转义覆盖所有位置。

必须展示富文本时使用维护良好的 sanitizer，并固定允许元素、属性和 URL 协议；框架模板默认转义不覆盖 `v-html`、DOM API、第三方组件和 SSR 水合边界。CSP 是纵深防御，不替代消除注入点。HttpOnly 可减少凭证被读走，但 XSS 仍可代发请求。工程上还应做依赖治理、代码审查、静态规则、CSP 报告和安全测试。

:::

**追问：** Trusted Types 如何降低 DOM XSS 风险？

::: details 追问参考答案

Trusted Types 可通过 CSP `require-trusted-types-for 'script'` 要求部分危险 DOM sink 接收受信类型，而不是任意字符串；应用在集中 policy 中完成审计和净化。它能把散落注入点变成可发现的违规，但覆盖范围、浏览器兼容和第三方库适配有限，也不能阻止服务端 XSS、逻辑漏洞或错误 policy。应先清点 sink，以 report-only 迁移，再强制执行并保留兼容路径。

:::

---

### Q12. CSP 的 nonce、hash 和 `strict-dynamic` 应怎样使用？

**考察点：** CSP、内联脚本、动态加载、报告、兼容策略

::: details 参考答案

CSP 通过响应头限制脚本、样式、连接、框架等资源来源。脚本策略优先采用每次响应不可预测的 nonce，或对静态内联脚本使用精确 hash，移除 `unsafe-inline` 和宽泛源。`'strict-dynamic'` 让获得 nonce / hash 信任的脚本把信任传递给其动态加载脚本，现代浏览器会忽略传统 host allowlist；旧浏览器可能不理解它，因此策略可保留受控 host 作为兼容回退，但不能误以为两者在所有客户端同时生效。

nonce 必须由服务端为每个响应生成，不能写进静态 bundle、缓存后复用或由不可信输入控制。hash 匹配精确字节，适合稳定内容。先用 Report-Only 收集违规并去除噪声，再逐步强制；报告可能含 URL 等敏感信息，要最小化和脱敏。`frame-ancestors` 应通过 CSP 控制嵌入来源，它不等同于 `frame-src`。

:::

**追问：** CSP 中只配置可信 CDN 域名为什么仍不充分？

::: details 追问参考答案

同一 CDN 域名可能托管用户可控文件、JSONP、旧版本库或可绕过路径，域名白名单会把整片来源都视为可信。nonce / hash 能把授权收窄到本次明确脚本，配合 `strict-dynamic` 管理加载链。仍需防止 nonce 泄漏和 DOM 注入，并治理第三方脚本；CSP 是降低利用面的纵深措施，不是输入输出安全的替代品。

:::

---

### Q13. OAuth 2.1 草案、OIDC 与 Authorization Code + PKCE 分别解决什么问题？

**考察点：** 授权与认证、Code Flow、PKCE、state、nonce、公开客户端

::: details 参考答案

OAuth 解决委托授权：客户端取得受限 Access Token 访问资源；OIDC 在 OAuth 之上增加 ID Token、UserInfo 和身份声明，用于确认用户身份。两者不能混为「登录协议」或「Token 格式」。

浏览器 SPA 是公开客户端，代码可被检查，不能安全保存 `client_secret`。因此通常采用 Authorization Code + PKCE：先取得短期 code，再以客户端保存的 verifier 换取 Token，把 code 兑换绑定到发起者。授权服务器负责授权与发 Token，OIDC 客户端验证 ID Token，资源服务器验证 Access Token；具体参数和版本边界见下方补充说明。

:::

**追问：** SPA 的 refresh token 应如何降低失窃与重放风险？

::: details 追问参考答案

优先评估 BFF，以 HttpOnly 会话 Cookie 隔离 Token。若授权服务器向 SPA 发 refresh token，应使用短生命周期、最小 scope、refresh token rotation 和重放检测：每次刷新签发新 token 并使旧 token 失效，旧 token 再出现时撤销关联 token family 并要求重新认证。轮换不能阻止首次窃取，仍需 XSS 治理、发送者约束能力和异常监控，日志不得记录原始 token。

**补充说明：协议版本与校验角色**

截至本文基线，OAuth 2.1 仍是 Internet-Draft；正式基线是 OAuth 2.0 RFC 6749、Bearer Token RFC 6750，并按 RFC 9700 BCP 收紧安全实践。授权服务器必须精确注册、匹配 `redirect_uri`，禁止通配和开放重定向。RFC 6749 规定：授权请求包含 `redirect_uri` 时，Token 请求必须携带相同值供授权服务器比较；OAuth 2.1 draft-15 已移除 Token 请求中的该参数。业务回跳参数只能映射到站内允许目标。

PKCE 绑定 code 兑换者；客户端确认授权服务器支持 PKCE 时，可按 RFC 9700 依赖 PKCE 承担回调 CSRF 防护，否则或需要关联本地事务时使用一次性 `state`。OIDC `nonce` 独立绑定 ID Token 与认证请求，不能由 PKCE 替代，也不要求所有场景同时使用三者。授权回调验证选定的 CSRF 机制，必要时验证授权响应 `iss`；OIDC 客户端验证 ID Token 的签名、`iss`、`aud`、`exp` 及已使用的 `nonce`；资源服务器按 Access Token 类型本地验证或内省。回调 code 本身没有供客户端校验的 `aud`、签名或 `exp`。

:::

---

### Q14. 常见安全响应头分别防什么，部署时有什么边界？

**考察点：** HSTS、nosniff、frame-ancestors、Referrer-Policy、Permissions-Policy

::: details 参考答案

HSTS 告诉支持的浏览器在有效期内仅用 HTTPS 访问该主机，可减少协议降级和 SSL stripping；`includeSubDomains` 与 preload 影响范围大，启用前必须确保所有子域长期支持 HTTPS。只有在主机未 preload 且浏览器没有既有 HSTS 状态时，首次 HTTP 访问才是未受 HSTS 保护的边界。`X-Content-Type-Options: nosniff` 要求按声明 MIME 处理，需同时返回正确 `Content-Type`，尤其避免上传内容被当脚本或 HTML。

CSP `frame-ancestors` 控制哪些父页面可嵌入当前页面，是现代点击劫持防护；`X-Frame-Options` 可作旧客户端回退，但能力较弱。`Referrer-Policy` 限制跨站泄漏，`Permissions-Policy` 限制文档和 iframe 使用敏感能力。安全头必须与资源、嵌入和 OAuth 流程一起测试；扫描器显示「存在」不等于策略正确，反向代理和 CDN 也可能覆盖或只给部分状态码添加。

:::

**追问：** 为什么设置 `nosniff` 后资源可能突然加载失败？

::: details 追问参考答案

此前浏览器可能容忍错误 MIME，例如把 `text/plain` 的脚本当 JavaScript；`nosniff` 会要求脚本和样式使用可接受类型，于是暴露源站、对象存储或 CDN 元数据错误。正确修复是为每类文件返回准确 `Content-Type`，并验证压缩和错误页不会复用错误类型，而不是删除安全头。

:::

---

## 三、深层工程场景

### D1. 如何从页面请求链路系统排查「首屏网络慢」？

::: details 参考答案

#### 基础结论

先用同一次请求的 trace 把 DNS、建连、TLS、请求排队、TTFB、下载和浏览器处理分段，再沿 CDN、网关和源站继续拆解；「网络慢」不是根因，协议、缓存、服务端和主线程必须分别证伪。

#### 原理深挖

Resource Timing 中阶段可能因连接复用而为零，也受跨源 Timing-Allow-Origin 限制；HTTP/2 / 3 会改变连接与排队模型。TTFB 包含网络往返、边缘处理和源站计算，不能直接等同后端耗时。QUIC 使用 UDP，受阻可能回退，DNS 和 TLS 也会受缓存与恢复影响。

#### 工程场景

统一 navigation id / trace id，采集协议、连接复用、缓存状态、地域、网络类型、Server-Timing 和 Core Web Vitals。对异常样本查看瀑布、CDN PoP、回源日志与分布式追踪，使用受控冷暖缓存、多地域和不同协议对照，最后用业务百分位而非单次本机结果验收。

#### 反例 / 踩坑

只 ping 主机忽略 HTTP 路径；看到 TTFB 高就归因数据库；强制关闭缓存后把实验结果当用户现状；用代理抓包改变 HTTP/3 协商；日志记录完整 URL 查询中的 code、token 或个人信息，既污染证据又制造泄露。

#### 资深回答模板

我先明确慢的是哪个用户分位和哪个里程碑，再以 trace 分解 DNS、连接、TLS、边缘、回源、下载和主线程。每个假设用协议协商、缓存头、Server-Timing 和服务端跨度验证，修复后对照地域、网络和版本，并确保遥测脱敏。

:::

**追问链：**
1. Resource Timing 中连接阶段为零说明什么？
2. 如何判断 HTTP/3 是否真实生效？
3. 跨源资源为什么看不到详细时间？

::: details 追问参考答案

**1. Resource Timing 中连接阶段为零说明什么？**

通常表示复用了已有连接，或请求由缓存、Service Worker 等路径满足，也可能因精度与可见性限制。应结合 `nextHopProtocol`、transferSize、缓存状态和 DevTools connection id 判断，不能据此断言「没有 TCP / TLS」或网络免费。

**2. 如何判断 HTTP/3 是否真实生效？**

查看浏览器 Network 的 Protocol、Resource Timing `nextHopProtocol`、服务端 / CDN QUIC 指标和必要的网络追踪；同时观察 UDP 被阻断后的回退。配置了 Alt-Svc 只表示宣传能力，不证明本次请求已使用 h3，代理工具也可能让连接降级。

**3. 跨源资源为什么看不到详细时间？**

浏览器为避免跨源信息泄漏，未获得 `Timing-Allow-Origin` 授权时会把多项详细阶段隐藏或归零。资源方应只对白名单或明确公共场景返回合适 TAO，并评估隐私；前端不能通过 CORS 响应头替代 TAO。

:::

---

### D2. 如何设计缓存一致性与可回滚的前端版本发布？

::: details 参考答案

#### 基础结论

静态资产使用内容哈希和长期不可变缓存，HTML / manifest 短缓存或再验证；发布保证入口只引用已上传资源，旧资源保留到活跃页面自然淘汰，回滚通过切换入口完成。

#### 原理深挖

浏览器缓存、CDN 与 Service Worker 是独立层，purge 不会清除所有客户端副本。HTTP 再验证解决同 URL 新鲜度，内容寻址避免覆盖竞态；Service Worker 还可能让旧页面与新 fetch 处理器并存，因此数据和消息协议必须跨版本兼容。

#### 工程场景

先上传全部哈希资源并校验完整性，再原子发布入口；CDN 键包含必要编码和变体。HTML 使用 ETag 或短 TTL，资源设置 `public, max-age=31536000, immutable`。维护版本清单、资源保留窗口和发布指标，出现错误时回切入口并验证旧资源仍可访问。

#### 反例 / 踩坑

同名 JS 直接覆盖配长缓存会产生半新半旧；先发布 HTML 再上传 chunk 会 404；一键清 CDN 被误认为清除浏览器和 Service Worker；激活新 worker 后立即删除旧缓存会破坏仍运行的旧页面。

#### 资深回答模板

我用内容寻址把缓存问题转成版本选择问题：资源不可变、入口可再验证、发布顺序先资源后入口。保留跨版本协议和旧资源窗口，分别观测浏览器、CDN、Service Worker，回滚只切入口并以真实页面加载验证。

:::

**追问链：**
1. CDN purge 什么时候仍然有必要？
2. 如何处理动态 import 的旧 chunk 404？
3. ETag 与内容哈希是否重复？

::: details 追问参考答案

**1. CDN purge 什么时候仍然有必要？**

当错误或敏感内容已用不可变 URL 发布、HTML 紧急撤回、法规要求删除时，purge 是必要补救。但传播有延迟，且不保证清浏览器缓存；还需停止源站供应、换新 URL、缩短入口缓存并验证多 PoP。正常发布不应依赖全网即时 purge。

**2. 如何处理动态 import 的旧 chunk 404？**

根本措施是保留旧哈希资源足够长，并监控活跃版本。捕获 chunk load error 后可提示用户保存状态并刷新到新入口，避免无条件 reload 循环；离线和 Service Worker 场景还要区分网络失败、缓存损坏与版本淘汰。

**3. ETag 与内容哈希是否重复？**

用途不同。内容哈希改变 URL，使静态资源可永久缓存且无需再验证；ETag 对 URL 不变的 HTML、JSON 或 API 做条件请求。哈希资源也可带 ETag，但通常命中新鲜缓存时不会使用它，不能以 ETag 替代不可变版本发布。

:::

---

### D3. 如何设计浏览器登录、Access Token 与刷新流程？

::: details 参考答案

#### 基础结论

优先采用同源 BFF：浏览器持有 Secure、HttpOnly、合适 SameSite 的随机会话 Cookie，BFF 保存和刷新 OAuth Token。纯 SPA 必须按 public client 设计，用 Authorization Code + PKCE，不放 client secret，并限制 Token 暴露面。

#### 原理深挖

PKCE 绑定 code 兑换者；确认授权服务器支持 PKCE 时，RFC 9700 允许客户端依赖它承担回调 CSRF 防护。`state` 可在其他场景防 CSRF 或关联本地事务，OIDC `nonce` 则把 ID Token 绑定到认证请求，PKCE 不替代 nonce。应按流程选择机制，不要求三者永远同时存在。Access Token 应短期、限定 audience / scope；refresh token rotation 每次刷新更换凭证，旧凭证重放触发 token family 撤销。并发刷新需要服务端或客户端协调，否则会误判重放。

#### 工程场景

按角色拆分验证：授权回调验证选定的 CSRF 机制，使用 state 时校验一次性绑定，必要时验证授权响应 `iss`；授权端始终严格注册和匹配 `redirect_uri`。RFC 6749 流程中，仅当授权请求包含 `redirect_uri` 时，Token 请求才必须携带相同值供授权服务器比较；OAuth 2.1 draft-15 的 Token 请求已无该参数。OIDC 客户端验证 ID Token 的签名、`iss`、`aud`、`exp` 和已使用的 `nonce`；资源服务器按 Token 类型做本地验证或内省。不要对回调 code 校验它不存在的 `aud`、签名或 `exp`。前端对同时 401 做 single-flight 刷新并限制重试，失败后清理状态并重新认证；BFF 同时做 CSRF 防护。会话支持撤销、设备列表和密钥轮换，日志只记录 token 指纹、会话 ID 的不可逆关联和事件原因。

#### 反例 / 踩坑

把 client secret 打进 bundle；把 refresh token 永久放 localStorage；认为 HttpOnly 可防 CSRF；仅解码 ID Token 不验签和 claims；多个请求并发使用旧 refresh token，触发全家族撤销后无限刷新；把 Authorization 头写入错误日志或监控 breadcrumb。

#### 资深回答模板

我先按客户端是否能保密选 BFF 或 public client 流程。授权码使用 PKCE，并按授权服务器能力和协议流程选择 state；OIDC nonce 独立承担 ID Token 请求绑定。回调、Token 端点、OIDC 客户端和资源服务器各自验证所属对象；令牌最小权限、短期、轮换并检测重放。刷新并发受控，失败可收敛到重新登录，所有日志和前端存储都不出现原始凭证。

:::

**追问链：**
1. 为什么前端环境不能安全保存 `client_secret`？
2. 刷新请求并发时怎样避免误触重放检测？
3. BFF 使用 Cookie 后还需要什么防护？

::: details 追问参考答案

**1. 为什么前端环境不能安全保存 `client_secret`？**

SPA 代码、网络请求和运行时都由用户控制，所谓混淆、环境变量或打包加密最终都必须在客户端还原，攻击者可提取。OAuth 因此把 SPA 视为 public client。秘密只能放在受控服务端，前端使用 PKCE 证明本次授权请求的连续性，而非伪装成机密客户端。

**2. 刷新请求并发时怎样避免误触重放检测？**

客户端用 single-flight 让同一会话只有一个刷新在途，其他请求等待结果；服务端可为极短并发窗口保存上次结果或明确族状态，但不能无限接受旧 token。跨标签页需协调或由 BFF 集中刷新。收到真正旧 token 重放时撤销家族并重新认证。

**3. BFF 使用 Cookie 后还需要什么防护？**

需要 CSRF Token / Origin 校验、合适 SameSite、Secure、HttpOnly、最小 Domain / Path，以及 XSS 和会话固定防护。BFF 还应限制可代理目标和方法，避免成为通用代理；Cookie 隔离 Token 读取风险，不会自动解决浏览器携带凭证的跨站请求。

:::

---

### D4. 如何在大型前端治理 XSS、CSP 与 Trusted Types？

::: details 参考答案

#### 基础结论

先消除注入源和危险 sink，再以 sanitizer、Trusted Types 和 CSP 建立纵深防御；治理必须覆盖应用代码、SSR、微前端和第三方脚本，并通过报告与门禁持续收敛。

#### 原理深挖

DOM XSS 是不可信字符串到执行型 sink 的数据流问题。Trusted Types 约束部分 sink 的值类型，CSP nonce / hash 限制可执行脚本，`strict-dynamic` 管理可信加载链；它们覆盖面不同。nonce 每响应唯一，hash 匹配精确内容，兼容回退的 host allowlist 不能被误读成现代浏览器仍同时强制。

#### 工程场景

建立 source / sink 清单，封装富文本 sanitizer 与 Trusted Types policy，禁用直接 `innerHTML` 和动态代码执行。CSP 先 Report-Only，按路由和第三方依赖修复，再强制 nonce + `strict-dynamic`；报告端点去重、限流、脱敏，并在 CI 做模板、依赖和 CSP 回归测试。

#### 反例 / 踩坑

全局创建返回原字符串的 default policy 会架空 Trusted Types；nonce 固定或从 DOM 读取后传给不可信脚本；为了兼容加入 `unsafe-inline`；仅靠框架转义却大量使用 `v-html`；CSP 报告记录含 Token 的完整 URL。

#### 资深回答模板

我把 XSS 当数据流治理：减少 source，封闭 sink，富文本集中净化。Trusted Types 让违规可见，CSP 用每响应 nonce / 静态 hash 与 strict-dynamic 限制执行面；先报告后强制，兼容与第三方逐项验证，安全遥测本身也脱敏。

:::

**追问链：**
1. 第三方库不兼容 Trusted Types 怎么办？
2. nonce 能否由 CDN 缓存复用？
3. CSP Report-Only 是否能阻止攻击？

::: details 追问参考答案

**1. 第三方库不兼容 Trusted Types 怎么办？**

先升级或替换，定位其具体 sink；短期可为该库建立最小、可审计 policy，输入仍经过严格 sanitizer，不提供全局透传 default policy。用 Report-Only 观察覆盖和回归，记录例外所有者、期限与移除条件，避免兼容层永久扩大信任边界。

**2. nonce 能否由 CDN 缓存复用？**

不应。nonce 要对每个响应不可预测，缓存同一带 nonce HTML 会让攻击者获得可复用值。可在边缘每次生成并同步写入 CSP 头与模板，或对真正静态内联脚本使用 hash；部署时必须确认缓存键和模板替换不会导致头、正文不一致。

**3. CSP Report-Only 是否能阻止攻击？**

不能，它只生成违规报告，不执行阻断，适合上线前发现依赖和策略缺口。正式防护需要发送强制 CSP；也可同时发送 Report-Only 测试下一版策略。报告可能丢失、被拦截或采样，不能作为攻击是否发生的唯一证据。

:::

---

### D5. 如何围绕 Cookie 凭证模型系统防御 CSRF？

::: details 参考答案

#### 基础结论

只要浏览器会自动携带凭证，就要把 CSRF 作为服务端授权前置条件；SameSite、CSRF Token、Origin 校验、正确方法语义和高风险确认应组合使用，不把 CORS 或 HttpOnly 当防护。

#### 原理深挖

SameSite 比较 schemeful site，不是 origin；同站不可信子域可发同站请求。Lax 对部分顶级导航放行，None 要求 Secure，旧客户端和嵌入场景存在差异。同步 Token 绑定服务端会话；双提交模式若未签名绑定，可能受子域 Cookie 注入影响。XSS 能读取页面 Token 或代发请求，因此还需 XSS 防御。

#### 工程场景

状态变更只接受非 GET，主机会话 Cookie 最小 Domain / Path。服务端验证自定义头或表单 Token、Origin 白名单及会话绑定，缺少 Origin 时按明确策略处理。OAuth 回调和跨站支付单独建模，高风险操作使用一次性挑战、幂等键与审计。

#### 反例 / 踩坑

看到预检就认为不会 CSRF；设置 HttpOnly 后删除 Token；允许 GET 删除资源；宽泛信任所有公司子域；Token 可预测或长期不轮换；Origin 校验使用字符串前缀，误放 `trusted.example.attacker.com`。

#### 资深回答模板

我先识别哪些凭证由浏览器自动发送，再为所有副作用接口做 Token 与 Origin 双校验，Cookie 使用最小作用域和合适 SameSite。跨站业务单独开口，不放宽全局策略；最后覆盖同站子域、顶级导航、旧浏览器和 XSS 联合威胁。

:::

**追问链：**
1. 双提交 Cookie 应如何避免子域注入？
2. 为什么 GET 不应执行状态变更？
3. Origin 缺失时应该直接放行吗？

::: details 追问参考答案

**1. 双提交 Cookie 应如何避免子域注入？**

使用服务端秘密对随机值及会话标识做 HMAC 绑定，严格比较头 / 表单值与签名 Cookie，并尽量采用 `__Host-` Cookie：Secure、Path=/ 且无 Domain。仅比较两个相同随机字符串时，不可信子域可能写入 Domain Cookie 并伪造配对值。

**2. 为什么 GET 不应执行状态变更？**

GET 按语义应安全，可被链接、图片、预取、爬虫和缓存自动触发；用它变更状态既扩大 CSRF 面，也破坏缓存与重试假设。副作用使用 POST / PUT / PATCH / DELETE，并执行 CSRF 和授权校验；改方法本身仍不是完整防护。

**3. Origin 缺失时应该直接放行吗？**

不应无条件放行。现代状态变更请求通常有 Origin，但隐私策略、旧客户端或中间件可能缺失。应按客户端矩阵决定拒绝、要求 CSRF Token，或严格验证 Referer 作为回退，并监控比例；不能为了兼容把缺失变成通用绕过路径。

:::

---

### D6. 如何治理第三方脚本、SRI 与前端供应链风险？

::: details 参考答案

#### 基础结论

第三方脚本与页面同权限，应先减少数量和权限，再通过固定版本、自托管或受控 CDN、SRI、CSP、隔离 iframe、变更审查与运行监控降低风险；任何单点机制都不能保证供应链安全。

#### 原理深挖

SRI 让浏览器按 `integrity` 中的 hash 验证下载字节。跨源脚本的完整性校验还需资源服务器提供允许该请求的 CORS 响应，并通常配合合适 `crossorigin`；否则可能因 CORS 检查失败而不执行。SRI 不覆盖脚本运行后的网络、动态加载内容和业务滥用。

#### 工程场景

建立第三方资产清单、业务所有者、数据访问和到期日；锁定版本与 lockfile，CI 做来源、许可证和漏洞审查。稳定脚本优先自托管或 SRI 固定，营销脚本放隔离域 / sandbox iframe，CSP 限制 script-src、connect-src，敏感页面默认不加载，并通过远程开关快速熔断。

#### 反例 / 踩坑

对 `latest.js` 写固定 integrity 后更新即全站失败；使用 SRI 却未配置跨源 CORS；允许第三方读取 DOM、Cookie 和表单；只做依赖漏洞扫描，不审查构建插件和发布账户；备用 CDN 不同字节却共用一个 hash。

#### 资深回答模板

我把第三方代码视为特权依赖：先问能否删除或隔离，再固定来源和版本，静态跨源资源用 SRI + CORS，CSP 限制后续能力。供应链从 lockfile、构建、发布到账户权限全链路治理，并准备按脚本一键停用与证据留存。

:::

**追问链：**
1. SRI 为什么常与 `crossorigin` 一起出现？
2. 动态加载脚本如何做完整性控制？
3. sandbox iframe 是否绝对安全？

::: details 追问参考答案

**1. SRI 为什么常与 `crossorigin` 一起出现？**

跨源 SRI 校验要求响应通过 CORS 可共享性检查，`crossorigin="anonymous"` 让请求采用匿名 CORS 模式，资源端需返回合适 ACAO。缺失配置可能导致浏览器拒绝执行。具体元素默认请求模式和凭证行为要按规范及目标浏览器验证，不能只复制属性。

**2. 动态加载脚本如何做完整性控制？**

使用构建清单记录 URL 与 hash，创建 script 时设置 integrity 和 crossorigin；更稳妥的是把依赖纳入自身构建、自托管并以内容哈希发布。若第三方入口再动态加载未知代码，SRI 只能保护入口，应通过 CSP、隔离和供应商契约限制后续能力。

**3. sandbox iframe 是否绝对安全？**

不是。sandbox 权限取决于 token 组合；同时允许 `allow-scripts` 和 `allow-same-origin` 给同源内容可能让其移除 sandbox。还存在 postMessage 校验、点击劫持、资源消耗和浏览器漏洞风险。应使用独立不受信源、最小 token、严格消息来源 / schema 和 Permissions Policy。

:::

---

### D7. 如何设计安全的文件上传、预览与下载链路？

::: details 参考答案

#### 基础结论

客户端校验只改善体验，服务端必须重新验证身份、权限、大小、真实类型和内容；文件使用随机对象键存储在不可执行域，预览与下载返回正确 MIME、`nosniff` 和合适 `Content-Disposition`。若产品支持填写远程 URL 代抓文件，抓取器还必须按 SSRF 威胁模型在服务端和网络出口治理，前端 URL 校验不能替代这些控制。

#### 原理深挖

扩展名和客户端 `Content-Type` 可伪造，魔数也不足以发现多态文件和恶意文档。把用户文件放主站同源并 inline 展示，可能形成 stored XSS、SVG / HTML 执行或 Cookie 暴露。下载文件名还涉及头注入、路径穿越和 Unicode 欺骗。远程抓取则把服务端网络能力暴露给不可信 URL；攻击者可利用私网地址、云元数据、DNS 重绑定和重定向访问原本不可达的内部服务。

#### 工程场景

上传前鉴权并签发短期、限定对象键和大小的凭证；服务端流式限制、类型探测、病毒 / 内容扫描，异步扫描前标记隔离。图片解码重编码，危险文档只下载或用隔离预览服务。响应设置准确 Content-Type、`X-Content-Type-Options: nosniff`、attachment 文件名编码和最小缓存。

远程抓取仅允许明确的协议和业务目的白名单。服务端解析主机后阻断环回、链路本地、私网、保留地址及不允许的 IPv4 / IPv6 范围，并让实际连接绑定到校验后的 IP，或通过受控解析器和出口代理防止 DNS 重绑定；每次重定向都重新解析和校验，限制跳转次数。网络层再以出口代理、防火墙或 egress policy 禁止访问内部网段和元数据服务，同时限制响应字节数、解压规模、连接与总超时，并在下载后继续执行文件校验和扫描。

#### 反例 / 踩坑

只看 accept / 扩展名；把上传文件保存为用户文件名并可猜测覆盖；主域直接 inline SVG / HTML；扫描前即可公开访问；错误响应仍返回 200 和 `text/html`，被 CDN 缓存为文件；日志记录预签名 URL 的完整查询凭证。远程抓取只在前端拒绝 `localhost`，或只校验初始 URL、不校验解析 IP 和重定向，都会留下 SSRF 绕过。

#### 资深回答模板

我把文件视为不可信二进制：客户端只提示，服务端流式限额、探测、扫描和隔离。远程 URL 抓取由服务端按协议、目的、解析 IP 和每次重定向逐层校验，并用出口网络策略与大小、超时上限兜底。存储键随机且不可执行，预览在独立源并按类型转换；下载头准确、nosniff、文件名安全，预签名凭证短期且不进入日志。

:::

**追问链：**
1. 为什么图片也可能不安全？
2. `Content-Disposition: attachment` 是否足够？
3. 预签名上传 URL 应限制哪些条件？

::: details 追问参考答案

**1. 为什么图片也可能不安全？**

图片解析器可能有漏洞，SVG 本身可包含脚本、外部资源和交互，多态文件还能被不同解析器按不同类型解释。应限制格式与像素 / 解压规模，使用隔离且及时更新的解码器重编码位图；SVG 默认按不可信文档处理，不在主站同源直接 inline。

**2. `Content-Disposition: attachment` 是否足够？**

不够。浏览器和中间件行为、MIME、nosniff、文件名编码与打开后的本地应用风险仍需考虑。响应还应设置准确 Content-Type、`nosniff`、安全文件名和权限校验；高风险格式可打包或提示。旧客户端差异要实测，不能以单头作为绝对隔离。

**3. 预签名上传 URL 应限制哪些条件？**

限制对象键、方法、有效期、最大大小和允许 Content-Type / 校验和，签发前完成用户与业务配额授权；上传后对象仍保持私有隔离，服务端根据实际对象重新校验并扫描。URL 是 Bearer 凭证，不放入分析、Referer、聊天或日志。

:::

---

### D8. WebSocket 与 SSE 的鉴权、重连和限流如何设计？

::: details 参考答案

#### 基础结论

两者都要在服务端建立连接时鉴权，并在连接生命周期内处理权限变化、过期、心跳、断线和背压。浏览器 API 有限制：原生 WebSocket 不能任意设置 Authorization 请求头，`EventSource` 也不能设置自定义头；查询 Token 易泄漏，应优先同源 Cookie / BFF 或短期一次性票据。

#### 原理深挖

WebSocket 从 HTTP opening handshake 开始：HTTP/1.1 使用 Upgrade，HTTP/2 和 HTTP/3 使用 Extended CONNECT，具体可用性取决于客户端、服务端和中间代理。服务端必须验证 Origin，因为浏览器会自动携带 Cookie，恶意站点可尝试 Cross-Site WebSocket Hijacking。原生 `EventSource` 是单向文本流，只暴露用户代理自动重连和服务端 `retry` 字段设置重连时间；构造器不能配置自定义请求头，也没有指数退避或 jitter 选项。WebSocket 没有内建可靠重连、确认或背压协议，浏览器 `WebSocket` API 的发送缓冲也需应用监控。

#### 工程场景

opening handshake 校验会话、Origin、短期票据和频道权限，连接关联用户、设备与过期时间。WebSocket 由应用实现指数退避加 jitter，重连后重新鉴权、订阅并按业务序列对账。EventSource 自动重连时，仅在内部 last event ID 非空时发送 `Last-Event-ID`；服务端发送空 `id:` 会清空该内部值，后续重连不再发送此头。它仍不表示业务已提交确认，手动创建新的 EventSource 也不会继承旧实例游标。需要可控退避、自定义头或业务确认时，使用 fetch 流、受审查的 polyfill，或持久化业务游标并通过受控 URL 参数恢复。服务端限制连接数、消息速率、大小和队列，慢消费者降级或断开。

#### 反例 / 踩坑

把长期 Token 放查询串并进入 CDN / 网关日志；只在首次连接鉴权，用户登出后连接永久有效；为原生 EventSource 虚构不可配置的指数退避参数，或手动重建后假设旧 Last-Event-ID 自动继承；所有客户端固定 1 秒重连造成惊群；无消息大小与订阅权限限制；SSE 经代理缓冲导致消息迟迟不达；把客户端发送成功等同服务端已处理。

#### 资深回答模板

我先按单向或双向选择 SSE / WebSocket，再围绕浏览器头部限制设计同源 Cookie 或一次性票据。WebSocket opening handshake 与频道都鉴权，应用重连带退避、序列和补偿；原生 EventSource 只依赖 UA 重连与服务端 retry，需要更多控制时改用 fetch / polyfill 或业务游标。服务端做 Origin、连接、速率、大小和背压治理，凭证不进 URL 日志。

:::

**追问链：**
1. 为什么 WebSocket 服务端要校验 Origin？
2. SSE 如何避免重连后漏消息或重复处理？
3. 浏览器 WebSocket 如何处理背压？

::: details 追问参考答案

**1. 为什么 WebSocket 服务端要校验 Origin？**

浏览器发起跨站 WebSocket 时可能自动携带目标站 Cookie，而 WebSocket 不受普通 CORS 响应读取模型保护。服务端若只看 Cookie，恶意页面可借用户会话建立连接。应校验精确 Origin，并叠加 SameSite、一次性票据、频道授权，非浏览器客户端则使用独立认证策略。

**2. SSE 如何避免重连后漏消息或重复处理？**

服务端可为事件分配 ID；同一原生 EventSource 自动重连时，只有内部 last event ID 非空，用户代理才发送 `Last-Event-ID`，服务端可据此从保留窗口补发。空 `id:` 会把内部值清空，后续重连不发送该头。这个内部值只表示已解析到的事件，不表示业务已提交；客户端仍需按业务 event id 幂等处理，并把业务提交游标独立持久化。手动新建 EventSource 不继承旧内部值，应把持久化游标放入受控 URL，或改用 fetch / polyfill 自定义恢复。缺口超出窗口时执行快照对账。

**3. 浏览器 WebSocket 如何处理背压？**

标准 `WebSocket` 接口没有完整流式背压，应监控 `bufferedAmount`，设置高低水位，暂停或合并非关键消息，超过上限时丢弃可丢数据或断线重同步。接收侧也要限制解析队列并让渲染分批。不能无限 `send()`，否则内存和延迟会持续增长。

:::

---

### D9. 前端安全事件发生后，如何响应并保留有效日志证据？

::: details 参考答案

#### 基础结论

先控制影响面和保护用户，再保全可验证证据、确定暴露范围、修复根因并安全恢复。前端日志用于关联而非存放秘密：不记录密码、Cookie、Authorization、OAuth code、access / refresh token、预签名 URL 或完整敏感表单。

#### 原理深挖

浏览器遥测可能被攻击者篡改、阻断或伪造，不能作为唯一可信证据；需要与 CDN、WAF、网关、身份系统、服务端审计和发布记录按时间及 trace 关联。过度采集会扩大数据泄露和合规风险，脱敏后仍要防可逆标识与查询参数外泄。

#### 工程场景

预先定义严重度、值班、熔断开关和证据保留策略。发现恶意脚本时冻结发布信息、依赖版本、CSP 报告和相关服务端日志，停用第三方、撤销会话 / Token、轮换密钥并通知受影响用户。记录 UTC 时间、版本、不可逆会话关联、动作与责任人，限制证据访问并校验完整性。

#### 反例 / 踩坑

为排障打开全量请求头和 body；直接删除被攻陷实例导致证据丢失；只修前端字符串不撤销已泄露会话；依赖客户端 IP 精确识别攻击者；未确认范围就宣布无影响；恢复后没有复盘、检测规则和演练。

#### 资深回答模板

我按遏制、取证、根因、恢复和复盘推进：先熔断入口与撤销凭证，再关联浏览器、边缘、身份和服务端证据。日志默认最小化、脱敏且不含任何原始凭证；所有结论标注证据可信度，恢复前验证检测与回归门禁。

:::

**追问链：**
1. 如何在不记录 Token 的情况下关联会话事件？
2. CSP 报告能否证明 XSS 已执行？
3. 凭证疑似泄露后为什么仅修改密码可能不够？

::: details 追问参考答案

**1. 如何在不记录 Token 的情况下关联会话事件？**

由服务端生成无敏感语义的 session / event id，或用受控密钥对凭证标识做不可逆、可轮换 HMAC 指纹，只记录短期关联值和必要元数据。不能记录原始 Token、可直接重放的 hash 或完整 Cookie；访问、保留期和跨系统传播都应受控。

**2. CSP 报告能否证明 XSS 已执行？**

不能。报告说明浏览器观察到违反策略的资源或执行尝试，可能来自扩展、误配置、扫描器或攻击，也可能被阻断前未成功执行。应关联版本、用户动作、服务端请求、DOM sink 证据和强制策略状态；报告可采样、丢失和伪造，只是调查信号。

**3. 凭证疑似泄露后为什么仅修改密码可能不够？**

已有 Session、refresh token、API key 或 OAuth 授权可能在改密后仍有效。应按凭证类型撤销会话和 token family、轮换密钥、终止实时连接，并检查持久化后门与第三方授权。恢复后再要求重新认证和 MFA，通知用户并监控重放与异常设备。

:::
