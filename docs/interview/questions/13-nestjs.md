# NestJS 面试题库

> **怎么用：** 先盖住答案，按 **机制 → 请求链路 → 数据与安全 → 生产运维** 口述 2～3 分钟，再展开答案补洞。追问用于模拟面试官加压；回答重点是能落地、能排障、能做权衡。

> **版本基线：** 本文以 NestJS 11.x 官方文档截至 2026-08 的公开行为为基线，不绑定未核实的内部源码版本。按官方迁移文档，NestJS 11 要求 Node.js 20+，默认集成 Express 5，`@nestjs/platform-fastify` v11 支持 Fastify 5；两类底层平台升级均可能带来破坏性变化。`@nestjs/cqrs`、Terminus、Throttler、BullMQ 集成、ORM 驱动等独立包可能采用各自版本节奏，默认值和 API 必须以项目锁定版本的官方文档、类型声明和实测结果为准。

> **岗位定位：** 面向资深前端 / 全栈偏前与 Vue 3 + BFF 场景。要求讲清 Node.js、TypeScript、接口契约和生产治理，不机械套用 Spring 概念，也不伪装专职数据库或分布式系统专家。

> **延伸阅读：** [NestJS + Prisma + MySQL 实战指南](/interview/guides/backend/nestjs-prisma) · [数据库与 Prisma 面试题库](/interview/questions/15-database-prisma)

## 一、模块、依赖注入与框架机制

### Q1. Module、Controller、Provider 各自负责什么，如何划分边界？

**考察点：** NestJS 基本抽象、职责分离、模块边界

::: details 参考答案

- **Module** 用 `imports`、`controllers`、`providers`、`exports` 描述一个能力边界和依赖图，是组装单元。
- **Controller** 负责协议适配：声明路由、读取请求、调用应用服务并返回结果，不应承载复杂业务和数据库事务。
- **Provider** 是容器可管理的依赖，可承载应用服务、领域服务、仓储、策略、工厂或基础设施适配器。

按业务能力而不是技术目录拆模块更稳妥，例如 `OrderModule` 内部包含订单用例、仓储端口和 HTTP Controller。跨模块只导出稳定能力，不导出所有内部 Provider。Controller 薄并不等于只剩一行，而是协议细节止于 Controller，业务规则不依赖 HTTP 对象。

**追问：**
1. 为什么不把所有 Provider 放进 `SharedModule`？
2. Controller 可以直接调用 Repository 吗？
3. 一个模块过大时用什么信号拆分？

:::

### D1. NestJS 的模块可见性和 DI token 是怎样工作的？

::: details 参考答案

#### 基础结论

Provider 默认只在宿主模块内可见。消费模块必须 `import` 提供方模块，且提供方必须 `export` 对应 Provider 或 token。token 是容器查找依赖的键，可以是类、字符串或 `Symbol`；跨模块契约优先用稳定 token，不让上层依赖基础设施实现类。

#### 原理深挖

`@Module()` 元数据构成模块依赖图，容器在模块上下文中解析构造参数 token。类既可作为实现也可作为 token；接口在 TypeScript 编译后不存在，不能直接注入，因此需要显式 token。`useClass` 替换实现，`useValue` 注入常量或测试替身，`useFactory` 按依赖创建实例，`useExisting` 给已有实例建立别名。

#### 工程场景

订单模块声明 `ORDER_REPOSITORY`，生产绑定 Prisma 实现，测试绑定内存实现。模块只导出 `OrderApplicationService`，不导出数据库客户端。遇到「Nest can't resolve dependencies」时，按 token 是否一致、Provider 是否注册、模块是否导出、消费模块是否导入、scope 是否兼容逐层检查。

#### 反例 / 踩坑

字符串 token 到处手写容易拼错；把模块标成 `@Global()` 只为省略 `imports`，会隐藏依赖；重复注册同一个类可能产生不同模块上下文中的实例，误以为一定是全应用唯一对象。

#### 资深回答模板

「判断：先把模块当封装边界，把 token 当依赖契约。证据：沿消费点到导出模块检查 token 和模块图。落地：接口使用集中定义的 `Symbol`，生产和测试通过 custom provider 替换实现，避免全局模块掩盖依赖。」

:::

**追问链：** `exports` 导出类与导出 token 有何区别？→ `useExisting` 和 `useClass` 是否共享实例？→ 如何定位同名 token 冲突？

### Q2. custom provider 有哪些写法，分别适合什么场景？

**考察点：** `useValue`、`useClass`、`useFactory`、`useExisting`

::: details 参考答案

1. `useValue`：注入配置对象、已有实例或测试 mock；要注意共享可变状态。
2. `useClass`：按环境或策略选择实现，容器负责实例化该类。
3. `useFactory`：需要依赖其他 Provider、异步初始化或按配置构造客户端时使用，可配合 `inject`。
4. `useExisting`：为已注册 Provider 建别名，两个 token 指向同一实例；与 `useClass` 新建实例不同。

生产中我会让业务层依赖 token，把 Prisma、Redis、第三方 API 都放在适配器后面。异步工厂若连接外部服务，应有超时、失败策略和关闭钩子，不能让启动无限等待。

**追问：**
1. `useFactory` 返回 Promise 是否可用？
2. 测试里怎样覆盖 custom provider？
3. 为什么接口不能直接作为注入 token？

:::

### D2. singleton、request、transient scope 如何选择，为什么 request scope 会扩散？

::: details 参考答案

#### 基础结论

默认 scope 是 singleton，实例生命周期通常跟随应用，适合无请求态的 Service、Repository 和客户端。request scope 每个入站请求创建实例；transient 每个注入它的消费者获得独立实例。绝大多数 Provider 保持 singleton，把请求信息显式作为参数传递。

#### 原理深挖

singleton 若依赖 request-scoped Provider，就无法在启动时固定一个实例，因此 request scope 会沿依赖链向上扩散，依赖它的 Controller 也会按请求创建。transient 的语义是「按消费者」，不会以相同方式让整个依赖链都变成 transient。官方文档也提示 request scope 会增加实例创建和回收成本，实际影响应压测。

WebSocket Gateway 封装真实 socket，必须表现为 singleton，不应依赖 request-scoped Provider；官方文档指出相同限制也适用于 Passport Strategy、Cron Controller 等需要保持 singleton 的 Provider。不同协议的上下文 token 也不同：HTTP 可注入 `REQUEST`，GraphQL 应注入 `CONTEXT`，不能把 HTTP Request 假设复制到所有执行上下文。

#### 工程场景

