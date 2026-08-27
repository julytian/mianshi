# DevOps 面试题库（Jenkins / Docker / Kubernetes）

> **怎么用：** 普通题按「交付目标 → 前端制品边界 → 运行时证据 → 回滚动作」口述 1～2 分钟；深层题按「风险 → 供应链 / 版本一致性 → 观测 → owner 与例外」展开。对象是资深前端如何把 VitePress、Vue SPA、Nuxt SSR 安全送上线，不是背 SRE 调度、网络插件或集群证书八股。
>
> **相关：** 工程化门禁与制品见 [03 工程化](/interview/questions/03-engineering)；构建、hash 与 Source Map 见 [24 Vite](/interview/questions/24-vite)；SSR 生命周期见 [23 Nuxt](/interview/questions/23-nuxt)。教程：[Jenkins](/interview/guides/devops/jenkins)、[Docker](/interview/guides/devops/docker)、[Kubernetes](/interview/guides/devops/k8s)。

---

## 一、Jenkins 与持续交付

### Q1. CI 和 CD 对前端分别保证什么，二者如何衔接？

**考察点：** 持续集成、持续交付、持续部署、不可变制品和晋级

::: details 参考答案

持续集成（CI）保证每次合并都在干净环境里用冻结锁文件完成安装、lint、类型检查、测试和生产构建，尽早发现「只有我这台机器能过」的漂移。持续交付（Continuous Delivery）保证主干上的绿色构建已经是可发布制品：同一 digest 的静态包或镜像可以晋级到预发与生产，而不是每个环境重新 `pnpm install && pnpm build`。持续部署（Continuous Deployment）则是门禁全绿后自动推进生产，适合变更可逆、观测完整、回滚一键的站点。

前端衔接点是制品而不是「再跑一遍构建脚本」。Vite / VitePress 产出带 hash 的静态资源，Vue SPA 还要带短缓存的 `index.html`；Nuxt SSR 产出的是 Node 服务镜像而不是纯 `dist`。CI 负责证明这份制品可复现，CD 负责把它推到对象存储、CDN 或集群，并留下版本、SBOM 与回滚目标。面试应讲清谁触发发布、哪一步不可跳过、失败时制品不能继续晋级。

:::

**追问：** 预发通过后为生产重新执行一次 `pnpm build` 有什么风险？

::: details 追问参考答案

重新构建会换掉依赖解析、时间戳和 chunk hash，预发验证过的 HTML 与 JS 不再是同一份制品，线上问题无法用预发日志复现。正确做法是 CI 只构建一次，后续环境只晋级同一包或同一镜像 digest，环境差异用运行时配置而不是重建。密钥仍不能打进浏览器包。

:::

---

### Q2. Jenkinsfile 声明式和脚本式应如何选择？

**考察点：** Declarative Pipeline、Scripted Pipeline、共享库、可审查性和前端常规阶段

::: details 参考答案

声明式流水线用 `pipeline { agent; options; environment; stages; post }` 描述阶段，结构固定，适合 Code Review，也方便套超时、重试、`post` 通知和 `when` 条件。脚本式流水线在 `node { }` 里写 Groovy，分支、循环和动态 agent 更自由，但更容易把密钥、环境判断和业务脚本缠在一起，后续无人敢改。

资深前端的默认选择是声明式：`checkout` → 冻结安装 → lint / typecheck / test → `pnpm build` → 上传制品或构建镜像。矩阵、多包 affected 或复杂签核可以下沉到共享库的可信步骤，而不是把 Jenkinsfile 写成几百行 Groovy。脚本式只留给声明式表达不了、且有 owner 的少数步骤。流水线应声明 agent 镜像里的 Node 与 pnpm 版本，不依赖宿主机全局工具。细节见 [Jenkins 教程](/interview/guides/devops/jenkins)。

:::

**追问：** 为什么不要在 Jenkinsfile 里直接写 npm token 或 kubeconfig 明文？

::: details 追问参考答案

Jenkinsfile 进仓库，明文会进入 Git 历史、PR diff 和备份，任何能读代码的人都能拿去推包或改集群。应使用 Credentials Binding，按任务注入只读、可轮换、可吊销的短时凭据，并禁止打进日志与镜像层。fork PR 默认不给写仓库、推镜像或部署的凭据。

:::

---

### Q3. 前端流水线应设哪些阶段，质量门禁卡什么？

**考察点：** 阶段划分、PR 与主干门禁、失败证据和不可跳过发布

::: details 参考答案

常规阶段按反馈速度排列：检出与工具链锁定、`pnpm fetch` / 冻结安装、lint 与 typecheck、单测与必要的组件测试、生产构建、体积或关键契约检查、上传制品或打镜像、部署预览、发布与观察。PR 只跑能阻断合并的正确性；全量 E2E、夜间扫描和趋势预算放主干，避免每个 MR 被长尾拖死。门禁必须绑定这次构建的制品，而不是「再扫一遍工作区」。

卡点要可解释：类型错误、失败测试、构建失败、锁文件被绕过、超预算的入口体积，都应留下日志、报告和 owner。发布阶段不能用「人工感觉良好」跳过构建或测试。测试层级与 flaky 处置见 [21 测试与质量保障](/interview/questions/21-testing-quality)；任务图、affected 与远程缓存边界见 [03 工程化](/interview/questions/03-engineering) D3 / D7。

:::

**追问：** 哪些检查必须留在 PR 关键路径，哪些可以放到主干或夜间？

::: details 追问参考答案

PR 关键路径只放合并后会立刻伤主干的项：错误级 lint、类型检查、改动相关单测和生产构建。全量 E2E、视觉回归、漏洞扫描和体积趋势适合主干或夜间，并仍要有失败 owner。发布前再补冒烟和配置差分。门禁过长会被绕过，过短会把坏包送进主干，应用排队时长和逃逸缺陷一起调。

:::

---

### Q4. Jenkins 凭据和前端密钥应怎样隔离？

**考察点：** Credentials、最小权限、日志脱敏、构建期与运行时密钥边界

