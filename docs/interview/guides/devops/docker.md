# Docker 前端镜像实战指南

> **目标读者：** 约 10 年前端，要把 Vue3 / Vite 的 `vite build` 产物或 VitePress 的 `pnpm docs:build` 打成可部署镜像；Nuxt SSR 只作为对照，说明「多一个 Node 进程」之后镜像形状为什么变了。你要的是能审查的 Dockerfile，不是把宿主机当容器用。
>
> **版本基线（2026-08-27 核对）：** 构建侧按 **Docker Buildx**（Dockerfile 1.7 语法、cache mount、`--push`）来写。运行侧 VitePress / SPA 用 **`nginx:alpine`**；Node 基础镜像取 **22 Bookworm slim**。具体 tag（例如 `nginx:1.27-alpine`）以你们镜像仓库允许的版本为准，本文不把某个补丁号写成合同。Jenkins 里谁来执行 `docker buildx` 见 [Jenkins 指南](/interview/guides/devops/jenkins)。
>
> **和题库的分工：** 多阶段、非 root、健康检查口述见 [DevOps 面试题库](/interview/questions/26-devops)；「够用且干净」的 Docker + Nginx 链路见 [工程化面试题库](/interview/questions/03-engineering)。上集群与 CDN 取舍见 [Kubernetes 指南](/interview/guides/devops/k8s)。

相关题库：[DevOps 面试题库](/interview/questions/26-devops) · [工程化面试题库](/interview/questions/03-engineering)

## 何时用 / 何时不用

**值得打镜像的情况：**

- 运行环境必须进 Kubernetes、公司虚拟机或测试命名空间，平台只收镜像。
- 要冻结 Nginx / Node 的版本和配置，避免「这台机器上的 nginx.conf 和那台不一样」。
- 预览环境按分支起一份同样的运行时。

**可以不打镜像的情况：**

- VitePress / 营销静态站直接上传对象存储 + CDN。HTML 和带哈希的 JS / CSS 不需要在集群里占一个 Nginx Deployment。
- Nuxt 已经走 Vercel / Cloudflare 一类平台，由平台跑 Nitro，你不必再包一层 Node 镜像。
- 本地联调。**不要把 `vite` / `nuxt dev` 装进生产镜像**，也不要在容器里跑开发服务器冒充生产。

镜像解决的是**可复现的运行时**，不是「把前端变后端」。静态文件没有进程状态，能走 CDN 就优先走 CDN。

## 最小可跑示例

原则只有四条：

1. **多阶段。** 构建阶段用 Node + pnpm；最终阶段只拷运行产物。
2. **最终阶段不要 Node 工具链、不要 `node_modules`、不要源码。**
3. **非 root。** 监听 8080，不碰 80。
4. **`.dockerignore` 先写，再写 `COPY . .`。** 否则 `.env`、`.git`、本地 `dist` 会进构建上下文。

### `.dockerignore`

```text
# 不进构建上下文：减小上传量，也避免误 COPY
.git
.github
.idea
.vscode
node_modules
dist
docs/.vitepress/dist
.output
.nuxt
coverage
**/*.map

# 密钥与本地覆盖；构建期公开变量用 ARG / CI 注入
.env
.env.*
!.env.example

# 与运行无关的仓库噪音
*.md
!README.md
.DS_Store
```

`!.env.example` 只为了文档；**不要把真实 `.env` 拷进任何阶段。**

### VitePress / Vue SPA：多阶段 + `nginx:alpine`

文档站默认 `pnpm docs:build`，产物在 `docs/.vitepress/dist`。业务 SPA 把构建命令改成 `pnpm build`，把拷贝路径改成 `/app/dist` 即可，Nginx 阶段不用换。

