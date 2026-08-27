# 全栈数据与 Nest / Prisma

> **真源：** [13 NestJS](/interview/questions/13-nestjs)（主）；数据访问与 MySQL 见 [15 数据库 / Prisma](/interview/questions/15-database-prisma)；岗位 C 契约与联调见 [07 Java 全栈偏前](/interview/questions/07-java-fullstack)。版本口径不得与题库冲突。
>
> **目标时长：** 15～25 分钟可讲完主线。证据坑位填你自己的项目指标。

## 战场是什么 / 面试官想听什么

战场不是背注解清单或 ORM 语法，而是证明你能把一次「前端动作 → 接口契约 → 鉴权与校验 → 用例事务 → 持久化与约束 → 可观测与回滚」讲成闭环：

**协议入站 → Guard / Pipe → 应用服务短事务 → Prisma / SQL → 错误码出站 → 前端按码决策。**

面试官想听四类能力：

1. **边界感：** 数据库管约束与并发，Prisma 管类型化访问与迁移工具，应用层管用例、授权与幂等——三者不能互相冒充。
2. **链路感：** Nest 请求生命周期顺序；JWT / RBAC 与前端菜单按钮如何对齐；事务里不夹外部 HTTP。
3. **数据感：** 索引与分页来自查询模式；N+1 用 Trace 证明；迁移走 expand-and-contract。
4. **岗位口径：** 你是资深前端 / 全栈偏前，能独立扛简单后端与联调排障，不伪装专职 DBA 或分布式专家。

口述红线（与题库冲突即扣分）：

- 把 Schema 里有 Relation 说成库里一定有外键；把 `include` 说成一定单条 JOIN；
- 生产靠 auto sync / 临时根据 Schema 生成迁移；
- 事务 callback 里调支付或回退到全局 Prisma Client；
- 前端 disable / 防抖当成幂等唯一手段；把 `localStorage` 长期 Token 当默认最佳实践；
- NestJS / Prisma 版本口径与题库打架（见下）。

版本基线（题库）：**NestJS 11.x**（Node.js 20+；默认 Express 5；`@nestjs/platform-fastify` v11 对齐 Fastify 5）；**Prisma 7** 的客户端生成、驱动适配器与事务能力以项目锁定版本文档与实测为准；MySQL 以 InnoDB / MySQL 8.0 常见能力为语境。独立包（CQRS、Throttler、BullMQ 等）各自节奏，不混读。

十年经验口径下，面试官还在听你能不能用「约束 → 方案 → 取舍 → 验证 → 防护」讲一次慢查询、一次幂等事故或一次迁移演练，而不是只复述装饰器与 Client API。数字必须来自你的 Trace、慢日志与发布记录；题库里的示例阈值不能冒充业绩。

## 知识地图

```text
契约 / 鉴权              Nest 请求链                 数据访问                    发布 / 运维
统一响应 + 错误码   →   Middleware→Guard→…    →   Schema / Client / SQL   →  migrate deploy
JWT + 权限码对齐         Pipe / DTO / Filter        索引 · 事务 · 连接池        expand-and-contract
幂等键 / 限流            Module 可见性 / token      N+1 · 分页 · 多租户 where   健康检查 / 优雅停机
Vue 联调排障             request scope 慎用         条件更新 / 死锁重试         Trace + 池指标
```

主线口诀：

1. **先定契约与错误码，再写实现**
2. **Controller 薄、用例短、事务不含外呼**
3. **约束在库里，授权在应用，类型在 Prisma**
4. **看查询模式建索引，看 Trace 治 N+1**
5. **生产只 deploy 已评审 migration**
6. **结果未知写操作用幂等键对账，不盲目重发**

## 完整讲解

### 1. 分层与契约：Nest / Spring 同一套「前端可感知」边界