::: details 参考答案

仓库、Dockerfile 和 Vite 源码都不是密钥柜。npm / pnpm 私有源 token、镜像仓库密码、对象存储 AK、kubeconfig 只存在 Jenkins Credentials 或外部保险箱，在需要的步骤用绑定注入，用完即失效。凭据按任务拆分：读包、推镜像、部署集群互不借用；生产凭据不给个人长期副本。fork PR 与不受信分支默认只读，不能写缓存、推包或改生产。

前端还要分清两类「看起来像配置」的值。`VITE_*` 会进浏览器包，只能放可公开的 API 基址或 client id；数据库口令、服务端 SDK、签名密钥只能留在 CI、BFF 或集群 Secret。构建参数不要用 `--build-arg` 把 token 烤进镜像层，安装私有包装用 BuildKit secret 或短期 `.npmrc` 且不 COPY 进最终阶段。环境变量设计见 [03 工程化](/interview/questions/03-engineering) Q3。

:::

**追问：** 私有 npm token 为什么不能写成 Dockerfile 的 `ARG` 再 `echo` 进 `.npmrc`？

::: details 追问参考答案

`ARG` / `ENV` 和 RUN 层会留在镜像历史与缓存里，`docker history` 或导出层就能读到 token，CI 日志里的 `echo` 也会泄漏。应用 BuildKit secret 或短时挂载安装，最终阶段不复制 `.npmrc`。token 只要读 registry，过期可轮换，fork 构建不得复用同一枚可写凭证。

:::

---

## 二、Docker 镜像与运行安全

### Q5. Docker 镜像分层对前端构建缓存意味着什么？

**考察点：** 层缓存、指令顺序、`.dockerignore` 和锁文件失效

::: details 参考答案

每条 `FROM`、`COPY`、`RUN` 都会生成一层。后一层依赖前一层的摘要，前面一变，后面全部重做。前端最贵的是依赖安装，所以应先只复制 `package.json`、锁文件和 pnpm 工作区声明，跑冻结安装，再复制源码执行 `pnpm build`。源码天天变，依赖不该被带着重装。

`.dockerignore` 必须排除 `node_modules`、`.git`、本地 `.env`、测试报告和旧 `dist`，否则一次 `COPY . .` 会让缓存失效，还可能把密钥和开发垃圾打进构建上下文。锁文件或 Node / pnpm 版本变化时，安装层理应失效；不要靠「手动删缓存」掩盖错误的指令顺序。分层与多阶段写法见 [Docker 教程](/interview/guides/devops/docker)。

:::

**追问：** 为什么把 `COPY . .` 写在 `pnpm install` 前面会让 CI 每次都重装依赖？

::: details 追问参考答案

`COPY . .` 把几乎所有源码变更算进该层摘要，后面的安装指令全部失效，锁文件没变也会重装。应先复制清单和锁文件并冻结安装，再复制源码构建。同时用 `.dockerignore` 丢掉 `node_modules` 和本地产物，避免上下文噪声和错误文件进入层。

:::

---

### Q6. 多阶段构建为什么能缩小前端镜像？它不会自动解决什么？

**考察点：** builder 与 runtime 分离、最终制品白名单、Source Map 和供应链残留

::: details 参考答案

多阶段把「编译环境」和「运行环境」拆开。builder 使用 Node 镜像完成 `pnpm install --frozen-lockfile` 与 `pnpm build`；最终阶段只用 `nginx:alpine` 或精简 Node 运行时，`COPY --from=builder` 白名单拷贝 `dist`、Nginx 配置或 `server` 产物。Node、编译器、`node_modules`、测试和源码都留在被丢弃的构建阶段，所以镜像能从数 GB 降到十几 MB 级。VitePress 与 Vue SPA 走静态 Nginx；Nuxt SSR 走 Node 运行阶段，仍然不要把整个 builder 当生产镜像。

多阶段只隔离阶段，不自动消毒。Vite 的 `hidden` Source Map 仍在 `dist` 里；`.env`、`.npmrc`、文档和测试夹具只要被 COPY 就会进最终层。最终镜像还要非 root、只读、无密钥，并单独生成运行时 SBOM，不能把 builder 的依赖清单当成线上攻击面。部署链路总览见 [03 工程化](/interview/questions/03-engineering) Q21；map 泄漏见本题库 D2 与 [24 Vite](/interview/questions/24-vite)。

:::

**追问：** 为什么「已经用了多阶段」仍可能把整个 `node_modules` 带进生产镜像？

::: details 追问参考答案

最终阶段如果 `COPY --from=builder /app /app` 或把 builder 的工作目录整棵拷走，安装树、缓存和源码都会留下。必须白名单：SPA / VitePress 只拷 `dist` 与 Nginx 配置，Nuxt 只拷运行所需的 server 产物与生产依赖。再用镜像扫描确认没有 `node_modules` 全量和 `.map`。

:::

---

### Q7. 前端容器为什么要非 root，文件系统为什么尽量只读？

**考察点：** 最小权限、`USER`、`readOnlyRootFilesystem`、可写卷和能力收敛

::: details 参考答案

容器默认若以 root 跑，应用或供应链漏洞更容易改掉 Nginx 配置、写 webshell、读挂进去的 ServiceAccount 或横向打到相邻负载。静态站和 Vue SPA 的 Nginx 应以非特权用户监听，只读根文件系统，仅给 pid、缓存等必要路径挂 `emptyDir` 或 tmpfs。Nuxt / Node SSR 同样用非 root 用户，绑定非特权端口，通过 Service 暴露。

只读不是让进程完全不能写，而是把可写面收敛到声明过的卷，防止运行时往镜像层偷写密钥、dump 或被篡改的静态文件。配合 drop 多余 Linux capabilities、去掉不需要的 shell 工具链。这是发布基线，不是「安全做完了」：密钥仍不能进镜像，Ingress 与对象存储权限还要单独收。教程见 [Docker](/interview/guides/devops/docker) 与 [Kubernetes](/interview/guides/devops/k8s)。