多租户场景可从 Guard 解析租户，将 `tenantId` 放入请求上下文，再由小范围 request-scoped 门面读取；更高吞吐场景可用显式参数或经过评估的异步上下文方案。官方的 durable provider 需要自定义 `ContextIdStrategy`，把具有共同属性的请求复用到同一 DI 子树，并给 request-scoped Provider 标记 `durable: true`；它只适合租户数量受控、可安全复用子树等特定优化，不是把任意请求态变回 singleton。排障时统计实例化次数、堆分配和 P95/P99。

#### 反例 / 踩坑

为了拿 `request.user` 把日志、数据库、缓存整条链都设为 request scope，会造成大量对象创建；在 singleton 中保存当前用户则会串请求。给 Gateway 或 Passport Strategy 注入 request-scoped 依赖，或在 GraphQL 中硬注入 `REQUEST`，都会把生命周期模型用错。后台任务和 CQRS 消息也不天然拥有 HTTP Request。

#### 资深回答模板

「判断：默认 singleton，只有确实存在请求生命周期状态才缩小范围使用 request scope。约束：Gateway、Passport Strategy、Cron 等 singleton 组件不向下依赖请求 scope，GraphQL 使用 `CONTEXT`。优化：durable provider 只在分组复用安全且压测有收益时采用。」

:::

**追问链：** request scope 如何影响 Controller？→ GraphQL 为什么注入 `CONTEXT`？→ durable provider 的复用边界如何证明安全？

### Q3. 动态模块和异步配置解决什么问题？

**考察点：** Dynamic Module、`forRootAsync`、可配置基础设施

::: details 参考答案

动态模块让消费方在导入时决定 Provider、配置和导出项，常见约定是 `register` / `forRoot` 与 `registerAsync` / `forRootAsync`。同步方式适合已知常量；异步方式通过 `useFactory`、`useClass` 或 `useExisting` 注入 `ConfigService`、密钥服务等，再生成 options Provider。

返回的 `DynamicModule` 元数据会扩展静态 `@Module()` 元数据，而不是简单覆盖。可复用库可使用 `ConfigurableModuleBuilder` 减少样板代码。应用层不应滥用 `global: true`；动态模块要明确 token、默认值、重复导入语义和资源关闭方式。

**追问：**
1. `forRoot` 与 `forFeature` 通常如何分工？
2. 为什么异步工厂不能随意发起无超时网络请求？
3. 动态模块重复导入时实例一定共享吗？

:::

### D3. Decorator、Metadata、Reflector 与容器扫描如何串起来？

::: details 参考答案

#### 基础结论

Decorator 主要声明元数据，容器和请求管线在合适阶段读取元数据并执行行为。`@Injectable()` 标识可由容器管理的类，参数类型元数据与显式 `@Inject(token)` 帮助解析依赖；自定义权限 Decorator 写入元数据，Guard 用 `Reflector` 读取。

#### 原理深挖

TypeScript Decorator 本身不是 DI。应用启动时，Nest 根据根模块递归发现导入模块，登记 Controller 与 Provider，解析依赖并按 scope 创建实例；请求到达后，框架再读取路由、Guard、Pipe 等元数据。继承、方法级与类级元数据的合并或覆盖应显式选择 `getAllAndMerge`、`getAllAndOverride` 等语义。

#### 工程场景

可以定义 `@Permissions('order.refund')`，Guard 同时读取 handler 与 class 的 metadata，再查询策略引擎。排查 Decorator「不生效」时，先看 Decorator 是否写对 key、Guard 是否绑定、Reflector 读取目标和覆盖顺序是否正确，而不是猜测框架扫描源码文本。

#### 反例 / 踩坑

把 Decorator 当业务函数，在定义阶段读取运行时请求；依赖接口却未提供 token；把未经官方证实的内部类名和扫描顺序当稳定 API；在自定义 Decorator 中堆大量隐式副作用，都会让行为难测且易受升级影响。

#### 资深回答模板

「判断：Decorator 负责声明，容器和请求组件负责解释。链路：模块元数据建立依赖图，token 解析实例，路由阶段用 Reflector 读取策略元数据。边界：只依赖公开 API，不把内部扫描实现当契约。」

:::

**追问链：** TypeScript interface 为什么不能作为 token？→ 类级和方法级权限如何覆盖？→ Decorator 组合如何测试？

### Q4. 如何处理模块或 Provider 循环依赖？

**考察点：** `forwardRef`、`ModuleRef`、架构解耦

::: details 参考答案

先判断循环是否暴露边界错误。订单和支付互相调用时，可提取编排服务、领域事件或共同端口，使依赖保持单向。`forwardRef()` 可延迟解析模块或 Provider 引用，但双方通常都要配合，且实例化顺序不应成为业务假设。`ModuleRef` 可在确有需要时延迟查找依赖，但会降低静态可见性。

还要区分 DI 循环和文件 import 循环；后者可通过移动 token、拆公共类型和避免 barrel file 隐式回环解决。`forwardRef` 是兼容工具，不是架构设计目标。

**追问：**
1. 如何判断是文件循环还是容器循环？
2. 事件解耦会引入哪些一致性成本？
3. 使用 `ModuleRef.get()` 有哪些测试代价？

:::

## 二、请求生命周期与接口契约

### D4. Middleware、Guard、Interceptor、Pipe、Filter 的完整执行顺序是什么？

::: details 参考答案

#### 基础结论

按 NestJS 官方请求生命周期的一般顺序：Middleware → Guard → Interceptor 入站 → Pipe → Controller / Provider → Interceptor 出站；若有未捕获异常，则跳到 Exception Filter。全局、Controller、路由级组件还有各自解析顺序，不能只背五个名词。

#### 原理深挖

Guard 通常按全局到 Controller 再到路由执行；Interceptor 入站同向，出站因 RxJS Observable 包裹而按路由到 Controller 再到全局返回。Pipe 的完整层级是 global → controller → route → parameter；同一层通过 `@UsePipes(PipeA, PipeB)` 绑定时按声明顺序执行。每一层处理多个方法参数时，从参数列表最后一个向第一个执行，例如 `(body, params, query)` 会先处理 `query`，再处理 `params`、`body`，然后进入下一层 Pipe。Filter 与其他组件不同，从最靠近路由的 Filter 开始；某个 Filter 已处理异常后，不会自动继续交给外层 Filter。

#### 工程场景

请求日志和 trace 放 Middleware 或全局 Interceptor；认证授权放 Guard；DTO 转换校验放 Pipe；超时、响应映射放 Interceptor；统一异常契约放全局 Filter。排障时给每层记录阶段、traceId 和耗时，用实际日志还原顺序。

#### 反例 / 踩坑

