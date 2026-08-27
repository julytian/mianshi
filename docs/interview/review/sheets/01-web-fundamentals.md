# Web 与计算机基础速记

> **真源：** [01 JS/TS](/interview/questions/01-js-ts)、[16 HTML/CSS/a11y](/interview/questions/16-html-css-a11y)、[17 Browser/Web API](/interview/questions/17-browser-web-api)、[18 网络与安全](/interview/questions/18-network-security)、[10 手写](/interview/questions/10-handwriting) 为唯一真源；冲突时以题库为准。
>
> **用法：** 面试前遮住口述稿先自讲，再对结论卡与追问速答。证据坑位请填入你自己的项目指标，勿背他人数字。

## 一句话定位

本域讲清「JS/TS 运行时与类型边界 + 浏览器渲染与 Web API + 网络缓存与安全纵深 + 手写题背后的工程不变量」。资深面试要的是**调度模型、失败模式与验收方式**，不是 API 清单。你应能在五分钟内把事件循环、类型收窄、缓存键、XSS/CSRF 与并发取消串成一条交付故事。

## 核心结论卡

1. **结论：** 外部输入先标 `unknown`，在边界收窄成业务类型；`any` 是可控逃逸，不是默认类型。  
   **边界：** `as unknown as T` 等于手动 `any`；满屏 `any` 要按风险渐进治理，不是一次清零。  
   **证据坑位：** 〔填〕API / `JSON.parse` 边界校验模块与一次 `any` 传染事故。

2. **结论：** 事件循环口诀是同步 → 清空微任务 →（可能）渲染 → 取宏任务；`async/await` 续体多是微任务。  
   **边界：** 微任务递归可饿死渲染；`nextTick` 等的是框架更新，不是「下一帧画完」。  
   **证据坑位：** 〔填〕一次主线程卡顿的 Performance 时间线截图与切片改造。

3. **结论：** 防抖盯「最终一次」、节流盯「周期内至多一次」；实现要管 leading / trailing、`this`、取消与卸载清理。  
   **边界：** 搜索框与 resize 场景不同；手写题要说明为何不拿 lodash 当唯一答案。  
   **证据坑位：** 〔填〕搜索防抖与滚动节流的延迟参数与取消策略。

4. **结论：** 并发池限制同时进行的 Promise 数；实战要叠 `AbortController`、重试退避与结果保序。  
   **边界：** 取消后旧结果不得写回；`Promise.all` 一拒全拒，不等价于有限并发。  
   **证据坑位：** 〔填〕批量上传 / 批量接口的并发上限与取消验收。

5. **结论：** 语义化 HTML + 正确标题层级是可访问性底座；ARIA 是增强，不是用 `div`+`role` 重造原生控件。  
   **边界：** Modal / Menu / Combobox 交互模型不同，不能共用一个「弹层+ARIA」。  
   **证据坑位：** 〔填〕键盘走通的关键表单 / 对话框审计记录。

6. **结论：** Flex 管一维排列，Grid 管二维区域；层叠用 cascade layers / 作用域，值用 Design Token。  
   **边界：** `z-index` 只在同一 stacking context 内可比；`contain` / `content-visibility` 是正确性承诺，不是万能加速。  
   **证据坑位：** 〔填〕后台布局断点表与一次层叠冲突复盘。

7. **结论：** 从导航到可交互要分段：DNS / 建连 / 解析 / 脚本 / 样式布局绘制；BFCache、SW、预加载会让路径分叉。  
   **边界：** `unload` 破坏 BFCache；恢复看 `pageshow.persisted`，隐藏时用 `pagehide` 停非必要工作。  
   **证据坑位：** 〔填〕一次后退命中 / 未命中 BFCache 的对比与修复。

8. **结论：** Cookie 跟域与凭证模型；`localStorage` 同步且明文；IndexedDB 适合结构化离线数据。  
   **边界：** 多标签同步以服务端或事务库为真相，BroadcastChannel 只通知「发生了什么」。  
   **证据坑位：** 〔填〕登录态存储选型与多标签登出同步方案。

9. **结论：** Service Worker 按资源选策略：哈希静态可 cache-first，导航常 network-first；更新要安装 → 等待 → 确认 → 激活。  
   **边界：** 新旧页面与新 worker 短期要兼容；不要把易变 API 无脑进 SW 缓存。  
   **证据坑位：** 〔填〕离线壳与一次「用户看不到新版本」的修复窗口。