:::

**追问：** Nginx 开了 `readOnlyRootFilesystem` 后常见的启动失败是什么原因？

::: details 追问参考答案

官方 Nginx 需要写 pid、client body 临时文件和缓存目录，根只读时这些路径会失败。应在 Pod 或 Compose 里为 `/var/run`、`/var/cache/nginx` 等必要目录挂 tmpfs / `emptyDir`，并用非 root 用户可写的 pid 路径。不要为了启动成功把整个根文件系统改回可写。

:::

---

### Q8. 容器健康检查对静态站和 SPA 应检查什么？

**考察点：** Docker `HEALTHCHECK`、存活证据、与业务页解耦、失败重启边界

::: details 参考答案

Docker `HEALTHCHECK` 告诉编排器「进程还在按约定响应」，不是替代 Kubernetes 探针。静态 VitePress 或 Vue SPA 的 Nginx 应提供廉价、无依赖的路径，例如独立 `healthz` 返回 200 且不经过复杂 `try_files` 业务回退。不要把首页或需要鉴权的后台入口当唯一检查：首页 302 到登录、或 HTML 回退掩盖了上游故障，都会给出假健康。

检查必须稳定、快速、无副作用，不能打真实支付或写库。失败阈值要能容忍短暂抖动，又不能把已经不能提供静态文件的容器继续留在负载里。Docker 层只回答「这个容器该不该被重启或摘流」；进集群后改用探针表达存活、就绪和启动，见 Q12。Nuxt SSR 的健康检查还要避开冷启动和阻塞事件循环的渲染页。

:::

**追问：** 为什么用 `index.html` 的 200 作为唯一健康条件会漏掉故障？

::: details 追问参考答案

SPA 的 Nginx 常把任意路径回退成 `index.html`，上游挂了或静态卷没挂上也可能仍 200。健康路径应独立、不走业务回退，并确认关键静态根或配置文件可读。集群里还要把「进程活着」和「能接流量」拆开，用就绪探针摘流，避免把半初始化容器留在 Service 后端。

:::

---

## 三、Kubernetes 与前端发布

### Q9. Deployment、Service、Ingress 在前端发布里各管什么？

**考察点：** 副本与滚动、集群内稳定入口、七层路由和 TLS

::: details 参考答案

Deployment 声明期望副本和镜像，通过 ReplicaSet 做滚动替换，管的是「跑多少个、跑哪一版」。Service 给这些 Pod 一个稳定的 ClusterIP 或内部 DNS，做负载均衡，不关心某一个 Pod 叫什么。Ingress（或网关）在七层按 host / path 把公网流量转到 Service，并常在这里终结 TLS。三者叠在一起，才是浏览器能访问的站，而不是「有个容器就算上线」。

前端常见两种拓扑。VitePress / Vue SPA：Ingress → Service → Nginx Pod，或 Ingress 只反代 API，静态资源走对象存储和 CDN。Nuxt SSR：Ingress → Service → Node Pod，SSR 要管会话、超时和优雅退出。资深前端要能画出自己站点的流量，而不是背对象字段。清单与发布动作见 [Kubernetes 教程](/interview/guides/devops/k8s)。

:::

**追问：** 只创建了 Deployment、没有 Service 和 Ingress，浏览器为什么访问不到？

::: details 追问参考答案

Deployment 只保证集群内有副本，Pod IP 会变且默认不对外。没有 Service，集群内没有稳定后端；没有 Ingress 或负载均衡，集群外没有七层入口和证书。应补齐 Service 选中正确标签，再由 Ingress 把域名转到该 Service。纯静态公网站点也可以让 Ingress 只走 API，HTML 与 hash 资源直接出 CDN。

:::

---

### Q10. ConfigMap 和 Secret 对前端运行时配置应如何分工？

**考察点：** 公开配置、敏感数据、base64 并非加密、一次构建多环境

::: details 参考答案

ConfigMap 放非敏感、可进浏览器或可进 Nginx 的运行时配置：API 公网基址、公开 feature flag、主题或文档站的站点名。Secret 放镜像拉取、对象存储、私有 registry、服务端签名密钥等。Kubernetes Secret 默认多是 base64 编码后存 etcd，不是加密保险箱；生产应开加密静止存储、收紧 RBAC，并优先用外部保险箱注入。不要把真实 Secret 明文提交进仓库里的 YAML。

Vue SPA / VitePress 的推荐模型是一次构建、多环境晋级：Pod 把 ConfigMap 挂成 `config.json` 或环境文件，入口短缓存读取。`VITE_*` 构建期替换做不到「同一制品换环境」。密钥继续留在服务端或 BFF。Nuxt SSR 可在服务端读 Secret，序列化给客户端的只能是公开字段。配置边界见 [03 工程化](/interview/questions/03-engineering) Q3 / D8。

:::

**追问：** 把生产 API 签名密钥放进 ConfigMap 并挂给浏览器包，错在哪里？

::: details 追问参考答案

ConfigMap 通常权限更宽、常被日志和排障副本看见，且任何打进前端包的值都等于公开。签名密钥一旦到浏览器，就可以被重放和盗用。密钥只应存在 Secret 或外部保险箱，由 BFF 或服务端使用；前端最多拿可公开的 client id，并配合域名限制、限流和轮换。

:::

---

### Q11. Kubernetes 滚动更新和回滚对前端意味着什么？

**考察点：** RollingUpdate、就绪门槛、`rollout undo` 和入口与资源版本

::: details 参考答案

Deployment 默认滚动：先起新 ReplicaSet 的 Pod，就绪后再减少旧副本，`maxUnavailable` 与 `maxSurge` 控制并行度和容量。回滚是把 Deployment 指回上一版 ReplicaSet，而不是 SSH 进容器改文件。新 Pod 必须通过就绪探针才进 Service，否则滚动会把坏版本接进流量。