在 Middleware 里读取 DTO 校验结果，此时 Pipe 尚未执行；误以为方法参数从左到右经过 Pipe；在 Interceptor 里吞掉错误导致 Filter 不触发；认为全局 Filter 一定最先捕获；通过 `@Res()` 手动响应后仍期待标准响应映射完整接管。

#### 资深回答模板

「主链：Middleware、Guard、Interceptor 入站、Pipe、Handler、Interceptor 出站；未捕获异常进入最近的 Filter。Pipe 按 global、controller、route、parameter 分层，同层 FIFO，参数从最后到第一个。验证：用 trace 日志还原真实绑定顺序。」

:::

**追问链：** `(body, params, query)` 的 Pipe 顺序？→ Pipe 抛错后哪些层能观察到？→ route Filter 捕获后 global Filter 是否还执行？

### Q5. 五类请求组件分别应该做什么，不应该做什么？

**考察点：** 组件职责、关注点分离、可测试性

::: details 参考答案

- Middleware：底层请求预处理，如 correlation ID、原始日志、Cookie 解析；不适合依赖路由 handler 元数据做细粒度授权。
- Guard：回答「当前请求能否进入 handler」，适合认证、RBAC / ABAC；不负责业务数据转换。
- Pipe：转换和校验参数；不应做跨系统副作用。
- Interceptor：包裹执行流，适合耗时、超时、缓存、响应映射；不要把所有异常都转成成功响应。
- Filter：把未捕获异常映射为协议响应；不应成为补偿事务的万能位置。

选择标准是所需上下文、执行时机与失败语义，而不是个人偏好。

**追问：**
1. 认证放 Middleware 和 Guard 的差异？
2. 缓存放 Interceptor 有什么限制？
3. 业务异常应该在哪里定义、在哪里映射？

:::

### Q6. DTO、ValidationPipe 和参数转换如何设计？

**考察点：** 运行时校验、白名单、类型转换

::: details 参考答案

TypeScript 类型在运行时不能替代输入校验。常见做法是使用 class DTO 配合 `class-validator`、`class-transformer` 和全局 `ValidationPipe`：

- `whitelist: true` 移除未声明属性；高风险接口可用 `forbidNonWhitelisted: true` 直接拒绝。
- `transform: true` 可把 plain input 转为 DTO 实例，并支持参数转换；隐式转换行为应结合锁定版本和测试确认。
- 嵌套对象需要正确声明嵌套校验和类型信息。
- 校验错误应映射为稳定业务错误码和字段路径，而不是把内部 constraint 文本直接当长期契约。

DTO 用于协议边界，数据库 Entity 不应直接兼任输入 DTO。

**追问：**
1. `whitelist` 与 `forbidNonWhitelisted` 区别？
2. 为什么 `id: number` 不代表收到的一定是数字？
3. Partial DTO 如何避免更新接口误清空字段？

**踩坑：** 只写 TypeScript interface，没有任何运行时校验；或开启转换后未测试 `"false"`、空字符串、超大数字等边界值。

:::

### D5. Interceptor 为什么使用 RxJS 流，如何正确处理超时、映射和异常？

::: details 参考答案

#### 基础结论

`next.handle()` 返回 Observable，Interceptor 可以在订阅链上使用 `map`、`tap`、`timeout`、`catchError`、`finalize` 等操作符包裹 handler。若不调用 `handle()` 并直接返回新流，handler 不会执行，可实现缓存短路。

#### 原理深挖

Observable 使执行前后、成功、错误和取消信号统一在一条流中，因此多个 Interceptor 能形成嵌套结构。`tap` 适合观测而非改变值，`map` 负责响应映射，`catchError` 必须明确是转换后重新抛出还是恢复为正常值，`finalize` 更适合无论成功失败都要执行的清理和耗时记录。RxJS `timeout` 会让当前订阅超时并转入错误路径，但取消订阅不等于自动取消已经启动的 Promise、数据库查询或 HTTP 副作用。

#### 工程场景

全局 Interceptor 写 traceId、耗时和状态；HTTP 总超时只作为兜底。真正限制资源占用，要把 deadline / `AbortSignal` 继续传给 HTTP 客户端，并使用数据库驱动的取消、statement timeout 等能力；不支持取消的操作仍需幂等和结果隔离。响应包装前识别流式下载、SSE、文件和 `@Res()` 场景，避免破坏协议。

#### 反例 / 踩坑

把响应超时误当底层工作已停止，客户端收到 408/504 后数据库写入仍可能完成；在 `catchError` 返回 `{ code: 500 }`，HTTP 状态仍为 200；用 `tap` 误以为能转换返回值；`map(data => ({ data }))` 包裹文件流；忘记返回 `next.handle()` 导致 handler 被跳过。

#### 资深回答模板

「判断：Interceptor 是可组合的执行流边界。实现：`tap/finalize` 做观测，`map` 做协议映射，`catchError` 保持错误语义。超时：Observable 停止订阅不等于副作用取消，deadline 必须下传到支持 AbortSignal 或驱动取消的底层。」

:::

**追问链：** `catchError` 后 Filter 何时还能收到异常？→ RxJS 超时后数据库写入为何可能继续？→ 如何把 deadline 传到底层？

### Q7. 如何建立统一异常和错误码契约？

**考察点：** Exception Filter、领域错误、前后端契约

::: details 参考答案

业务层抛出与 HTTP 解耦的领域 / 应用错误，协议层由全局 Filter 映射成 `{ code, message, details, traceId }` 与合适 HTTP 状态。错误分类至少区分输入无效、未认证、无权限、资源冲突、依赖不可用和未知故障；未知异常返回通用文案并记录完整堆栈。前端刷新与页面状态机见 D16，本题重点是服务端错误分类和协议映射。

`code` 是稳定机器契约，`message` 可本地化，`details` 只放安全的字段错误，`traceId` 用于定位。HTTP 401 表示凭证缺失或当前凭证不可接受，需要认证；403 表示身份已经确认，但无权执行该操作。不要把所有错误都返回 200，也不要暴露数据库错误、路径、SQL、token 原因。Filter 还需分别适配 HTTP、RPC 或 WebSocket 上下文。

**追问：**
1. 401 与 403 如何区分？
2. 校验错误如何表达字段级信息？
3. 前端是否应该根据 `message` 写业务分支？

:::

### D6. 序列化、Swagger、API versioning 如何形成可演进契约？

::: details 参考答案

#### 基础结论

输入 DTO、输出 DTO、OpenAPI 文档和版本策略要共同表达契约。`ClassSerializerInterceptor` 可按 `class-transformer` 规则把实例转为 plain object，但不能替代显式输出模型和敏感字段审查。NestJS 官方支持 URI、Header、Media Type 和 Custom versioning，选择后要定义弃用周期。