10. **结论：** HTTP 缓存先算新鲜度，过期再带验证器；`no-cache`≠不存，`no-store` 才要求不存。  
    **边界：** 哈希资源可长缓存 + `immutable`；HTML / manifest 短缓存；`Vary` 漏了会串表示。  
    **证据坑位：** 〔填〕HTML 与带 hash 静态资源的 Cache-Control 对照表。

11. **结论：** HTTP/2 多路复用仍可能被 TCP 丢包拖住；HTTP/3 / QUIC 消的是跨流传输层阻塞，不是应用层一切阻塞。  
    **边界：** 受阻应回退；0-RTT 只用于可重放安全的请求。  
    **证据坑位：** 〔填〕协商协议占比与一次回退观察。

12. **结论：** XSS 先堵注入源与危险 sink，再叠 sanitizer / CSP / Trusted Types；CSRF 针对「浏览器自动带凭证」。  
    **边界：** CORS 不是 CSRF 防护；HttpOnly 防的是脚本读 Cookie，不防跨站提交。  
    **证据坑位：** 〔填〕CSP 报告收敛与一次 CSRF Token / SameSite 组合验收。

13. **结论：** 浏览器登录优先同源 BFF + Secure / HttpOnly Cookie；纯 SPA 走 Authorization Code + PKCE，不放 client secret。  
    **边界：** Token 勿进 `localStorage` 当默认方案；刷新要防重放与并发刷新。  
    **证据坑位：** 〔填〕会话 Cookie 属性清单与刷新失败态处理。

14. **结论：** 手写深拷贝要先声明边界：循环引用、函数、DOM、`Map`/`Set`、不可克隆对象；能用 `structuredClone` 就别装全能。  
    **边界：** 业务常只需「可序列化子集」；虚拟列表核心是窗口计算，不是「把所有行挂 DOM」。  
    **证据坑位：** 〔填〕一次深拷贝踩坑或虚拟列表窗口验收用例。

15. **结论：** Tree-shaking 依赖 ESM 静态结构与副作用信息可信；副作用、动态导入字符串、CJS 互操作都会「摇不掉」。  
    **边界：** `sideEffects: false` 一刀切可能丢样式；包入口条件导出要对照 dev / prod。  
    **证据坑位：** 〔填〕一次体积归因：哪条依赖因副作用留下。

16. **结论：** `AbortController` 是请求与并发任务的取消信号；owner 要在卸载、路由切换、新请求发起时 abort。  
    **边界：** 取消后仍可能收到网络层尾包，必须丢弃写回；重试要换新 signal 或明确策略。  
    **证据坑位：** 〔填〕列表快翻页竞态：旧响应不得覆盖新页。

## 高频追问速答

1. **`unknown` 为什么比 `any` 更安全？**  
   `unknown` 除赋给自身或 `any` 外，未收窄前不能当具体类型用，迫使你在边界做类型守卫或 Schema 校验。`any` 则跳过读、写与调用检查，错误会传染到下游。工程上应在 I/O 边界完成校验与收窄，再向内层暴露稳定业务类型；局部逃逸要注明原因，避免双断言自我安慰。

2. **微任务会不会饿死渲染？**  
   微任务检查点通常会执行到队列清空，因此在微任务里递归追加微任务可以长期占住主线程，让渲染和后续宏任务得不到机会。大计算应切片、让出或迁到 Worker，不能只改成一串 `await`。需要读更新后的 DOM 可用框架的 `nextTick`；要确认视觉帧再结合 `requestAnimationFrame`。

3. **防抖和节流怎么向业务解释选型？**  
   防抖适合「停下来再算」：搜索建议、窗口拖拽结束校验；节流适合「过程中持续有反馈」：滚动位置上报、拖拽预览。实现要约定 leading / trailing、最大等待、以及组件卸载时取消定时器。别把 lodash 默认参数当万能，也别在输入法组字阶段误触发提交。

4. **为什么说 CORS 防不了 CSRF？**  
   CSRF 利用的是浏览器对目标站自动携带 Cookie 等凭证，攻击页面诱使浏览器发「看起来已登录」的请求。CORS 约束的是跨源读响应与部分预检，并不阻止简单跨站表单式请求到达服务端。防护应组合 SameSite、CSRF Token、Origin 校验与正确方法语义，并在服务端做授权前置。

5. **`no-cache` 和 `no-store` 差在哪？**  
   `no-cache` 表示缓存前必须再验证，响应仍可能被存储；`no-store` 才要求不存储。带内容哈希的静态资源适合很长 `max-age` 加 `immutable`，因为 URL 变了就等于新资源。HTML 或清单应短缓存或可再验证，用来指向新哈希；同一 URL 覆盖内容却长缓存，会造成版本漂移。