无论 Nest 还是 Spring Boot 叙事，分层心智一致：Controller / 协议层接参与映射；Service / 应用层编排事务与规则；Repository / Mapper / Prisma 仓储只谈持久化。对象别混：Entity 贴表；入参 DTO；出参明确模型——别把表实体直接甩前端。AI 生成代码常见病是业务写进 Controller、Service 循环依赖——Review 时先砍分层越界。

统一响应与错误码是契约核心：成功形状固定；可预期业务错误用稳定业务码；系统故障另码。前端拦截器按码决定 toast、跳登录、是否重试——**禁止**有的接口扔字符串、有的扔 HTML。列表空与「资源不存在」要产品化区分。RESTful 服务资源；复杂筛选可演进参数或 RPC 风格，但要版本与文档。分页、排序、筛选上限写进契约，防止深分页与任意字段注入。错误码是产品契约，不是后端私有实现细节。

**机制：** 入站先定「成功形状 + 业务码 + 系统码」；Controller 只做协议映射，用例编排放应用服务；仓储不拼业务文案。前端拦截器按码分流 toast / 登录 / 重试，避免同一失败有时字符串、有时 HTML。

**失败形态：** Entity 直接当响应；列表空与 404 混用；分页无上限被扫表；AI 生成把校验塞进 Controller 导致 Filter 形状漂移。

**验收：** OpenAPI / 错误码表可生成前端类型；契约测试覆盖正例与业务拒识；深分页有最大页或改游标。证据坑位：〔填〕错误码表版本与一次「码变了前端乱跳」事故。

### 2. Nest 模块、DI 与请求生命周期

Module 是能力边界：`imports` / `controllers` / `providers` / `exports`。按业务能力拆（如 `OrderModule`），跨模块只导出稳定门面或 token，不导出 Prisma Client。token 可以是类 / 字符串 / `Symbol`；接口编译后消失，不能直接注入。`useClass` / `useValue` / `useFactory` / `useExisting` 各有场景；「Nest can't resolve dependencies」按 token、注册、导出、导入、scope 逐层查。字符串 token 手写易拼错；为省 `imports` 乱开 `@Global()` 会隐藏依赖。

默认 singleton。request scope 会沿依赖图扩散，拖垮性能与测试装配——请求信息显式传参通常更稳。动态模块与异步配置解决多环境装配，但工厂连外部服务要有超时与关闭钩子。

生命周期（题库口径）：**Middleware → Guard → Interceptor 入站 → Pipe → Handler → Interceptor 出站**；未捕获异常进 Exception Filter。Guard 做鉴权决策，Pipe 做校验转换，Interceptor 做横切（日志、超时、映射），Filter 统一错误形状——别把五类组件职责揉成一团。Interceptor 基于 RxJS 流时，超时与异常映射要避免吞掉业务错误码。

**机制：** Module 按业务能力封边界；跨模块只导出门面 token；默认 singleton，请求上下文显式传参。生命周期顺序固定，职责不揉：Guard 决策、Pipe 校验、Interceptor 横切、Filter 统一错误。

**失败形态：** 字符串 token 拼错导致 can't resolve；乱开 `@Global()` 隐藏依赖；request scope 扩散拖垮测试；Interceptor 把业务码吞成 500。

**验收：** 依赖图可画；单测能替换仓储 token；超时用例仍保留业务码。NestJS **11.x** 默认 Express 5，Fastify 路径对齐 v11——口述版本要与题库一致。

### 3. 鉴权、权限与 Vue 联调

JWT：短 access + 可轮换 refresh；前端优先同域 BFF + HttpOnly Cookie，少把长期 Token 塞 `localStorage`。refresh rotation 要防重放与并发 single-flight；登出撤销会话族。RBAC 权限码与菜单 / 按钮 / 接口对齐；前端隐藏不是安全边界，服务端仍校验。权限服务短暂不可用时：高风险操作默认拒绝；只读可有签名短 TTL 快照并明示降级，绝不能前端超时就全量放行。