#### 原理深挖

编译期 TypeScript 类型不会自动成为完整运行时 Schema；泛型、联合类型、映射类型和 plain object 可能需要显式 Swagger 描述。序列化规则通常依赖类实例，若 ORM 返回 plain object 或手写投影，要验证装饰器是否实际生效。版本控制解决破坏性契约并存，不解决随意复制代码。

#### 工程场景

Vue 客户端从 OpenAPI 生成类型和请求层，CI 检查 breaking change。URI 版本便于网关、缓存和排障；Header / Media Type 可保持 URL，但客户端与代理治理更复杂。输出 DTO 明确暴露字段，密码、refresh token、内部状态永不进入序列化候选集。

#### 反例 / 踩坑

直接返回 ORM Entity 后才依赖 `@Exclude()` 补救；Swagger 显示可选但 Validation 实际必填；生成类型后手工修改；上线 v2 当天删除 v1；把数据库字段重命名直接等同 API breaking change。

#### 资深回答模板

「判断：契约以运行时行为和 Schema 为准，不只看 TS 类型。落地：输入校验、输出白名单、OpenAPI diff、消费者契约测试和版本弃用窗口一起做。安全：敏感字段从查询与输出模型两层排除。」

:::

**追问链：** plain object 为什么可能绕过预期序列化？→ 版本放 URI 还是 Header？→ 如何在 CI 发现 breaking change？

## 三、鉴权、权限与数据访问

### Q8. JWT access token、refresh token 与 Session 如何选择？

**考察点：** 身份状态、撤销能力、浏览器安全

::: details 参考答案

短期 access token 适合 API 鉴权，降低泄露窗口；refresh token 用于换取新 access token，需要服务端保存会话族、版本或哈希以支持撤销和轮换。传统 Session 将主要状态放服务端，浏览器持有不透明 session ID，撤销和并发会话治理更直接，但需要共享存储与 Cookie / CSRF 设计。

浏览器场景通常优先把长期凭证放 `HttpOnly`、`Secure`、合适 `SameSite` 的 Cookie，access token 是否放内存或 Cookie 取决于部署与 CSRF 模型。不要把 localStorage 说成绝对安全或绝对禁止，要说明 XSS、CSRF、跨域和刷新后的权衡。

**追问：**
1. JWT 为什么不是天然「无状态」方案？
2. Cookie 鉴权如何防 CSRF？
3. 用户改密码后怎样让旧会话失效？

:::

### D7. refresh token rotation 如何处理重放、并发刷新和登出？

::: details 参考答案

#### 基础结论

每次刷新都签发新的 refresh token，并让旧 token 失效；服务端只存 token 哈希、会话族 ID、当前版本、过期时间和设备信息。若已失效 token 再次出现，视为可能重放，可撤销整个 token family 并要求重新登录。

#### 原理深挖

纯自包含 refresh JWT 若不保留服务端状态，很难可靠实现单设备撤销、轮换重放检测和会话列表。并发请求可能同时用同一个旧 token 刷新，因此需事务、唯一约束、原子 compare-and-set，或设置很短且有边界的重叠窗口；窗口过大又会削弱重放检测。

#### 工程场景

刷新端点只接收 Cookie 中 refresh token，先校验 `Origin` / `Referer` 等同源信号，并使用同步 token，或使用 HMAC 签名且绑定当前会话标识的 double-submit token，再在事务内校验哈希并旋转，返回短期 access token 并覆盖 Cookie。不能使用攻击者可自行种入的普通双提交 Cookie 作为安全证明；`SameSite` 也只是纵深防御，受部署拓扑、浏览器行为和同站攻击面影响，不能替代完整 CSRF 设计。前端刷新状态机见 D16。

#### 反例 / 踩坑

refresh token 永久不轮换；明文入库；只设置 `SameSite` 就宣称没有 CSRF；多个标签页触发刷新风暴；登出只删除前端 token，不撤销服务端会话；日志记录完整 token。

#### 资深回答模板

「判断：refresh token 是可撤销会话凭证，不只是更长的 JWT。落地：短 access token、refresh 哈希存储、事务轮换、重放撤销 token family。浏览器：同源校验加 CSRF token 或等价防护，SameSite 不单独承担安全边界。」

:::

**追问链：** 两个并发刷新请求谁成功？→ 多设备登出如何做？→ token family 被重放后如何告警？

### Q9. RBAC 与 ABAC 有什么区别，怎样与前端路由和按钮权限对齐？

**考察点：** 授权模型、前后端一致性、Guard

::: details 参考答案

RBAC 按角色聚合权限，简单稳定；ABAC 根据主体、资源、动作、环境属性做策略判断，表达力更强但治理成本更高。常见方案是 RBAC 授予动作权限，ABAC 补充「只能操作本租户、本人或指定状态订单」。

后端是最终裁决者：自定义 Decorator 声明权限，Guard 通过 `Reflector` 读取，再把用户、资源与上下文交给策略服务。前端路由和按钮只改善体验，可消费同一权限 key 清单，但不能替代后端校验。接口返回稳定 401 / 403 和业务错误码，前端统一处理隐藏、禁用或无权限页。

**追问：**
1. 菜单可见为何不等于接口可调用？
2. 资源属性要查询数据库时 Guard 如何避免重复查询？
3. 超级管理员如何避免散落硬编码？

:::

### D8. TypeORM 与 Prisma 如何选，模型边界应怎样设计？

::: details 参考答案

#### 基础结论

TypeORM 偏 Data Mapper / Active Record 风格并深度使用 Decorator，Repository 与实体关系表达直接；Prisma 以 Schema、生成客户端和显式查询为核心，类型体验与迁移工具链清晰。选择应看团队经验、目标数据库能力、复杂查询、迁移回滚、生成物和 SQL 可观测性，不应只看语法短。模块数据所有权与跨模块约束见 D15。

#### 原理深挖

ORM 解决映射和查询构造，不消除数据库约束、索引、事务与执行计划。这里的核心决策是工具能力是否匹配查询和迁移，而不是为了「纯架构」增加映射层；复杂领域可隔离持久化模型，CRUD BFF 可适度简化，但数据库字段仍不应直接成为 API 契约。

#### 工程场景

POC 用真实数据验证复合索引、关系查询、批量写入、事务、迁移回滚、连接复用和 SQL 可观测性；高风险报表可用显式 SQL / query builder，而不是强迫 ORM 表达所有查询。最终记录版本、驱动限制和退出成本。