前端还要处理「HTML 与 hash 资源不是同一个进程」。只滚 Nginx / Node 镜像、却把新 `index.html` 和旧 chunk 分拆在 CDN 与集群两边，用户会在滚动窗口里混到跨版本资源。回滚也要同时恢复入口、保留旧 hash 文件，并确认后端 API 仍兼容旧前端。灰度停止线见 [03 工程化](/interview/questions/03-engineering) D4 / D11；滚动窗口的 hash 撕裂见 D3。

:::

**追问：** `kubectl rollout undo` 成功后用户仍白屏，优先查什么？

::: details 追问参考答案

先看入口 HTML 是否仍指向新 hash，而旧镜像或 CDN 已不再提供这些文件。回滚必须成对恢复 HTML / 配置和仍被引用的静态资源，并确认 Service 已切到旧 ReplicaSet 的就绪 Pod。同时核对 API 兼容窗口：旧前端打到新后端缺字段也会白屏，不能只看 Deployment 的 revision。

:::

---

### Q12. liveness、readiness、startup 三类探针怎么给前端选型？

**考察点：** 重启、摘流、慢启动、静态 Nginx 与 Node SSR 差异

::: details 参考答案

liveness 失败会杀容器重启，只适合「进程死锁、端口不再响应」这类自己恢复不了的状态；用业务页或依赖下游的接口做 liveness，容易在依赖抖动时集体重启。readiness 失败只把 Pod 从 Service 摘掉，适合配置未加载、预热未完成、过载需要保护。startup 给慢启动一个宽限期，避免 Nuxt / Node 在编译或预热时被 liveness 误杀。

VitePress / Vue SPA 的 Nginx：readiness 与 liveness 都可以打独立 `healthz`，阈值短、无业务依赖。Nuxt SSR：startup 覆盖冷启动，readiness 确认监听端口且能做廉价探活，liveness 必须比一次可接受的事件循环阻塞更宽容，且不要渲染真实页面。探针是流量与重启的开关，不是功能测试。教程见 [Kubernetes](/interview/guides/devops/k8s)。

:::

**追问：** 为什么不要把 Nuxt 的完整首页渲染当作 liveness？

::: details 追问参考答案

首页 SSR 依赖数据源、模板和 CPU，下游一慢或流量一高就会超时，kubelet 会连续杀 Pod，故障被放大成重启风暴。liveness 只问进程是否不可恢复地卡死；首页可用性交给 readiness、过载保护和 SLO。慢启动用 startupProbe 挡住过早的存活检查。

:::

---

### Q13. 前端静态资源上 Kubernetes 还是对象存储加 CDN，如何选？

**考察点：** 源站拓扑、HTML 与 hash 缓存、`base`、成本与回滚窗口

::: details 参考答案

内部后台、预览环境、流量小或必须内网隔离的 VitePress / Vue SPA，用集群里的 Nginx 即可：Ingress 进站，`try_files` 支持 history，hash 资源长缓存，`index.html` 短缓存。面向公网的站点更常见的是对象存储加 CDN：构建产物上传到版本前缀，CDN 回源，HTML 每次校验，带内容 hash 的 JS / CSS / 图片长期不可变。集群此时只跑 API、BFF 或 Nuxt SSR，不再当全球静态源站。

混合也可以：HTML 或边缘入口由 Ingress 控制，大资源走 CDN，但必须统一 [24 Vite](/interview/questions/24-vite) 的 `base`、publicPath 和 CORS。回滚依赖「旧 HTML 仍能拿到旧 hash 文件」，CDN 与存储不能在观察窗口内删上一版。缓存分层见 [03 工程化](/interview/questions/03-engineering) Q15 / Q21。Nuxt 的服务端渲染页不是纯静态，不能只上传 `dist` 了事，见 [23 Nuxt](/interview/questions/23-nuxt)。

:::

**追问：** 为什么公网站点把全部 hash 资源只放在可滚动的 Nginx Pod 里风险更高？

::: details 追问参考答案

滚动时不同 Pod 可能持有不同版本的 `dist`，同一用户的 HTML 和 chunk 会打到不同副本，出现 404 或混版。Pod 扩缩、重建也会打穿边缘缓存假设。公网静态资源应放到不可变对象存储并保留多版本，集群只做入口或 SSR；小流量内网站点才适合整包进 Nginx 镜像。

:::

---

### Q14. Jenkins 构建前端时怎样缓存 `node_modules` 或 pnpm store？

**考察点：** 内容寻址 store、缓存键、冻结安装、fork 写入隔离

::: details 参考答案

不要把整个项目 `node_modules` 当万能缓存：布局依赖锁文件、Node ABI、操作系统和 pnpm 版本，乱复用会造成幽灵依赖和原生模块错位。pnpm 更适合缓存内容寻址 store：CI 锁定 Node / pnpm，用提交的 `pnpm-lock.yaml` 做 `pnpm fetch --frozen-lockfile`，再离线安装。缓存键至少包含锁文件摘要、pnpm 版本、OS、架构和原生 ABI。

Jenkins 可用流水线 cache 步骤或 agent 上按键隔离的目录；容器构建则用 BuildKit cache mount 挂 store，而不是把 `node_modules` COPY 进层。认证令牌不进缓存、不进日志。fork PR 只读共享缓存或使用独立命名空间，防止投毒。包管理器选择见 [03 工程化](/interview/questions/03-engineering) Q20，远程缓存可信边界见 D7。

:::

**追问：** 缓存命中率很高但偶发「本地能过、CI 原生模块加载失败」，键少算了什么？

::: details 追问参考答案

少算了 OS、CPU 架构或原生模块 ABI。store 或 `node_modules` 从 Linux agent 复用到另一架构、或 Node 大版本已变，`.node` 二进制会对不齐。键必须包含锁文件、pnpm / Node 版本、平台和 ABI；命中后仍要用冻结安装和一次真实 `require` 验收，不能只看缓存百分比。

:::

---

## 四、深层场景题

### D1. 前端流水线被投毒或供应链被插入时，你如何收敛爆炸半径？

::: details 参考答案

#### 基础结论