6. **BFCache 恢复时要做什么？**  
   不要依赖 `unload`。在 `pagehide` 或隐藏时暂停轮询、锁与非必要连接；当 `pageshow` 且 `persisted` 为真时，恢复监听、校验登录与数据时效，再决定是否静默刷新。命中 BFCache 只是性能优化，不能改变业务正确性；调试要用往返导航复现，而不是只看首次加载。

7. **手写并发池还要讲哪些边界？**  
   除了「最多 N 个飞行中任务」，还要说明：新任务如何入队、失败是否占并发名额、如何保序或按完成顺序回调、如何与 `AbortController` 联动、取消后旧结果为何不得写 UI。面试官常追问重试退避与超时；你要区分传输失败可重试与业务 4xx 不可盲重试，并给出卸载清理点。

8. **ARIA 什么时候不该上？**  
   能用原生 `button`、`a`、`input`、`dialog` 完成的交互，优先原生语义与键盘行为，而不是 `div` 加 `role`。ARIA 名要与可见标签一致；隐藏装饰用对方式，避免可读名称丢失。Modal 要焦点陷阱与背景 inert，Menu 与 Combobox 的焦点模型不同，照抄一套「弹层组件」会直接造成读屏与键盘失败。

## 反例 / 红线

- 声称「所有 Promise 一定早于所有 `setTimeout`」而不给嵌套与跨环境边界。
- 用 `localStorage` 存长期 access / refresh token 当默认安全方案。
- 把 CORS、HttpOnly 或「上了 HTTPS」口头当成 CSRF / XSS 已解决。
- 用 `unload` 做清理，或忽略 BFCache 恢复后的时效数据。
- 给业务包一刀切 `sideEffects: false` 导致样式丢失却归因于「打包器坏了」。
- 无取消的并发池、无竞态丢弃的列表翻页、无边界说明的「万能深拷贝」。
- 用 `div`+ARIA 重造原生控件，却不做键盘与读屏验收。

## 必链题库

| 主题 | 题库入口 |
| --- | --- |
| 类型边界 / 事件循环 / 异步取消 | [01-js-ts](/interview/questions/01-js-ts) Q1、Q5、Q9、Q10、Q22；D2、D3、D10 |
| 语义 / 布局 / 可访问性 | [16-html-css-a11y](/interview/questions/16-html-css-a11y) Q1、Q6、Q11、Q12；D2、D3 |
| 渲染链路 / BFCache / SW / Worker | [17-browser-web-api](/interview/questions/17-browser-web-api) Q1、Q7、Q9；D1、D2、D6 |
| 缓存 / CORS / XSS / CSRF / 登录 | [18-network-security](/interview/questions/18-network-security) Q6、Q9、Q10、Q11；D2、D3、D5 |
| 防抖节流 / 并发池 / 虚拟列表 | [10-handwriting](/interview/questions/10-handwriting) Q1、Q2、Q5；D1、D5 |

专题深挖：[JS 运行时与异步](/interview/review/topics/01-js-runtime)、[TS 类型系统](/interview/review/topics/02-ts-types)、[浏览器渲染](/interview/review/topics/03-browser-rendering)、[网络与 Web 安全](/interview/review/topics/04-network-security)。

## 5 分钟口述稿

「我先把本域收成四条主线：类型与运行时、浏览器交付、网络缓存与安全、手写题背后的不变量。

类型上，外部数据进门是 `unknown`，边界收窄后再进业务；`any` 只做带 owner 的逃逸。运行时上，同步跑完清微任务，再谈渲染和宏任务；卡顿要看长任务与是否饿死渲染，而不是背口号。请求侧默认带取消：路由切走、新请求覆盖旧请求，旧响应不得写回。

浏览器侧，导航到可交互要分段看；存储按 Cookie / Web Storage / IndexedDB 选型；多标签只同步通知，真相在服务端。BFCache 不用 `unload`，靠 `pagehide` / `pageshow.persisted` 恢复。需要离线再谈 SW 策略与更新确认。

网络上，哈希静态资源长缓存，HTML 短缓存；协议升级不能当所有阻塞的解药。安全上，XSS 堵源和 sink，再叠 CSP；有自动凭证就要防 CSRF；登录优先 BFF Cookie 或 PKCE，不把 Token 随便塞本地存储。

手写题我讲场景不变量：防抖节流的取消与卸载、并发池的取消与保序、深拷贝的不可克隆边界、虚拟列表的窗口而不是全量 DOM。最后用自己项目的一次竞态修复、一次缓存发布回滚和一次键盘可达验收收口。」