#### 反例 / 踩坑

把 ORM 类型安全误当数据一定存在；自动同步 Schema 直接用于生产；一个全局 Prisma / 数据源之外又在请求里反复创建客户端；Entity 同时承担数据库、输入 DTO、输出 DTO 和领域对象四种职责。

#### 资深回答模板

「判断：ORM 是基础设施选择，不是架构本身。证据：用真实复杂查询、迁移和故障场景做 POC。边界：API DTO、领域模型、持久化模型按复杂度分离，并保留执行 SQL 与观测执行计划的能力。」

:::

**追问链：** Prisma 类型安全覆盖不了哪些运行时问题？→ 何时直接写 SQL？→ 生产迁移为什么不能只靠 auto sync？

### Q10. offset、cursor 分页如何选择？

**考察点：** 分页稳定性、索引、契约

::: details 参考答案

offset / limit 支持任意跳页，适合小数据后台，但深分页成本高，且并发插入删除会造成重复或遗漏。cursor / keyset 以稳定排序键继续查询，性能和一致性更好，适合信息流，但不擅长精确跳页。

cursor 排序必须确定，例如 `createdAt DESC, id DESC`；查询条件和复合索引顺序要匹配，游标应编码并校验而非信任客户端拼 SQL。响应可返回 `items`、`nextCursor`、`hasMore`；总数昂贵时不要每页强制精确 `count(*)`。

**追问：**
1. 只用 `createdAt` 为什么可能不稳定？
2. 筛选条件改变后旧 cursor 还能用吗？
3. 后台必须跳到第 100 页怎么办？

:::

### D9. 如何治理事务、N+1 和数据库连接池？

::: details 参考答案

#### 基础结论

事务边界围绕一个一致性用例，所有数据库操作必须使用同一 transaction context。N+1 要通过批量查询、join、预加载或 DataLoader 消除。连接池大小结合数据库上限、实例数、查询时长和并发估算，不能每个 Pod 都开到最大。

#### 原理深挖

事务只保证其数据库范围内的原子性，不能包住消息队列或外部 HTTP 就自动获得分布式一致性。长事务占连接并扩大锁竞争；N+1 把一次逻辑请求放大成 N 次网络往返；连接池耗尽通常表现为排队超时，不等同数据库 CPU 已满。

#### 工程场景

下单在短事务内写订单与 outbox，提交后异步发布事件。列表查询记录 SQL 数、慢查询和执行计划。连接预算按「数据库可用连接 ÷ 服务实例上限」分配，并为迁移、管理和故障留余量；监控活跃、空闲、等待、超时与事务时长。

#### 反例 / 踩坑

事务 callback 内调用支付 API；循环 `await repository.findOne()`；为了避免超时盲目增大池；捕获事务异常后继续使用已回滚上下文；Promise 并发操作却以为都自动属于同一事务。

#### 资深回答模板

「判断：先量化单请求 SQL 数、事务时长和池等待。治理：短事务、批量加载、匹配索引、连接总预算。跨系统一致性用 outbox、幂等和补偿，不用超长数据库事务硬包。」

:::

**追问链：** 如何证明是连接池耗尽而非数据库慢？→ ORM 事务上下文如何避免丢失？→ outbox 何时可能重复投递？

### Q11. Redis 缓存如何避免穿透、击穿和数据不一致？

**考察点：** cache-aside、TTL、并发治理

::: details 参考答案

常见 cache-aside：读先查缓存，未命中查库并回填；写先提交数据库，再删除或更新缓存。TTL 加随机抖动避免同时过期；不存在数据可短 TTL 缓存空值或用 Bloom Filter 降低穿透；热点 key 过期可用互斥重建、逻辑过期或 stale-while-revalidate。

缓存是性能层，不应成为无持久化兜底的数据真相。key 必须包含租户、权限、版本等隔离维度；序列化格式需要版本；监控命中率、回源、延迟、热 key 和内存淘汰。Nest Cache 集成的具体存储适配器 API 以锁定版本为准。

**追问：**
1. 先删缓存再写库有什么竞态？
2. 权限变化后用户缓存如何失效？
3. Redis 故障时系统应如何降级？

:::

### Q12. 队列、定时任务和文件上传分别要注意什么？

**考察点：** 异步任务、分布式调度、上传安全

::: details 参考答案

- 队列：生产者提交可重试消息，消费者必须幂等；设置重试退避、最大次数、死信队列、可观测状态和人工补偿。
- 定时任务：多实例部署会重复执行，需要分布式锁、leader election 或外部调度器；记录计划时间、实际时间和执行 ID。
- 文件上传：限制大小、数量、MIME 与文件签名，随机化对象 key，做病毒扫描；大文件优先客户端直传对象存储的短期签名 URL，服务端只保存元数据。

默认不要让不可控或执行时间较长的任务占住普通 HTTP 请求；需要实时增量结果时可用 SSE / 流式响应，需要强同步语义时也可在明确超时与资源上限内有界等待。其余任务返回任务 ID 后异步执行。上传内容不能只凭扩展名信任。

**追问：**
1. 队列「恰好一次」为何通常要拆成业务幂等？
2. 分布式锁过期但任务未结束怎么办？
3. 直传对象存储如何防止越权覆盖？

:::

## 四、生产工程、测试与性能

### D10. 配置、日志、trace 和 health check 如何形成可观测基线？

::: details 参考答案

#### 基础结论

配置在启动时校验，区分公开配置与密钥；日志使用结构化字段并贯穿 traceId；trace 跨 HTTP、数据库、缓存和消息传播；health 分为 liveness 与 readiness，前者判断进程是否需重启，后者判断是否可接流量。

#### 原理深挖

日志回答离散事件，指标回答趋势和告警，trace 回答一次请求跨组件的因果链，三者通过 service、environment、release、traceId 关联。readiness 若失败应摘流而非立刻重启；liveness 依赖过多下游会在下游故障时制造重启风暴。Nest 官方 Terminus 集成提供多类 health indicator，但检查项和超时仍需业务定义。

#### 工程场景

启动前用 Schema 验证端口、URL、枚举和必填密钥；生产日志脱敏 authorization、Cookie、手机号和 token。事件循环 lag 默认作为指标和告警信号，不直接让 liveness 失败，否则负载尖峰可能触发重启风暴；只有经过持续阈值、故障预算和演练验证后才考虑自动处置。`/ready` 检查关键数据库连接并设置短超时。

#### 反例 / 踩坑

把 `.env` 当配置治理全部；日志拼接字符串无法检索；记录完整请求体泄密；health 每次跑重 SQL；所有下游都塞进 liveness；只看 CPU 平均值却没有事件循环延迟和 trace。