把流水线当成生产攻击面：不可信 PR、生命周期脚本、共享缓存和过宽凭据都能把恶意代码写进制品。先隔离执行与密钥，再用冻结锁文件、完整性校验和签名制品证明「跑过 CI」不等于「来源可信」。

#### 原理深挖

投毒常见路径是恶意 `postinstall`、被篡改的构建插件、向共享 cache 写入的 fork 构建，以及能推镜像或改 DNS 的过期 token。lockfile 能钉版本和完整性哈希，但挡不住上游账号被盗后的新版本，也挡不住脚本在安装期执行。Jenkins 插件和 agent 本身也是供应链。依赖治理见 [03 工程化](/interview/questions/03-engineering) D10。

#### 工程场景

CI 只用冻结安装和锁定的 Node / pnpm；高安全仓限制生命周期脚本并审批例外。fork PR 无写缓存、无推包、无部署凭据。制品附 SBOM 与 digest 签名，部署核验 provenance。私有源走 TLS 与最小只读账号。发现异常立即吊销凭据、冻结受影响 digest、回滚入口并审计同一缓存命名空间的其他任务。

#### 反例 / 踩坑

对任何 PR 复用生产 npm token、允许删锁重装、把 cache 命中当安全信号、在日志里打印 `.npmrc`，或只扫运行时依赖却放过会改产物的 Vite 插件。

#### 资深回答模板

我按不可信输入对待外部 PR 和安装脚本：密钥与写缓存隔离，锁文件冻结，制品签名后才能晋级。出事先吊销和回滚同一 digest，再查缓存与插件，而不是只重跑到绿。

:::

**追问链：**
1. fork PR 为什么默认不能写共享 pnpm cache？
2. 只升级 lockfile 里的一个包时你审查什么？
3. 构建插件漏洞和业务依赖漏洞为什么要分开看？

::: details 追问参考答案

**1. fork PR 为什么默认不能写共享 pnpm cache？**

外部分支能往共享 store 写入同名内容不同字节的包，后续受信任务命中后会把投毒依赖装进生产制品。fork 应只读或用隔离命名空间，推包与部署凭据一律不给。发现污染要作废该键并审计其后所有 digest。

**2. 只升级 lockfile 里的一个包时你审查什么？**

看 diff 是否只含目标包及必要传递依赖，核完整性哈希、来源 registry 和新增安装脚本，并用依赖解释确认引入理由。禁止删锁重装。CI 冻结安装后跑测试与 SBOM 差分，出现无关包就拆 PR。

**3. 构建插件漏洞和业务依赖漏洞为什么要分开看？**

插件在 CI 执行并能改写打包结果，即使不进浏览器 import 也能注入运行时代码。业务依赖看是否打进包、路径是否可达。两者都要锁版本和 SBOM，但不能用同一份 audit 分数决定优先级。

:::

---

### D2. 多阶段构建之后，为什么 Source Map 仍可能出现在生产镜像里？

::: details 参考答案

#### 基础结论

多阶段不会过滤 `dist` 里的文件。Vite 生产若开启 `hidden` map，文件仍被生成；`COPY --from=builder .../dist` 会原样带进 Nginx 镜像，公网路径可被猜到或遍历。

#### 原理深挖

`build.sourcemap: 'hidden'` 只是不在产物末尾写 `sourceMappingURL`，不是「不要 map 文件」。`'inline'` 更会把映射写进包体。排除 `sourcesContent` 要靠底层 `sourcemapExcludeSources` 或监控平台，不是另一个 Vite 字符串枚举。完整口径见 [03 工程化](/interview/questions/03-engineering) Q16 / D6 与 [24 Vite](/interview/questions/24-vite)。

#### 工程场景

CI 用 `'hidden'` 生成 map，上传到受控监控平台并绑定 release，然后从即将 COPY 的目录删除 `.map`，或按白名单只拷 JS / CSS / HTML / 字体。最终镜像扫描不得出现 `.map` 与源码树。Nginx 对 `*.map` 直接 404。SBOM 区分构建阶段与运行时，provenance 绑最终 digest。

#### 反例 / 踩坑

以为多阶段等于安全、把整个 `dist` 当运行文件、CDN 同步时连 map 一起公开、用 `docker history` 看不到就认为层里没有文件。

#### 资深回答模板

我把 map 当调试密钥：构建生成、上传监控、部署前删除，最终镜像和 CDN 扫描为零。多阶段只丢掉 Node 工具链，不代替这套白名单。

:::

**追问链：**
1. `'hidden'` 能否阻止有人下载 `.map`？
2. 最终镜像 SBOM 为什么不能代替构建阶段清单？
3. 监控平台上的 map 最小权限怎么设？

::: details 追问参考答案

**1. `'hidden'` 能否阻止有人下载 `.map`？**

不能。它只去掉引用注释，文件若被同步到 Nginx 或 CDN，猜路径或列目录仍可能拿到源码映射。必须部署前删除或禁止拷贝，并让源站对 `*.map` 返回 404。用公开 URL 探测和镜像扫描验收，不要只看 HTML 里有没有注释。

**2. 最终镜像 SBOM 为什么不能代替构建阶段清单？**

运行时 SBOM 描述 Nginx 与静态文件，不含编译期 Node、pnpm 图和插件。投毒常发生在构建阶段。应对 builder 与最终制品分别出 SBOM，provenance 绑定最终 digest，部署时验证签名，而不能把小镜像清单当成完整供应链。

**3. 监控平台上的 map 最小权限怎么设？**

按应用与环境限制上传和下载，生产源码映射不对普通开发者长期公开，访问审计，过期自动删。CI 用短时令牌上传并绑定 release。禁止把 map 当构建产物附件挂到公开 job，也禁止再发回可匿名访问的桶。

:::

---

### D3. 滚动更新时，旧 Pod 与新静态资源 hash 不一致会怎样？

::: details 参考答案

#### 基础结论