```dockerfile
# syntax=docker/dockerfile:1.7

# ----- 阶段 1：装依赖（利用 lockfile 与 Buildx 缓存）-----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# store 缓存在 Buildx 里，不写进镜像层
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ----- 阶段 2：出静态产物 -----
FROM deps AS build
WORKDIR /app
COPY . .
# 只接受「可以进浏览器」的公开值；没有默认值，避免静默打出错误环境
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm docs:build \
 && find docs/.vitepress/dist -name '*.map' -delete

# ----- 阶段 3：只跑 Nginx，只拷 dist -----
FROM nginx:1.27-alpine AS runtime
# 官方 alpine 默认听 80；改成 8080 后才能丢掉 root
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/docs/.vitepress/dist /usr/share/nginx/html
# 写入权限只留给构建时的 COPY；运行用户只读
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chmod -R a-w /usr/share/nginx/html
USER nginx
EXPOSE 8080
```

对应的 `deploy/nginx.conf`：

```nginx
worker_processes auto;
error_log /dev/stderr warn;
pid /tmp/nginx.pid;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  sendfile      on;
  access_log    /dev/stdout;

  server {
    listen 8080;
    server_name _;
    root  /usr/share/nginx/html;
    index index.html;

    # 给探针用；不要和业务 404 混在一起
    location = /healthz {
      access_log off;
      add_header Content-Type text/plain;
      return 200 "ok\n";
    }

    # 带哈希的资源可以长缓存；HTML 必须每次协商
    location /assets/ {
      add_header Cache-Control "public, max-age=31536000, immutable";
      try_files $uri =404;
    }

    location / {
      add_header Cache-Control "public, max-age=0, must-revalidate";
      try_files $uri $uri/ /index.html;
    }
  }
}
```

构建：

```bash
# 在仓库根目录；不要把生产 .env 放在上下文里
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE="https://api.example.com" \
  --tag registry.example.com/frontend/docs-web:local \
  --load \
  .
```

最终镜像里应该能看到 HTML / JS / CSS / 字体，**看不到** `package.json`、`node_modules`、`.map`、`.env`。用 `docker history` 或再开一个临时容器 `ls` 一眼即可，不必背「缩小了百分之多少」。

### Nuxt SSR 对照：最终阶段是 Node，不是 Nginx