#### 资深回答模板

「基线：配置启动即校验，日志结构化并脱敏，metrics 与 trace 关联。健康检查：live 判断进程，ready 判断接流资格。排障：从告警指标定位时间窗，再用 trace 和关联日志下钻。」

:::

**追问链：** 数据库不可用时 live 和 ready 各返回什么？→ traceId 如何跨消息传递？→ 如何避免高基数指标？

### Q13. 限流、幂等和基础安全如何组合？

**考察点：** 防滥用、重复请求、安全基线

::: details 参考答案

限流按 IP、用户、租户或接口成本选择维度，单实例内存计数不适合多副本全局限流；边缘网关做第一层，Nest Guard 做身份感知的第二层。创建 / 支付类接口接收 idempotency key，在数据库唯一约束或原子存储中绑定「调用方 + 操作 + 请求摘要 + 状态 + 结果」。已完成的同摘要请求返回原结果；摘要冲突返回 409；仍处理中则需预先约定返回 202 和查询地址、返回 409，或在短时上限内等待，不能让并发副本各自执行。

安全基线还包括严格 CORS allowlist、Helmet / 安全响应头、输入校验、参数化查询、Cookie 属性、密钥轮换、依赖审计、上传限制和最小权限。Helmet、CORS 在 Express / Fastify 下的注册方式和顺序可能不同，应按适配器文档配置。

**追问：**
1. 限流返回 429 后前端如何退避？
2. 幂等 key 保存多久？
3. CORS 能否阻止服务端到服务端攻击？

:::

### D11. NestJS 应如何做单元、集成和 E2E 测试隔离？

::: details 参考答案

#### 基础结论

单元测试隔离一个 Provider 并替换外部端口；集成测试验证模块与真实数据库 / 缓存适配；E2E 通过 `createNestApplication()` 验证完整 HTTP 管线。测试金字塔不是按名称堆数量，而是按风险选择最小有效边界。

#### 原理深挖

`Test.createTestingModule()` 使用真实 Nest 容器，能捕获 token、scope 和模块装配问题；纯类测试更快但看不到装配错误。E2E 才覆盖全局 Pipe、Guard、Interceptor、Filter 和实际序列化。官方测试工具支持 override Provider、Guard、Interceptor 等，但过度 override 会把被测系统掏空。

#### 工程场景

单元层 mock `ORDER_REPOSITORY` 与时钟；集成层每个测试用事务回滚、独立 Schema 或可清理容器；E2E 启动与生产一致的 bootstrap 配置，测试鉴权、错误契约和数据库。外部支付使用契约明确的 fake server，不直接调用生产沙箱。

#### 反例 / 踩坑

所有依赖都 mock 后只验证 mock；测试共享数据库且并行污染；E2E 忘记执行全局 ValidationPipe；依赖测试顺序；只断言 200，不断言副作用与错误契约；测试结束未关闭 app 和连接。

#### 资深回答模板

「策略：业务分支用快速单测，装配和持久化用集成测，关键用户路径用 E2E。隔离：稳定替身、独立数据、固定时钟、关闭资源。可信度：测试 bootstrap 与生产保持同源，避免 override 掏空系统。」

:::

**追问链：** 事务回滚隔离有哪些盲区？→ 怎样测试 request-scoped Provider？→ E2E 为何必须验证全局 Pipe 和 Filter？

### Q14. 如何测试 Guard、Interceptor、Filter 和数据库事务？

**考察点：** 横切组件测试、失败路径、事务验证

::: details 参考答案

Guard 单测覆盖 metadata、无身份、权限不足和资源属性；Interceptor 用 Observable 测成功、异常、超时和 finalize；Filter 用模拟 `ArgumentsHost` 做快速分支测试，再用 E2E 验证真实适配器响应。事务测试要使用真实数据库能力，断言失败后没有部分写入，同时覆盖唯一约束和并发冲突。

对外部依赖应测试超时、重试、熔断和幂等，不只 happy path。固定时钟、随机数和 ID 生成器可提高可重复性；测试结束显式关闭 Nest app、ORM、Redis 和队列连接。

**追问：**
1. 为什么只 mock Repository 测不出事务问题？
2. 如何验证 Interceptor 没吞异常？
3. 并发幂等测试怎样避免假阳性？

:::

### Q15. NestJS 应用如何容器化和优雅停机？

**考察点：** 生命周期钩子、Kubernetes、资源清理

::: details 参考答案

镜像采用锁定依赖、多阶段构建、非 root 用户和精简运行时；配置通过环境或密钥注入。关闭顺序按官方生命周期是 `onModuleDestroy()` → `beforeApplicationShutdown()` → 关闭现有连接（`app.close()`）→ `onApplicationShutdown()`，异步钩子会被等待。显式调用 `app.close()` 会触发终止阶段；`enableShutdownHooks()` 的作用是注册系统信号监听，让 SIGTERM 等信号也进入该流程，它不是调用 `app.close()` 的前提。

Nest 生命周期钩子本身不自动保证 Kubernetes 已摘流或所有在途请求已排空。应用需要先切换 readiness、停止拉取新任务并跟踪在途工作；Kubernetes / 负载均衡器需要传播摘流，`preStop`、终止宽限期和应用有界 drain 必须协作。最后关闭数据库、队列和遥测导出器；钩子要幂等、有超时，并在目标环境演练。

**追问：**
1. `app.close()` 与 `enableShutdownHooks()` 各负责什么？
2. `beforeApplicationShutdown()` 前后连接状态如何变化？
3. readiness 摘流与在途排空由谁协作完成？

:::

### D12. cluster、多副本与优雅停机应如何权衡？

::: details 参考答案

#### 基础结论

Node.js 单进程主要在一个事件循环线程执行 JavaScript。利用多核可选容器多副本、进程管理器或 Node cluster；在 Kubernetes 中通常优先一容器一进程并水平扩容，模型更简单，但不是绝对规则。

#### 原理深挖

多进程不共享内存，Session、限流、缓存和任务锁若只存在进程内会产生不一致。cluster 能共享监听端口，但仍需处理 worker 崩溃、滚动重启和连接排空。副本数增加会同时放大数据库连接、队列消费者和下游压力。

#### 工程场景

根据 CPU、事件循环延迟、内存、数据库池和吞吐压测确定副本。滚动发布设置 readiness、preStop / 终止窗口和 PDB，先摘流再退出；WebSocket 若依赖本地状态，需要 sticky session 或外部共享状态，并验证断线重连。

#### 反例 / 踩坑