Vue 与 Nest 共享类型：OpenAPI / 共享契约包 / 生成客户端均可，但避免业务仓直接 import 服务端源码造成耦合。联调排障固定顺序：请求是否出、鉴权是否过、DTO 是否拒、业务码含义、服务端 Trace / SQL——与 Java 全栈题库的「联调方法论」同一套肌肉记忆。接口版本与兼容窗口要提前约定：字段只增不改语义，弃用给观察期；前端发版滞后时靠双版本，而不是临时 if 特殊账号。

**机制：** 短 access + 可轮换 refresh；同域 BFF + HttpOnly Cookie 缩小 XSS 凭证面；RBAC 码与菜单/按钮/接口同一真源。权限服务短暂不可用：高风险拒绝，只读可有签名短 TTL 快照并明示降级。

**失败形态：** 前端 disable 当安全；`localStorage` 长期 Token；refresh 并发无 single-flight；权限超时全量放行。

**验收：** 直打 API 未授权必拒；联调顺序固定（出网→鉴权→DTO→业务码→Trace/SQL）；refresh 重放与登出撤销有集成测。证据坑位：〔填〕会话轮换与一次重放拦截。

### 4. Prisma 与数据库：谁负责什么

Prisma Schema / Model / Relation / Client：声明与生成类型化 API；Relation 在模型侧表达关系，**不等于**库里一定有外键（取决于 relation mode 与配置）。Client 不是领域模型、不是授权层、不是优化器。`@unique` 写在 Schema 不等于生产库已有约束——要看 migration SQL 是否落地。生成器名称、输出路径、驱动适配器初始化方式随 Prisma 7 等锁定版本变化，面试只承诺稳定概念，具体 API 以文档与类型声明为准。

`select` 收窄字段；`include` 表达关系加载，底层可能是多查询、批处理或 JOIN，**以查询日志与 Trace 为准**。分页：`skip`/`take` 简单但深页贵；游标要稳定唯一排序键。金额用整数最小单位或 `DECIMAL`，禁止 JS `Number` 做最终财务计算；时间语义先定 UTC 瞬间 vs 本地营业日。JSON 适合弹性附属属性，高频筛选字段应提升为普通列。

TypeORM vs Prisma：看团队经验、迁移与 SQL 可观测性，不比语法短。Entity / Model 不要同时当输入 DTO、输出 VO 和领域对象。自动同步 Schema 直接用于生产、每请求新建 Client，都是题库点名的反例。

**机制：** Prisma 管类型化访问与迁移工具；库管约束与并发；应用管授权与幂等。Relation ≠ 外键必然存在；`include` 底层形态以 Trace 为准。金额用整数最小单位或 `DECIMAL`；时间先定 UTC 瞬间 vs 本地营业日。

**失败形态：** Schema 有 `@unique` 但 migration 未落地仍插重；生产 auto sync；把 Client 当领域模型与授权层。

**验收：** 影子库跑 migration SQL；并发冲突映射稳定业务码；Client 单进程复用。Prisma **7** 生成器/适配器以锁定文档为准，面试只承诺稳定概念。

### 5. 索引、EXPLAIN、事务与连接池

索引来自高频查询的过滤 / 排序 / 返回列，不是字段清单猜索引。联合索引守最左匹配；覆盖索引减少回表，但宽索引放大写成本。`EXPLAIN` / `EXPLAIN ANALYZE` 看访问类型、`key`、`rows`、真实工作量；Prisma `select` 不自动创建索引。深分页的 Offset 成本要正视：管理端可接受有限深页时仍应限制最大页；导出与无限滚动优先游标或键集分页，排序带唯一决胜列，防止同秒插入导致页漂移。

