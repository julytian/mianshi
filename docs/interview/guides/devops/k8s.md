# Kubernetes 前端上线实战指南

> **目标读者：** 约 10 年前端，已经能用 Vite / VitePress 打出静态产物，或可选地跑一套 Nuxt SSR，现在要把「镜像或对象存储」接到公司集群。本文教你看懂 Deployment / Service / Ingress、探针和回滚，**不是** CKA 课：不讲 etcd、调度器、CNI 插件实现，也不背 API 废弃表。
>
> **版本基线（2026-08-27 核对）：** 清单按 **Kubernetes 1.31+ 的常见能力** 来写：`apps/v1` Deployment、`networking.k8s.io/v1` Ingress、`startupProbe` / `readinessProbe` / `livenessProbe`、RollingUpdate。1.31 之后不少集群已经提供 Gateway API，但前端对接最常见的仍是 Ingress；**以你们集群版本和平台文档为准**，不要把本文的 `ingressClassName` 抄进未知集群。镜像怎么打见 [Docker 指南](/interview/guides/devops/docker)，谁推镜像见 [Jenkins 指南](/interview/guides/devops/jenkins)。
>
> **和题库的分工：** 滚动更新与哈希不一致、探针、ConfigMap / Secret、HPA 对 SSR 与静态 Nginx 的差别见 [DevOps 面试题库](/interview/questions/26-devops)；发布与回滚口述见 [工程化面试题库](/interview/questions/03-engineering)。

相关题库：[DevOps 面试题库](/interview/questions/26-devops) · [工程化面试题库](/interview/questions/03-engineering)

## 何时用 / 何时不用

静态站有两条路，先选路再写 YAML。

| 路径 | 适合 | 代价 |
| ---- | ---- | ---- |
| **对象存储 + CDN（更推荐）** | VitePress、Vue SPA、Nuxt `generate` 出来的纯 HTML | 集群不养 Nginx；全球缓存和费用通常更好。要自己管 `index.html` 的短缓存、旧哈希文件的保留时间 |
| **Nginx Deployment** | 必须待在集群里：内网预览、和 API 同 Ingress、过不了公有云 CDN、合规要求流量不出机房 | 你要负责副本、探针、滚动、证书和容量。静态文件没有「算力」，副本加多了也换不来业务吞吐量 |

**用 Kubernetes 的正当理由：** 平台只认集群；有 SSR（Nuxt / Node）；要按分支开预览命名空间；要和集群内 BFF 同域。

**不必上集群的情况：** 对外文档站、活动页、后台静态资源——对象存储 + CDN 更简单。一台 Nginx 虚拟机也能扛中小流量，缺的是多环境复制和自愈，不是「不够 Kubernetes」。

Nuxt SSR **不是**「把静态 Nginx 再复制一份」。它有进程、有内存、有优雅退出，下面单独对比。

## 最小可跑示例

假设镜像已是 [Docker 指南](/interview/guides/devops/docker) 里的 `nginx:alpine` 静态站，容器听 8080，提供 `/healthz`。下面三段可以放在同一目录，用 `kubectl apply -f`；`image`、`ingressClassName`、TLS Secret 名称换成平台给的值。

```yaml
# docs-web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docs-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: docs-web
  # 先起新的、再停旧的，避免滚动窗口里只剩半份 HTML
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    metadata:
      labels:
        app: docs-web
    spec:
      containers:
        - name: nginx
          image: registry.example.com/frontend/docs-web:GIT_COMMIT
          ports:
            - containerPort: 8080
              name: http
          # 下面数字是起步值，不是 SLO；按平台建议再改
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 20
          volumeMounts:
            # 运行时配置：同一镜像，不同环境换这份 JSON
            - name: runtime-config
              mountPath: /usr/share/nginx/html/config.json
              subPath: config.json
              readOnly: true
      volumes:
        - name: runtime-config
          configMap:
            name: docs-web-runtime
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: docs-web-runtime
data:
  config.json: |
    {"apiBase":"/api"}
---
apiVersion: v1
kind: Service
metadata:
  name: docs-web
spec:
  selector:
    app: docs-web
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: docs-web
spec:
  ingressClassName: nginx
  rules:
    - host: docs.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: docs-web
                port:
                  name: http
```