容器内按 CPU 核数 fork 多 worker，同时编排器再扩容，导致连接数爆炸；使用进程内定时任务后每副本重复执行；收到 SIGTERM 立即 `process.exit()`；误以为多副本能修复同步 CPU 阻塞。

#### 资深回答模板

「判断：扩容单位优先与部署平台一致。预算：副本、连接池、消费者和下游容量一起算。停机：先摘流、停止取新、限时排空、关闭资源；用发布演练验证而非只写钩子。」

:::

**追问链：** 每个 Pod 的连接池如何预算？→ WebSocket 如何滚动发布？→ 定时任务为何会重复执行？

### Q16. 如何发现事件循环阻塞，Worker / 进程与 Queue 怎么组合？

**考察点：** Node.js 性能、CPU 隔离、持久化调度

::: details 参考答案

监控 event loop delay / utilization、CPU profile、单次长任务、堆与 GC，并用 trace 找到同步阻塞点。选型要拆成两个正交维度：

- **执行隔离：** Worker Thread、子进程或独立计算服务把 CPU 密集工作移出主事件循环。Worker 有消息序列化 / transferable、调度和内存成本，应复用有界线程池，不能每个请求新建线程；不可信或高故障风险任务可用进程隔离。
- **任务交付：** 持久化 Queue 负责削峰、重试、延迟执行、任务状态和崩溃恢复，但 Queue 消费者仍可能阻塞自己的事件循环；消费者内部可继续使用 Worker 池或独立计算进程。

普通异步 I/O 不因放进 Worker 就必然更快。先优化算法、限制输入和分片，再按「是否需 CPU 隔离」与「是否需持久化调度」分别组合方案。

**追问：**
1. 为什么 Queue 不能自动解决消费者 CPU 阻塞？
2. Worker 池大小和线程通信成本如何评估？
3. 哪类任务需要「Queue + Worker」组合？

:::

## 五、微服务、事件驱动与架构边界

### D13. Nest microservices transport 应如何选择？

::: details 参考答案

#### 基础结论

NestJS 为多种 transporter 提供统一编程抽象，并支持 request-response 与 event-based 消息，但抽象不会抹平协议语义。TCP、Redis、NATS、RabbitMQ、Kafka、gRPC 等应按可靠性、顺序、吞吐、路由、生态和运维能力选择，具体支持项以锁定版本官方文档为准。

#### 原理深挖

`ClientProxy.send()` 表达请求响应并返回 cold Observable：没有订阅就不会发送；`emit()` 表达事件并返回 hot Observable，会立即尝试投递，不依赖显式订阅，但「立即尝试」不等于可靠落库或业务已消费。底层 broker 的确认、重投、消费组、保留和背压行为仍不同。

#### 工程场景

内部强类型低延迟 RPC 可评估 gRPC；需要工作队列、确认和路由可评估 RabbitMQ；高吞吐事件流与回放可评估 Kafka；小系统先用 HTTP + 模块化单体往往成本更低。无论选择哪种 transport，都先定义通用消息 envelope、Schema version、trace 上下文、幂等键和死信策略。Kafka request-response 还需要 request topic 与 reply topic：客户端先 `subscribeToResponseOf()`，异步初始化时必须在 `connect()` 前调用；每个运行中的 Nest 应用至少要有一个 reply topic partition，否则部分实例无法发送请求。

#### 反例 / 踩坑

调用 `send()` 却未订阅，消息根本未发；把 `emit()` 返回 hot Observable 误当可靠交付证明；Kafka reply partition 少于客户端应用实例；消费者异常后无限重试毒消息；RPC 链过深造成级联超时；忽略 transport 特定配置并声称随时可切换。

#### 资深回答模板

「判断：先定交互语义，再选 transport。`send()` 需订阅才发送，`emit()` 立即尝试但不承诺可靠交付；Kafka RPC 还要规划 reply topic、partition 和订阅时机。Nest 统一开发接口，broker 语义仍必须显式设计和压测。」

:::

**追问链：** `send()` 不订阅会怎样？→ Kafka reply partition 如何预算？→ `emit()` 成功返回为何不等于业务已处理？

### Q17. 事件驱动系统如何处理重复、乱序和最终一致性？

**考察点：** at-least-once、幂等、outbox、补偿

::: details 参考答案

工程上通常按 at-least-once 设计：生产者用 transactional outbox 保证业务写入与待发布事件同库提交；发布器可能重复发送，消费者用 eventId / business key 的唯一约束做幂等。需要顺序时按聚合 ID 分区并携带版本号，旧版本事件拒绝、缓冲或重建。

最终一致性必须定义可见延迟、失败状态、重试退避、死信、人工补偿和对账。事件 Schema 采用向后兼容演进，消费者不能依赖生产者数据库。前端对异步流程展示「处理中」，通过轮询、SSE 或 WebSocket 获取终态。

**追问：**
1. outbox 如何避免漏发，为什么仍可能重复？
2. 幂等表自身如何清理？
3. 用户看到处理中超时怎么办？

:::

### D14. CQRS 何时值得使用，何时只是增加样板代码？

::: details 参考答案

#### 基础结论

CQRS 将改变状态的 Command 与读取数据的 Query 分开，适合复杂业务规则、不同读写模型、审计和事件驱动协作。简单 CRUD BFF 通常用清晰的应用服务即可，不必为了使用 `@nestjs/cqrs` 强行拆几十个 Handler。

#### 原理深挖

Command 应表达任务意图，Query 面向读取，Event 通知已发生事实；分离模型不等于必须分库，也不等于自动采用 Event Sourcing。Nest CQRS 提供 CommandBus、QueryBus、EventBus 和 Saga 等机制，但事务边界、事件可靠发布与错误恢复仍由应用设计。

#### 工程场景

退款用 `RequestRefundCommand` 封装资格检查、状态转换与审计，列表 Query 使用适合页面的投影；事务提交后通过 outbox 发布事件。若只有用户增删改查，先保留 `UserService`，当读写复杂度和协作边界出现证据再演进。

#### 反例 / 踩坑

一个字段查询也创建 Command、Event、Saga 全套；在 Event Handler 中静默失败；把 EventBus 当可靠消息 broker；Command Handler 同时返回巨大页面模型；误以为 CQRS 天然解决分布式事务。

#### 资深回答模板

「判断：看读写模型差异、业务规则和审计需求，不看框架是否提供包。渐进：先分应用服务，再引入 Command / Query；跨进程事件用可靠消息机制。没有复杂度收益就不承担 CQRS 成本。」

:::

**追问链：** CQRS 是否必须分库？→ Domain Event 与 integration event 有何区别？→ Saga 失败如何补偿？