事务：ACID 口述清楚；InnoDB 常见 `REPEATABLE READ` 语境下区分快照读与当前读（`FOR UPDATE`）。短事务、统一锁顺序、条件更新 / CAS 做库存类不变量；死锁有限重试且幂等。**交互式事务每次 `await` 都在拉长持锁**——外部 HTTP、MQ、用户等待必须移出。批量事务适合参数已齐的一组写；需要中间结果分支才用交互式，并只用传入的 `tx`，禁止回退全局 Client。`Promise.all` 不会让同一交互式事务连接真正并行写，误用只会制造竞态错觉。

连接池：分层超时（取连 / 语句 / 请求 Deadline）；单进程复用 Client；HTTP 超时≠查询已取消。Serverless 要连接预算与代理方案；PgBouncer 是 PostgreSQL 语境，不能当 MySQL 代理口头替换。热重载重复创建 Client、事务中等外部 API、把池盲目翻倍，都是耗尽经典路径。

### 6. N+1、多租户、迁移与 Java 侧对照

N+1：Trace 看 SQL 数是否随父项线性增长；可选嵌套加载、批量 `IN` 组装、`_count`、读模型。多一对多同时 JOIN 可能笛卡尔膨胀——有时多条批量查询更稳。验收同时看查询数、扫描行、结果体与池等待，不能只数 SQL 条数。

多租户：`where` 显式 `tenantId`；Client Extension 可作防御纵深，**不能替代**资源动作授权与原生 SQL 审查。动态排序映固定枚举；参数化查询防注入。原生 SQL 仍要字段白名单与最小权限账号。

迁移：开发可生成并评审 SQL；生产 **`migrate deploy`** 已提交版本，最小权限账号。破坏性变更 expand → 双写 / 回填 → switch → contract；大表索引按在线 DDL 能力安排。失败向前修，不改已执行历史文件蒙混。字段改名先加新列、双写、回填校验、切读、再删旧列，每步都兼容前后两个应用版本。

Java 全栈同题：幂等键防重复提交；缓存穿透 / 击穿口语分场景；上传导出设上限与异步；Validation 与前端表单分工；慢 SQL 前后端协作看执行计划与调用扇出。微服务点到为止——讲清网关对前端的聚合、错误码与版本影响即可。一周内最小可用后台：统一响应、登录权限、一两个核心列表与写接口、可观测与回滚，比堆微服务名词更能证明闭环能力。

### 7. 生产基线与 AI 代码审查

配置、结构化日志、traceId、健康检查（Terminus 等按锁定版本）形成可观测基线。限流 + 幂等 + 基础安全组合。容器化要优雅停机：停流量 → 排空 → 关连接。事件循环阻塞时把 CPU 重活外移 Worker / 队列，别在请求路径里同步算爆。

审查 AI 生成 Nest / Java：分层是否越界、DTO 是否缺校验、事务是否夹外呼、权限是否漏 `tenantId`、错误是否统一、测试是否可替换仓储——清单化比「看起来能跑」更重要。

**机制：** 配置/结构化日志/traceId/健康检查/优雅停机形成基线；限流与幂等盖写路径；CPU 重活外移 Worker/队列。AI 补丁先过「分层·校验·事务·租户·错误·可测」六问。

**失败形态：** 热重载重复创建 Client 耗尽池；健康检查只 ping 不查依赖；AI 代码「能跑」却漏 `tenantId` where。

**验收：** 停机排空可观测；AI PR 模板强制六问；池等待与事件循环阻塞有告警。证据坑位：〔填〕一次 AI 补丁越界被拦的 CR。

### 8. 缓存、队列与文件：全栈偏前必须能联调的三块

Redis 口语场景：会话或权限快照、热点只读、限流计数、短时锁与验证码。讲清楚「缓存不是第二数据库」：穿透用空值短 TTL 或布隆（视规模），击穿用互斥或逻辑过期，雪崩错峰 TTL。与数据库一致性不要装永远强一致——先定可接受脏读窗口，再选删除 / 更新缓存策略，并用监控证明。