浏览器先拿到某一版 HTML，再按其中的文件名拉 chunk。滚动窗口里若 Ingress 把 HTML 和 JS 打到不同版本的 Pod，或 CDN 入口与集群 `dist` 不同步，就会 404 或执行错版代码。

#### 原理深挖

Vite 内容哈希让文件名绑定内容，这是缓存优势，也让跨版本文件不可互换。公共 chunk 变化还会级联改写引用它的异步 chunk，见 [24 Vite](/interview/questions/24-vite) 与 [03 工程化](/interview/questions/03-engineering) D5。Kubernetes 只保证 Pod 逐渐替换，不保证一次页面会话打到同一 ReplicaSet。Session 亲和只能降低概率，不能当正确性机制。

#### 工程场景

公网静态资源放到不可变对象存储，保留至少覆盖观察与回滚窗口的旧 hash；滚动的是 HTML 入口或 SSR，而不是让每个 Pod 自带互不共享的 `dist`。若必须整包进镜像，先等新 ReplicaSet 全就绪再切入口，或短时同时提供两套资源前缀。发布后按版本看资源 404、白屏和入口命中。

#### 反例 / 踩坑

只滚镜像不保留旧文件、发布后立刻清 CDN 全站、用请求级随机把 HTML 和 JS 拆到两个版本、以为 `maxUnavailable: 0` 就能消除混版。

#### 资深回答模板

我把 hash 资源当成不可变对象，入口短缓存、资源长留多版本。滚动只切换入口或 SSR，不让用户在一次加载里跨 ReplicaSet 拼盘；回滚先确认旧文件还在。

:::

**追问链：**
1. `maxUnavailable: 0` 为什么仍可能混版？
2. Service Worker 会怎样放大这次不一致？
3. 回滚入口时旧 chunk 已被删应如何预防？

::: details 追问参考答案

**1. `maxUnavailable: 0` 为什么仍可能混版？**

它只保证容量，滚动中新旧 Pod 会同时在 Service 后端。同一次页面的 HTML 与后续 chunk 仍可能打到不同副本。要从根上避免，把不可变资源放到共享存储并保留多版本，或等新副本全就绪再切入口，而不是只调 surge。

**2. Service Worker 会怎样放大这次不一致？**

SW 可能把新 HTML 与旧 precache 清单拼在一起，或在回滚后仍拦截出新 hash。预缓存必须与入口版本一起更新，回滚时旧入口要能拿到兼容清单。用「只更入口 / 只更资源 / 同时更新」三组会话验收恢复。

**3. 回滚入口时旧 chunk 已被删应如何预防？**

发布策略写明保留 N 个版本或按 TTL 覆盖整个观察窗口，回滚演练必须包含「切回旧 HTML 仍 200」。禁止发布成功立即删存储前缀。监控资源 404 按 release 切片，缺文件先停删而不是先清缓存。

:::

---

### D4. Secret 是怎样误进镜像或 CI 日志的，前端要守住哪些口？

::: details 参考答案

#### 基础结论

密钥泄漏很少来自「黑客破解 etcd」，更多是 Dockerfile 层、被 COPY 的 `.env`、Jenkins 控制台和错误的 `VITE_*`。守口比事后轮换便宜，但仍要能轮换。

#### 原理深挖

`ARG`、`ENV`、`RUN echo`、把 `.npmrc` 打进层、把 `.env.production` COPY 进 Nginx 镜像，都会变成可导出的历史。Jenkins 的 `sh` 打印环境、失败时的 debug、把凭据写进归档制品，同样公开。浏览器侧则是误把服务端密钥当成 `VITE_` 构建进去，见 [03 工程化](/interview/questions/03-engineering) Q3。

#### 工程场景

构建用 BuildKit secret，最终阶段无 `.npmrc`、无 `.env`、无 CI token。日志开启掩码，禁止 `set -x` 打凭据。镜像扫描和 `docker history` 进门禁。运行时密钥只挂 Secret 卷或环境，且不进前端包。泄漏立即轮换 registry、对象存储和集群凭证，并作废已推送的 digest。

#### 反例 / 踩坑

为了「方便本地 docker run」把生产 `.env` 打进镜像、在 Jenkinsfile 里写明文、把 kubeconfig 当构建产物归档、用 ConfigMap 存签名密钥。

#### 资深回答模板

我假设层、日志和浏览器都是公开通道：构建密钥短时挂载，运行密钥进 Secret，客户端只有公开配置。门禁扫层和日志；泄漏先轮换再复盘哪一次 COPY 或 echo 写出去的。

:::

**追问链：**
1. `docker history` 看不到明文是否说明层里没有密钥？
2. 发现 npm token 进日志后为什么只改 Jenkins 任务不够？
3. 前端包里出现 `sk-` / `AKIA` 形态字符串应怎样定性？

::: details 追问参考答案

**1. `docker history` 看不到明文是否说明层里没有密钥？**

不一定。多阶段或 squash 后历史变短，文件仍可能在 tar 层里。要用扫描、导出文件系统和搜 `.npmrc` / `.env` 验收。最终阶段白名单 COPY，构建秘密走 secret mount，不能靠「history 干净」当证明。

**2. 发现 npm token 进日志后为什么只改 Jenkins 任务不够？**

日志可能已被复制到制品库、聊天和备份，token 应视为已泄漏并立即吊销、改只读短时令牌、检查是否已推私有包。同时查同一凭据是否写进镜像层或 cache。只修打印格式会留下仍有效的被盗凭证。

**3. 前端包里出现 `sk-` / `AKIA` 形态字符串应怎样定性？**

按已公开密钥处理：立刻轮换、查构建期 `VITE_*` 或误打进的 `.env`，并从 CDN 撤包。即使供应商说是 client id，也要确认权限与滥用成本。门禁应对产物做密钥扫描，不能等用户举报。

:::

---

### D5. HPA 对 Node SSR 和静态 Nginx 为什么不能用同一套直觉？

::: details 参考答案

#### 基础结论

静态 Nginx 几乎是在发文件，瓶颈常在带宽、连接和 CDN，而不是 CPU；Nuxt / Node SSR 用事件循环做渲染，CPU、内存和下游延迟才是扩缩依据。把「副本加一」当成通用性能手段，会扩错层。