Nuxt 4 生产构建（Nitro）的可运行目录是 `.output`。最终阶段只拷这份输出，用非 root 跑 `node`。

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm build \
 && find .output -name '*.map' -delete

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
RUN useradd --system --uid 10001 --create-home nuxt
COPY --from=build --chown=10001:10001 /app/.output /app/.output
USER 10001
EXPOSE 3000
# Nitro 默认入口；以你当前 Nuxt 大版本的 .output 布局为准
CMD ["node", ".output/server/index.mjs"]
```

和静态站的差别（面试够用）：

- 静态站：进程是 Nginx，崩溃面小，副本之间无会话。
- SSR：进程是 Node，要处理 `SIGTERM`、在途请求和内存。镜像里仍然**不要**带源码和 devDependency。
- 两边都删 `.map`。Source Map 留给 CI 上传错误监控，不给匿名用户下载。

## 前端场景

| 场景 | 构建命令 | 最终阶段拷什么 | 典型运行 |
| ---- | -------- | -------------- | -------- |
| VitePress | `pnpm docs:build` | `docs/.vitepress/dist` | `nginx:alpine` 听 8080 |
| Vue3 SPA | `pnpm build` | `dist` | 同上；`try_files` 兜 history 路由 |
| Nuxt SSR | `pnpm build` | `.output` | `node .output/server/index.mjs` |
| Nuxt 纯 SSG | `pnpm generate` | `.output/public` | 可退回 Nginx / CDN，不必上 Node |

`VITE_*` 在 `vite build` 时被替换进 bundle，换环境就要重打或改用运行时 `config.json`。SSR 可以把真正的密钥留在 Pod 的环境变量里，但**那些值不能写进 Dockerfile 的 `ENV` 明文，也不能 `COPY .env`**。

同域反代 `/api` 可以写在 Nginx 里，但生产更常见的是 Ingress / 网关做。镜像里写死上游主机，预发和生产就要各打一包，通常不划算。

## 密钥、缓存、回滚、常见失败

### 密钥

- `.dockerignore` 排除 `.env`、`.env.local`、`.env.production`。有人「为了方便」`COPY .env.production`，等于把生产地址和误放进去的 token 写进层，谁拉镜像谁能挖出来。
- `ARG` / `ENV` 只放公开的 `VITE_*`。Registry 账号、Sentry token、私钥走 CI 的 `withCredentials` 或运行时 Secret。
- 构建机上的 `docker login` 用 stdin，见 Jenkins 指南。不要把 `~/.docker/config.json` 打进镜像。
- 只读文件系统能开就开（静态 Nginx 很适合）。需要写 `/tmp` 时单独挂 emptyDir，不要为了省事让整个根可写。

### 缓存

- **Buildx cache mount** 给 pnpm store：依赖层命中时，不必每次从 registry 拉包。
- **先 COPY lockfile 再 `pnpm install`，最后才 `COPY . .`。** 源码变、lockfile 不变，安装层可以复用。
- 不要把整个 `node_modules` 从开发机 `COPY` 进镜像，平台和可选依赖会对不上。
- `latest` 基础镜像每次构建都可能漂。生产锁定 `node:22-bookworm-slim` 和允许的 `nginx:*-alpine` digest，由专人升级。

### 回滚

- 镜像按 Git commit 打 tag，集群回滚就是改回旧 tag。
- 静态资源若同时还在 CDN：旧 HTML 引用的哈希文件必须还在。镜像回滚了、对象存储却只留新哈希，会 404。
- 不要用「同一 tag 覆盖推送」当发布。覆盖之后，你回滚的名字可能已经指向坏包。

### 常见失败

| 现象 | 先查什么 |
| ---- | -------- |
| 最终镜像几百 MB | 最终 `FROM` 仍是 Node 构建镜像，或把 `node_modules` 拷进去了 |
| 容器起不来、Permission denied | 仍监听 80，或 `USER` 切走后日志目录不可写（pid 放到 `/tmp`） |
| SPA 刷新 404 | 缺 `try_files $uri $uri/ /index.html` |
| 线上能打开 `.map` 或 `.env` | `.dockerignore` / `find … -delete` 没生效，或把整个仓库 `COPY` 进了 runtime |
| 构建要密码才能过 | 某条 `RUN` 读了 `.npmrc` 里的明文 token；改成 Buildx secret mount 或 CI 注入 |
| 本地能跑、镜像里路由全 404 | `base` / VitePress `base` 与 Nginx `root` 不一致，或拷错了 `dist` 目录 |
| Nuxt 镜像立刻退出 | `CMD` 指错入口，或把 SSR 镜像当成 Nginx 在用 |

检查清单（发布前看一眼即可）：

- 运行用户不是 root
- `docker run --rm <image> ls` 看不到 `.map`、`.env`、`src`
- `/healthz` 返回 200
- 带哈希的路径长缓存，HTML 不长缓存

## 相关阅读

- [DevOps 面试题库](/interview/questions/26-devops) — 分层、多阶段、非 root、误把 `.map` 打进镜像
- [工程化面试题库](/interview/questions/03-engineering) — Docker + Nginx 口述、环境变量边界
- [Jenkins 前端交付实战指南](/interview/guides/devops/jenkins)
- [Kubernetes 前端上线实战指南](/interview/guides/devops/k8s)

## 官方资料

- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [Docker Buildx](https://docs.docker.com/build/buildx/)
- [.dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files)
- [nginx 非特权镜像说明](https://github.com/nginx/docker-nginx/blob/master/README.md)
- [Nuxt 部署总览](https://nuxt.com/docs/getting-started/deployment)