读片段时只记职责：

- **Deployment：** 要几个 Pod、用哪张镜像、坏了怎么换。
- **Service：** 集群内稳定端口，对上标签而不是某一个 Pod IP。
- **Ingress：** 域名怎么进集群。证书、WAF、跨域通常在这一层或更外的网关，不在前端容器里写死。
- **ConfigMap：** 给浏览器的运行时 JSON。密码、cookie 密钥不要放这里。

探针三种，前端够用这一层：

- **readiness：** 没就绪就不要接流量。静态 Nginx 几乎立刻就绪；Nuxt 要等 Node 听端口。
- **liveness：** 进程卡死才重启。不要把「依赖的 API 挂了」写成 liveness，否则会自杀循环。
- **startup：** SSR 冷启动明显慢于 Nginx 时再加，避免启动阶段被 liveness 杀掉。静态站通常可以不加。

`requests` / `limits` 点到为止：静态 Nginx 很小；SSR 按压测给，不要抄上面的 64Mi 去跑 Nuxt。写了 request，调度才知道往哪放；limit 防的是单个 Pod 把节点吃满。具体数字问平台，不要在简历里编「我们 P99 只要 47 ms」。

## 前端场景

### 静态 `pnpm docs:build` / `vite build`

产物是带内容哈希的 JS / CSS，外加必须短缓存的 HTML。

- **更推荐：** CI 把 `dist` 同步到对象存储，CDN 回源。Jenkins 归档那份产物即可，不必为文档站养 Deployment。
- **集群 Nginx：** 每个 Pod **自带完整 `dist`**。滚动时旧 Pod 继续用旧 HTML + 旧哈希，新 Pod 用新的。这比「先覆盖 CDN 再删旧文件」安全。
- 浏览器或 CDN 若把 `index.html` 缓存成「永久」，用户会拿着旧 HTML 去要已经不存在的哈希——这是静态发布最常见的事故，不是 kube-proxy 的问题。

VitePress 有真实路径（`/interview/guides/...html`），`try_files` 仍然适用。Vue history 模式靠回退到 `index.html`，和工程化题库里的 SPA 404 是同一件事。

### Nuxt SSR 对照

把上面的镜像换成 Node 运行镜像，端口改成 3000，探针打应用自己的健康路径（例如 `/api/_health` 或你们约定的路径，以当前 Nuxt 为准）。再补三件静态站没有的事：

1. **优雅退出：** 集群发 `SIGTERM` 后，Nitro / Node 先停接新请求，再等在途请求结束。`terminationGracePeriodSeconds` 要大于应用自己的超时，否则 kubelet 会直接 `SIGKILL`。
2. **不要用静态 Nginx 的资源数字。** SSR 吃 CPU 和内存，副本数按请求和渲染成本加，不是「再加两个 Nginx」。
3. **HPA 对两者含义不同。** 静态 Nginx 很少需要按 CPU 扩；Node SSR 可以按 CPU / 并发扩，但要先有稳定的就绪探针，否则扩出来的 Pod 会接毒打。

纯 SSG 的 Nuxt 走静态那一行，不要为 `.output/public` 再开 Node。

### 构建期注入 vs ConfigMap

| 方式 | 何时用 | 代价 |
| ---- | ------ | ---- |
| 构建期 `VITE_*` / `ARG` | 值真正按环境不同且能公开，接受「一环境一包」 | 换 API 域名就要重打镜像 |
| 运行时 `config.json`（ConfigMap 或入口脚本） | 同一产物进 sit / uat / prod | 应用启动时读 JSON；要处理「文件还没挂上」 |
| Secret | 服务端 / SSR 才需要的密钥 | 不要挂到 Nginx 的可公开目录；不要打进镜像层 |