### Q18. DDD、模块化单体和微服务如何渐进演进？

**考察点：** 领域边界、部署边界、架构演进

::: details 参考答案

DDD 用于识别业务语言、聚合和 bounded context，不等于目录模板。模块化单体在一个部署单元内保持模块私有数据与单向依赖，事务和调试成本低，适合作为多数团队的起点。只有独立扩缩容、故障隔离、发布节奏或团队自治收益超过分布式成本时，再拆微服务。

Nest Module 是代码组织工具，不自动保证领域隔离；可通过依赖规则、公开 token、契约测试和禁止跨模块直查表来强化边界。拆分前先把模块内聚、接口和数据所有权做好，否则只会得到分布式巨石。

**追问：**
1. 如何证明一个模块具备可拆性？
2. 跨模块查询报表怎么做？
3. 一个数据库是否还能称模块化单体？

:::

### D15. 如何给模块化单体建立可执行的架构约束？

::: details 参考答案

#### 基础结论

每个业务模块拥有自己的应用服务、领域规则和持久化入口；其他模块只能调用公开接口或消费事件，不能注入内部 Repository、跨模块改表。约束必须由 lint、依赖图、测试和代码所有权执行，不能只靠文档。

#### 原理深挖

部署在一起只消除了网络，不代表可以任意耦合。稳定边界需要明确数据所有权、调用方向、同步 / 异步契约和事务规则。模块内可分 domain、application、infrastructure、interface，但层数应与复杂度匹配，避免空壳抽象。

#### 工程场景

订单模块导出 `OrderFacade` 与领域事件；库存模块不读订单表。报表模块通过只读投影或经过授权的查询接口聚合。CI 检查跨目录 import，架构测试禁止 Controller 直接依赖 ORM，并定期查看跨模块变更频率。

#### 反例 / 踩坑

所有模块共享一个 `CommonService` 和全局 PrismaService 后随意查表；事件只在内存发布却当成可靠集成事件；为了「四层架构」每个 CRUD 都建立大量一对一文件；模块名按技术层而不是业务能力。

#### 资深回答模板

「判断：模块边界以数据所有权和业务能力定义。执行：公开门面 / token、依赖规则、架构测试、契约测试。演进：先在单体内证明低耦合，再根据部署收益拆服务。」

:::

**追问链：** 共享 PrismaService 是否必然破坏边界？→ 内存事件何时足够？→ 如何量化模块耦合？

## 六、Vue 联调、排障与 AI 代码审查

### Q19. Vue + NestJS 如何共享类型契约而不形成源码耦合？

**考察点：** OpenAPI、生成客户端、契约演进

::: details 参考答案

优先把 OpenAPI 或独立 Schema 作为跨端契约，通过 CI 生成 Vue 使用的类型和客户端；生成产物版本化，前端不直接 import 后端 Entity、内部 enum 或源码 DTO。契约包含请求、响应、分页、错误码、日期 / 金额格式、nullable 与 optional 语义。

联调流程应自动校验 OpenAPI breaking change，提供稳定 mock，并用消费者契约 / E2E 覆盖关键接口。金额用整数最小单位或明确 decimal string，日期明确 ISO 8601 与时区，64 位 ID 用 string，避免 JavaScript 精度丢失。

**追问：**
1. 为什么共享一个 TypeScript interface 包仍可能失真？
2. `null` 与字段缺失如何约定？
3. OpenAPI 生成代码应否手改？

:::

### D16. Vue 与 NestJS 的鉴权、错误码和联调链路如何设计？

::: details 参考答案

#### 基础结论

服务端错误分类与 envelope 见 Q7，refresh token 的服务端轮换和 CSRF 见 D7。本题只回答 Vue 客户端状态机：请求层统一做错误归一化、single-flight 刷新与一次重试；路由层负责页面准入，组件层根据同一权限 key 控制体验，但后端 Guard 始终最终授权。

#### 原理深挖

前端鉴权应建模为初始化、已认证、刷新中、匿名和失效等状态，避免「是否有 token」一个布尔值。多个请求同时 401 时，共享同一个刷新 Promise；原请求最多重放一次，刷新端点必须排除自身拦截。多标签页可通过 BroadcastChannel 等机制协调结果，但不得广播 token 本体。

#### 工程场景

应用启动先恢复会话，再挂载需要鉴权的动态路由，避免页面闪烁和守卫循环。刷新失败统一清理 Pinia、查询缓存和动态路由，再保留安全的回跳地址。表单消费 Q7 定义的字段错误，其余错误进入全局通知；联调单据记录 release、request ID 和 traceId。

#### 反例 / 踩坑

多个 Axios 实例各自刷新；刷新接口自身 401 进入无限循环；刷新期间直接判匿名导致路由抖动；多标签页广播 token；按钮隐藏就假设已经授权；登出时未清查询缓存和动态路由。

#### 资深回答模板

「边界：Q7 定义错误契约，D7 保证 refresh 服务端安全；Vue 只维护一个鉴权状态机。并发：single-flight 刷新、原请求最多重试一次、多标签页只同步状态。退出：清身份、查询缓存和动态路由，再安全回跳。」

:::

**追问链：** 多标签页如何协调刷新？→ 401 与业务登录失效码如何配合？→ 如何把前端错误关联到后端 trace？

### Q20. 如何审查 AI 生成的 NestJS 代码？

**考察点：** AI 辅助开发、事实核查、生产风险

::: details 参考答案

按风险而不是代码外观审查：

1. **版本与 API：** 包名、Decorator、适配器用法是否存在于锁定版本，不能相信 AI 编造的方法。
2. **模块与 DI：** token、imports / exports、scope、动态模块和循环依赖是否正确。
3. **请求语义：** Guard、Pipe、Interceptor、Filter 的职责和异常传播是否被破坏。
4. **安全：** DTO 白名单、授权、SQL 参数化、文件校验、CORS / Cookie、日志脱敏和密钥处理。
5. **数据：** 事务上下文、N+1、分页稳定性、连接泄漏、幂等与并发竞态。
6. **运维：** 超时、重试上限、trace、health、关闭钩子和失败降级。
7. **验证：** 类型检查、单元 / 集成 / E2E、依赖审计、压测与故障注入。

AI 适合生成样板和测试草稿，架构边界、授权和数据一致性必须由人负责并用官方文档与运行证据核查。

**追问：**
1. 怎样发现一个不存在的 NestJS API？
2. AI 最容易漏掉哪些并发问题？
3. 代码能编译为什么仍不能合并？

**踩坑：** 只让另一个模型「看起来是否正确」，没有锁定版本、最小复现、自动化测试和真实依赖验证。

:::