队列与定时任务：Nest 可接 BullMQ 等，但版本独立；要点是幂等消费、失败重试上限、死信与可观测，而不是背装饰器名。文件上传：前端直传对象存储或经网关，校验类型大小与病毒扫描策略按组织要求；导出大 Excel 走异步任务 + 进度查询，避免在 HTTP 请求里同步生成撑爆内存。这些与 Java 全栈题库同一套联调肌肉：超时、进度、失败可恢复。

**机制：** 缓存定脏读窗口再选删/更策略；队列消费幂等+死信；上传校验类型大小，导出走异步任务。一致性不装永远强一致，用监控证明窗口可接受。

**失败形态：** Redis 当第二数据库；创建类接口全局自动重试；HTTP 里同步生成大 Excel。

**验收：** 穿透/击穿演练；死信可查；导出进度可查询且可取消。证据坑位：〔填〕一次缓存击穿止损与回源 QPS。

### 9. 隔离级别、死锁与库存口述（面试加压题）

脏读 / 不可重复读 / 幻读用来对话隔离级别，但 InnoDB 实现细节以版本为准。`REPEATABLE READ` 下普通一致性读复用快照，当前读会加锁并看到可操作版本。长事务拖住旧版本清理，连接与 Undo 压力上升——所以「只读也要短」。死锁诊断：统一锁顺序、缩小锁范围、条件更新减少持锁时间；重试必须幂等且有上限。库存：优先 `UPDATE ... WHERE available >= ?` 看影响行数；多 SKU 固定加锁顺序；秒杀还要入口限流与分段库存，但最终仍靠库约束与对账。

**机制：** 短事务、统一锁顺序、条件更新；交互式事务每次 `await` 都在拉长持锁，外呼必须移出。死锁有限重试且幂等。

**失败形态：** 事务里调支付；`Promise.all` 误当同一连接并行写；长只读事务拖住 Undo。

**验收：** 死锁重试上限与幂等键集成测；库存并发压测影响行数正确；Trace 无「事务内 HTTP」。

### 10. 模块化单体、测试隔离与 Vue 契约演进

共享 PrismaService 只做连接生命周期可以，破坏边界的是任意模块借它查遍所有表。跨模块约束走公开门面与集成测试；内存事件不等于可靠集成事件。CQRS 只在读写模型与团队成本对得上时引入，否则样板代码税高于收益。

测试：单元替身替换仓储 token；集成测真实事务回滚；E2E 独立租户数据。Guard / Interceptor / Filter 要能单独测决策与映射。API versioning（URI / Header 等）与弃用周期写进契约，前端发版不同步时靠双版本兼容窗口，而不是口头「你们先改」。

**机制：** 共享 PrismaService 只管连接生命周期；跨模块走公开门面；单元替身替换仓储，集成测真实事务回滚，E2E 独立租户。

**失败形态：** 任意模块借 Prisma 查遍所有表；内存事件冒充可靠集成；无弃用窗口强切字段。

**验收：** 架构测试限制跨模块查表；契约双版本窗口有观察期；Guard/Filter 可单独测。证据坑位：〔填〕一次 expand-and-contract 迁移日历。

## 工程取舍与故障案例模板

| 步骤 | 你要说清的内容 |
| --- | --- |
| **约束** | QPS、一致性、租户隔离、发布窗口、团队后端深度 |
| **方案** | 契约形状、鉴权存放、ORM 选型、事务切分、迁移步骤 |
| **取舍** | 类型体验 vs SQL 可控；短事务 vs 跨服务最终一致 |
| **验证** | Trace SQL 数、EXPLAIN、幂等重放、双版本兼容、池等待 |
| **复发防护** | 契约测试、迁移评审、架构测试限制跨模块查表、错误码表 |

**案例 A — 「列表越来越慢，以为是 Node」**

- 约束：管理端订单列表带商品数。
- 方案：先 Trace；发现循环 `include` / 深 `skip`；改游标或先定订单 ID 再聚合；补联合索引。
- 取舍：接口形状微调 vs 一次巨大 JOIN。
- 验证：SQL 数、扫描行、p95、池等待。
- 防护：列表查询预算与慢查询门禁。