#### 原理深挖

HPA 默认看 CPU / 内存利用率。Nginx 静态站 CPU 很低，HPA 可能永远不扩，真正压力在单机连接或源站带宽；此时应上 CDN 或按 RPS / 连接数的自定义指标，而不是盲目加 Pod。SSR 的 CPU 高不代表该无限扩：冷启动、连接复用、内存泄漏和事件循环阻塞会让新副本先变成就绪黑洞。生命周期见 [23 Nuxt](/interview/questions/23-nuxt)。

#### 工程场景

VitePress / Vue SPA 公网流量优先对象存储加 CDN，集群 Nginx 只做内网或回源，`minReplicas` 小而稳。Nuxt 设合理 request / limit，HPA 看 CPU 与请求延迟，保留 `minReplicas` 吸收冷启动；就绪探针在监听完成前不接流量。扩缩要配 PodDisruptionBudget，避免发布与缩容同时抽干。

#### 反例 / 踩坑

给静态 Nginx 设 80% CPU 才扩、SSR 不设内存限制导致节点压力驱逐、用 liveness 当过载保护、把 HPA 当成本优化关掉 `minReplicas` 只留 1。

#### 资深回答模板

我先问瓶颈在文件分发还是渲染。静态站用 CDN 和连接指标；SSR 用 CPU / 延迟和最小副本，并保证慢启动不进流量。HPA 是保护用户，不是证明架构正确。

:::

**追问链：**
1. 静态站 CPU 很低时 HPA 不扩，用户已经很慢，你查哪一层？
2. SSR 内存持续爬升时为什么不该只靠 HPA 加副本？
3. 为什么缩容到 1 个 SSR 副本很危险？

::: details 追问参考答案

**1. 静态站 CPU 很低时 HPA 不扩，用户已经很慢，你查哪一层？**

先看 CDN 命中、源站带宽、TLS 和单连接排队，而不是 Deployment 的 CPU。公网静态应把 hash 资源卸到对象存储。若仍走集群，用 RPS 或连接数扩，并核对 HTML 短缓存是否把所有人打回源站。

**2. SSR 内存持续爬升时为什么不该只靠 HPA 加副本？**

那是泄漏或缓存无上限，新副本会重复同一曲线，费用和故障面一起涨。应设内存限制、堆快照、缓存上限和重启预算，HPA 只吸收流量而不是替你藏泄漏。观测按版本看 RSS，而不是只看平均 CPU。

**3. 为什么缩容到 1 个 SSR 副本很危险？**

一次滚动、一次节点驱逐或一次探针误杀就会零可用。SSR 还有冷启动，只剩 1 副本时尖峰会打穿事件循环。生产至少保留能覆盖一次自愿中断的 `minReplicas`，并用 PDB 防止发布把最后一副本抽走。

:::

---

### D6. Jenkins agent 与容器化构建如何避免「这台机器才能编过」？

::: details 参考答案

#### 基础结论

长期存活的物理 agent 会积累全局 Node、脏 `node_modules` 和残留凭据。前端构建应在声明了 Node / pnpm 版本的容器里跑，工作区用完即弃，制品只从干净安装中产生。

#### 原理深挖

agent 上的全局工具链、旧缓存和上次失败留下的半套依赖，会让冻结锁文件形同虚设。容器化可以用 Kubernetes agent、声明式 `agent { docker { image } }` 或独立的构建器镜像。打镜像时避免不受控的 Docker-in-Docker 权限膨胀，优先 BuildKit / kaniko / buildah 这类不把宿主机 Docker socket 随便挂给任务的路径。见 [Jenkins 教程](/interview/guides/devops/jenkins)。

#### 工程场景

Jenkinsfile 写死镜像 tag 或 digest，而不是 `node:latest`。pnpm store 按键缓存，工作区每 job 隔离。需要 Docker 构建时，用可审计的构建器和推送账号，fork 任务无 socket。本地开发用同一主版本的 Node，CI 以镜像为准。失败必须能在同一镜像里复现，而不是 SSH 上 agent 手改。

#### 反例 / 踩坑

团队共用一台装过十个 Node 的 Jenkins 机、任务互写同一 workspace、把 `/var/run/docker.sock` 挂进不受信 PR、镜像用 `latest` 且无人钉 digest。

#### 资深回答模板

我把 agent 当调度器，把工具链放进钉版本的容器。缓存按锁文件隔离，制品来自冻结安装。谁都不能靠「先登录那台机器装个包」让流水线变绿。

:::

**追问链：**
1. 为什么 `agent any` 再 `nvm use` 对前端团队很脆？
2. 把宿主机 Docker socket 挂进构建容器有什么风险？
3. 容器构建里还要不要 Jenkins 的 `node_modules` stash？

::: details 追问参考答案

**1. 为什么 `agent any` 再 `nvm use` 对前端团队很脆？**

`any` 可能落到工具链不同的机器，`nvm` 依赖 agent 上已有安装和用户目录，并行 job 还会抢全局缓存。应在镜像里钉 Node 与 pnpm，用 corepack 或镜像预装，工作区一次性。复现故障以镜像 digest 为准，而不是「哪台 agent」。

**2. 把宿主机 Docker socket 挂进构建容器有什么风险？**

任务等于拿到宿主机 Docker 守护进程，可逃到 agent、读其他 job 的层和密钥，fork PR 尤其危险。应用无 socket 的构建器，或把构建放到受控的隔离构建集群，并收回不受信任务的挂载。

**3. 容器构建里还要不要 Jenkins 的 `node_modules` stash？**

不要把整棵 `node_modules` 当跨 job 真理。优先缓存 pnpm store，每次冻结安装生成当前工作区。stash 树容易带上 ABI 不匹配和被投毒的目录。若必须加速，键要含锁文件与平台，并允许整键作废。

:::

---

### D7. 蓝绿和金丝雀对前端分别是什么，和只切 Kubernetes Service 有何不同？