前端 bundle 里的值都是公开的。ConfigMap 解决的是**少打几种业务镜像**，不是加密。

## 密钥、缓存、回滚、常见失败

### 密钥

- Registry 拉取用 `imagePullSecrets`，不要把机器人密码写进 YAML 仓库。
- 浏览器可下载的路径（`/config.json`、`/assets/*`）只能放公开配置。
- `kubectl describe`、构建日志、错误监控的 breadcrumb 都可能打出环境变量。SSR 的 `NUXT_*` 服务端变量按 Secret 注入，不要 `echo`。
- 误把 `.env` 打进镜像之后，删 Deployment 不够，还要当仓库里的 tag 已泄漏来处理。

### 缓存（浏览器 / CDN / 滚动窗口）

静态哈希是前端的版本号：

- `/assets/index-Ab12cd.js` 可以长缓存。
- `index.html`（以及 VitePress 的页面 HTML）必须短缓存或每次协商。
- **滚动更新本身不会拆散「单个 Pod 内的 HTML 与 JS」。** 危险的是：CDN 或对象存储只保留最新哈希，同时还有客户端拿着旧 HTML。
- 回滚 CDN 时，先保证旧哈希文件还在，再切回旧入口 HTML。只回滚 Deployment、却在存储桶里做了「只留当前版本」，会让旧 Pod 以外的用户 404。

### 回滚

```bash
# 看最近几次 ReplicaSet / 镜像
kubectl rollout history deployment/docs-web
# 回到上一版 Deployment 修订（仍要求旧镜像 tag 还在仓库）
kubectl rollout undo deployment/docs-web
```

更稳的做法是流水线只把 **commit tag** 写进 Deployment，回滚 = 把 image 改回上一个 commit。`:latest` 被覆盖后，`undo` 可能指向同一个坏摘要。

蓝绿 / 金丝雀对前端的含义通常是：**入口 HTML 或 Ingress 权重**，不是给 Nginx 做复杂流量染色。静态资源只要两边哈希都还在，切入口比切集群更像「关旗」。细节见 DevOps 题库。

### 常见失败

| 现象 | 先查什么 |
| ---- | -------- |
| Ingress 出 404 / 502 | Service 标签和 Pod 对不上，或 `targetPort` 仍是 80 而容器听 8080 |
| 刷新 SPA 404 | Ingress 没把所有路径打到同一 Service，或容器里 Nginx 缺 `try_files` |
| 滚动后白屏、控制台一堆 JS 404 | HTML 被长缓存，或对象存储删了旧哈希 |
| 配置改了但页面没变 | 用的是构建期 `VITE_*`，却只改了 ConfigMap；或浏览器缓存了旧 `config.json` |
| 探针一直失败 | `/healthz` 没打进镜像，或 SSR 把依赖 API 写进了 liveness |
| Pod 反复重启 | liveness 太紧，或 SSR 启动超过探测窗口（加 startupProbe，而不是把 interval 调到失去意义） |
| `CrashLoopBackOff` 且日志 Permission denied | 镜像仍以非 root 听 80，或把 ConfigMap 挂到了只读根上的错误路径 |

`kubectl get pod,svc,ingress` → `kubectl describe` → 容器日志，这个顺序比一上来改 YAML 字段快。前端同学把「镜像 tag、HTML 缓存、哈希文件是否还在」说清楚，就比背齐 NetworkPolicy 字段更像做过上线。

## 相关阅读

- [DevOps 面试题库](/interview/questions/26-devops) — Deployment / Service / Ingress、探针、滚动与哈希、CDN 取舍、SSR 优雅退出
- [工程化面试题库](/interview/questions/03-engineering) — 从 MR 到生产、运行时配置、回滚叙事
- [Jenkins 前端交付实战指南](/interview/guides/devops/jenkins)
- [Docker 前端镜像实战指南](/interview/guides/devops/docker)

## 官方资料

- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [配置探针](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [资源 requests 与 limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