**案例 B — 「支付回调与下单事务缠在一起」**

- 约束：下单扣库存且调支付。
- 方案：库内短事务只做预占；支付在外；回调幂等确认；未知结果只查单。
- 取舍：最终一致复杂度 vs 长事务拖垮池。
- 验证：重复回调、超时、死锁重试。
- 防护：状态机 + 幂等键集成测试。

**案例 C — 「Schema 有 unique，线上仍插入重复」**

- 约束：软删后允许重新注册。
- 方案：生成列 / 唯一策略按 MySQL 能力设计；migration SQL 人工确认；应用冲突映射业务码。
- 取舍：建模复杂度 vs 并发正确。
- 验证：并发注册压测；迁移在影子库演练。
- 防护：禁止「只改 Schema 不审 SQL」发生产。

**案例 D — 「前端连点创建两条订单」**

- 约束：弱网 + 按钮防抖被绕过。
- 方案：前端防抖是体验；服务端幂等键 + 唯一约束兜底。
- 取舍：多一次键设计 vs 资损。
- 验证：重放与并发创建。
- 防护：创建类接口幂等检查列入 CR。

**案例 E — 「连接池被打满，误以为要加机器」**

- 约束：活动高峰，接口超时增多。
- 方案：关联池等待、活跃连接、长事务与慢 SQL；砍事务外呼；限制并发；必要时才扩容。
- 取舍：限流降级 vs 盲目扩容成本。
- 验证：池指标与 SQL p95 同窗口对照。
- 防护：连接预算写入容量评审。

证据坑位（填你的数）：

- 核心列表 SQL 数 / p95〔填〕；池等待占比〔填〕。
- 幂等冲突拦截次数〔填〕；迁移回滚演练耗时〔填〕。
- 错误码联调扯皮关闭周期〔填〕；N+1 治理前后对照〔填〕。

全栈合题的终局不是证明你会写 Controller，而是证明你能把契约、鉴权、短事务、约束与观测收成一条可值班链路。先讲清谁拥有不变量（库）、谁拥有授权（应用）、谁拥有类型与迁移工具（Prisma），再讲一次自己的故障故事。把 SQL 数、池等待与幂等拦截次数带进答辩，比背注解名称更像负责人。

## 追问树

**主问：一次下单请求在 Nest 里怎么走？**

- L1：生命周期五段 + Filter。  
  - L2：Guard 与 Pipe 边界？request scope 为何慎用？  
    - L3：事务里能否调支付？收口：短事务 + 幂等对账。

**主问：Prisma `include` 是不是一定 JOIN？**

- L1：否；看连接器与加载策略。  
  - L2：如何证明 N+1？多一对多膨胀？  
    - L3：何时原生 SQL / 读模型？收口：Trace + EXPLAIN。

**主问：生产迁移怎么做才不炸？**

- L1：`migrate deploy` vs 开发生成。  
  - L2：expand-and-contract 步骤。  
  - L3：失败能否改历史文件？收口：向前修 + 权限最小化。

**主问：JWT 放哪？如何与权限码对齐？**

- L1：短 access + refresh 策略；Cookie / BFF 优先。  
  - L2：rotation 与并发刷新。  
    - L3：菜单隐藏是否安全？收口：服务端鉴权为准。

**主问：你和专职后端的分工叙事？**

- L1：契约、联调、简单域闭环。  
  - L2：何时推 BFF / 服务端聚合？  
    - L3：AI 生成代码审查清单。收口：可交付质量而非注解数量。

## 题库深挖入口