::: details 参考答案

#### 基础结论

前端的蓝绿是两套完整静态 / SSR 版本加可瞬间切换的入口；金丝雀是按用户、租户或百分比粘住同一版本。只改 Service 的 backend，管不到 HTML 缓存、CDN 和旧会话。

#### 原理深挖

浏览器会缓存 HTML，Service Worker 会缓存清单，CDN 会把入口缓存在边缘。集群里 10% Pod 变新，并不等于 10% 用户看到新前端。真正的控制面是入口 HTML、资源前缀、Cookie / Header 分群或 feature flag。观测必须按版本、路由和租户切片，停止线看错误、资源 404、Web Vitals 和关键转化，见 [03 工程化](/interview/questions/03-engineering) D4 / D11。

#### 工程场景

蓝绿：上传完整 B 版本资源，预热后把 HTML 或 DNS / CDN 规则切到 B，保留 A 直至观察结束。金丝雀：边缘按登录用户或 Cookie 粘住版本，同一会话不混载。Nuxt 金丝雀还要保证 SSR 与客户端包同一 release。回滚先切入口，不删旧资源。

#### 反例 / 踩坑

用请求级随机分流导致同一页 HTML 与 JS 各一版、只看集群副本比例、切入口后立刻删绿环境、把 feature flag 当成已经完成资源金丝雀。

#### 资深回答模板

我先定义用户粘在哪一版入口，再决定蓝绿硬切还是金丝雀放量。Kubernetes 副本比例只是容量，不是前端版本控制面；停止线和旧资源保留先于切流。

:::

**追问链：**
1. 为什么按请求随机把 5% 流量打到新 Service 对 SPA 不够？
2. 蓝绿切入口后旧环境应留多久？
3. feature flag 全开是否等于金丝雀完成？

::: details 追问参考答案

**1. 为什么按请求随机把 5% 流量打到新 Service 对 SPA 不够？**

一次访问会连续请求 HTML 和多个 hash 文件，随机到不同版本就会混版或 404。必须按用户或会话粘住同一入口和同一资源前缀，并在边缘执行，而不是只看 Pod 比例。验收应用同一 Cookie 连续加载完整页面。

**2. 蓝绿切入口后旧环境应留多久？**

至少覆盖 HTML 缓存、SW 更新和回滚观察窗口，并保留旧 hash 文件。没有最小样本的固定五分钟不构成安全证明。窗口结束前不删 A 版本存储前缀；用真实回滚演练确认旧入口仍可用，并按版本看资源 404 是否归零。

**3. feature flag 全开是否等于金丝雀完成？**

不是。flag 只切逻辑，HTML 与 chunk 可能早已全量。资源缺陷、错误 map 和缓存级联不会因为关旗消失。金丝雀要同时管理入口版本与逻辑开关，关旗救不了已经 404 的旧 chunk。

:::

---

### D8. Nuxt / Node SSR 在 Kubernetes 里如何优雅退出？

::: details 参考答案

#### 基础结论

kubelet 先发 SIGTERM，等 `terminationGracePeriodSeconds`，再 SIGKILL。优雅退出是：先让就绪失败摘流，再停接新连接，等飞行中的 SSR 结束，最后关进程。不是靠「容器没了浏览器会重试」。

#### 原理深挖

Endpoints 更新需要时间，若进程立刻 `process.exit(0)`，仍有请求打到已死 Pod。应在收到 SIGTERM 或 `preStop` 时把 readiness 置失败，短暂等待 kube-proxy / Ingress 摘除，再 `server.close()`。SSR 请求可能还在等下游，超时必须小于宽限期。WebSocket 与长轮询要单独排空。框架侧见 [23 Nuxt](/interview/questions/23-nuxt)。

#### 工程场景

`terminationGracePeriodSeconds` 覆盖摘流等待 + 最长请求 + 关连接。`preStop` 可 sleep 1～几秒，但不能只靠 sleep 不关 server。健康检查与关闭顺序对齐：摘流后 liveness 不要因为「故意不接新请求」而重启。发布时 PDB 保证不会一次抽干。日志打出 shutdown 开始、飞行请求归零、进程退出，便于核对宽限期是否够。

#### 反例 / 踩坑

忽略 SIGTERM、在回调里继续渲染新页面、宽限期 5 秒但 SSR 下游 30 秒、用 liveness 打正在排空的端口导致杀进程、滚动时没有 PDB。

#### 资深回答模板

我把关闭当成协议：SIGTERM 后先摘流，再停监听、排空飞行请求，最后退出。宽限期按真实 p99 设，观测核对没有被 SIGKILL 截断的渲染。Kubernetes 只发信号，排空是应用的责任。

:::

**追问链：**
1. 为什么 `preStop` 里只 `sleep 5` 不够？
2. 关闭期间 liveness 仍打业务端口会怎样？
3. SSR 下游比宽限期更慢时你怎么取舍？

::: details 追问参考答案

**1. 为什么 `preStop` 里只 `sleep 5` 不够？**

sleep 只给 Endpoints 一点传播时间，进程若仍接受新连接，醒来后还会接到请求然后被硬杀。必须同时把就绪失败并 `server.close()`，sleep 只是摘流缓冲。用滚动发布时的 5xx 和未完成渲染日志验收，而不是只看 Pod 变成 Terminating。

**2. 关闭期间 liveness 仍打业务端口会怎样？**

排空时你已不接新请求或主动返回 503，liveness 会判死并 SIGKILL，优雅退出被打断。关闭期应让 liveness 走独立、仍表示「进程活着」的路径，或放宽失败阈值，真正的摘流只由 readiness 负责。

**3. SSR 下游比宽限期更慢时你怎么取舍？**

宽限期不是无限等下游。应对飞行请求设硬超时，超时后取消并记录，避免拖住整个滚动。下游 SLA 应小于宽限期减去摘流时间；经常被 SIGKILL 就要加超时或加宽限期，并修下游，而不是默默加到 5 分钟。

:::