| 主题 | 入口 |
| --- | --- |
| Module / DI / scope | [13-nestjs Q1](/interview/questions/13-nestjs)、[D1](/interview/questions/13-nestjs)、[D2](/interview/questions/13-nestjs) |
| 请求链 / DTO / 错误码 | [13-nestjs D4](/interview/questions/13-nestjs)、[Q5](/interview/questions/13-nestjs)–[Q7](/interview/questions/13-nestjs)、[D6](/interview/questions/13-nestjs) |
| JWT / RBAC | [13-nestjs Q8](/interview/questions/13-nestjs)、[D7](/interview/questions/13-nestjs)、[Q9](/interview/questions/13-nestjs) |
| Prisma / 事务 / 池 | [13-nestjs D8](/interview/questions/13-nestjs)、[D9](/interview/questions/13-nestjs)；[15-database-prisma Q15](/interview/questions/15-database-prisma)–[Q17](/interview/questions/15-database-prisma)、[D6](/interview/questions/15-database-prisma)–[D9](/interview/questions/15-database-prisma) |
| 索引 / EXPLAIN / 分页 | [15-database-prisma Q5](/interview/questions/15-database-prisma)–[Q9](/interview/questions/15-database-prisma)、[D1](/interview/questions/15-database-prisma)、[D2](/interview/questions/15-database-prisma) |
| 库存 / 死锁 / 多租户 | [15-database-prisma D3](/interview/questions/15-database-prisma)、[D4](/interview/questions/15-database-prisma)、[D10](/interview/questions/15-database-prisma) |
| 迁移兼容 | [15-database-prisma D8](/interview/questions/15-database-prisma) |
| Java 契约 / 幂等 / 联调 | [07-java-fullstack Q2](/interview/questions/07-java-fullstack)、[Q10](/interview/questions/07-java-fullstack)、[Q11](/interview/questions/07-java-fullstack)、[D4](/interview/questions/07-java-fullstack) |
| Vue 联调 / AI 审查 | [13-nestjs Q19](/interview/questions/13-nestjs)、[D16](/interview/questions/13-nestjs)、[Q20](/interview/questions/13-nestjs)；[07-java-fullstack D2](/interview/questions/07-java-fullstack) |

相关复习页：[全栈数据速记](/interview/review/sheets/08-fullstack-ai)、[NestJS + Prisma 指南](/interview/guides/backend/nestjs-prisma)。

## 15 分钟口述验收清单

1. **（1 分钟）战场句：** 契约 → 鉴权校验 → 短事务 → 约束与观测；声明 NestJS 11 / Prisma 锁定版本口径。
2. **（2 分钟）分层与错误码：** Controller 薄；统一响应；前端按码决策。
3. **（2 分钟）Nest 链路：** 生命周期顺序；Module 可见性；Guard vs Pipe。
4. **（2 分钟）鉴权：** access/refresh；权限码对齐；前端隐藏非安全。
5. **（2 分钟）Prisma 边界：** Client ≠ 授权；`include` 看日志；事务不用全局 Client。
6. **（2 分钟）SQL 性能：** 查询模式建索引；深分页；N+1 Trace。
7. **（2 分钟）迁移与池：** deploy；expand-and-contract；连接预算。
8. **（2 分钟）工程收口：** 用「约束→方案→取舍→验证→防护」讲幂等或慢查询案例（数字〔填〕）。

自检口令：

- 「NestJS 11 默认底层？」→ **基线文档指向 Express 5；Fastify 走 platform-fastify v11 / Fastify 5。**
- 「Prisma Relation = 数据库外键？」→ **否；看 relation mode 与 migration SQL。**
- 「生产能不能 prisma db push 顶替迁移？」→ **题库要求生产 deploy 已评审 migration，不临时生成。**
- 「前端防抖等于幂等？」→ **否；服务端幂等键 + 唯一约束兜底。**

若时间只够一分钟收口：报 NestJS 11 / Prisma 锁定版本、强调三层职责与错误码契约、点出短事务不含外呼、甩一个带 SQL 数或幂等拦截的故事。够用了。再被问中间件细节，就回到题库深挖入口，不现场编配置名。
