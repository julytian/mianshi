# Jenkins 前端交付实战指南

> **目标读者：** 约 10 年前端，主栈 Vue3 + Vite，要把 VitePress 文档站或 `vite build` 静态产物送进公司已有的 Jenkins，必要时再打镜像。你不是专职 Jenkins 管理员，也不需要把流水线写成「能过 CKA」的样子。
>
> **版本基线（2026-08-27 核对）：** 本文按 **Jenkins 2.x LTS** 的声明式 Pipeline 写。控制器与插件版本以你们实际安装为准；下面用到的 `checkout`、`withCredentials`、`archiveArtifacts`、`docker buildx` 都是 2.x LTS 里的常见能力，不是某个补丁号的私货。Agent 上需要 **Node.js 22 LTS**（或等价容器）以及能跑 **Docker Buildx** 的构建机；推镜像走凭据绑定，不在 `Jenkinsfile` 里写明文 token。
>
> **和题库的分工：** 流水线门禁、回滚叙事、环境变量边界见 [工程化面试题库](/interview/questions/03-engineering)；Jenkins / Docker / Kubernetes 口述题见 [DevOps 面试题库](/interview/questions/26-devops)。镜像分层见 [Docker 指南](/interview/guides/devops/docker)，上集群见 [Kubernetes 指南](/interview/guides/devops/k8s)。

相关题库：[DevOps 面试题库](/interview/questions/26-devops) · [工程化面试题库](/interview/questions/03-engineering)

## 何时用 / 何时不用

**用 Jenkins 的典型理由：**

- 公司只认 Jenkins：Harbor、跳板机、审批、发版窗口都挂在同一套控制器上。
- 前端和 Java / Nest 同仓或同平台，要共用凭证、环境和发布记录。
- 产物必须进内网镜像仓库，再由平台发到 Kubernetes 或虚拟机。

**不要为了「显得专业」强行上 Jenkins：**

- 仓库已经在 GitHub Actions / GitLab CI，且能直连对象存储或 Vercel / Cloudflare Pages。
- 只是个人 VitePress 文档，`pnpm docs:build` 后上传 CDN 就够。
- 你改不了 Jenkins 插件和 Agent 镜像，却想在业务仓里发明一套 Docker-in-Docker。先和平台对齐「JS 在哪装、镜像在哪打」。

一句话：Jenkins 是**公司交付总线**，不是前端的默认构建器。能复用就复用，不要把 `vite` 的事搬进控制器里重写一遍。

## 最小可跑示例

目标链路固定为：

`checkout` → `pnpm install --frozen-lockfile` → lint / test → build → 归档静态产物 / 推镜像。

下面这份声明式 `Jenkinsfile` 把「装依赖和构建」与「打镜像」拆开，避免在 Node 容器里再套一层特权 Docker。脚本里只有占位名，密钥全部来自 Jenkins Credentials。

```groovy
// Jenkinsfile
// 声明式流水线：先在 Node 容器里出静态产物，再在带 Buildx 的 Agent 上推镜像。
pipeline {
  agent none

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    // 公开信息可以写死或用任务参数；密钥绝不写在这里
    REGISTRY = 'registry.example.com'
    IMAGE    = "${REGISTRY}/frontend/docs-web"
    COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
  }

  stages {
    stage('Checkout & quality gate') {
      agent {
        docker {
          image 'node:22-bookworm'
          reuseNode true
        }
      }
      stages {
        stage('Checkout') {
          steps {
            checkout scm
          }
        }

        stage('Install') {
          steps {
            sh '''
              set -euo pipefail
              corepack enable
              # store 放工作区，方便 Agent 挂缓存卷；不要提交 .pnpm-store
              pnpm config set store-dir "${WORKSPACE}/.pnpm-store"
              pnpm install --frozen-lockfile
            '''
          }
        }

        stage('Lint & Test') {
          steps {
            sh '''
              set -euo pipefail
              pnpm lint
              pnpm test -- --run
            '''
          }
        }

        stage('Build') {
          steps {
            // 只有「允许进浏览器」的公开值才出现在构建环境里
            withCredentials([
              string(credentialsId: 'frontend-public-api-base', variable: 'VITE_API_BASE')
            ]) {
              sh '''
                set -euo pipefail
                export VITE_API_BASE
                # 文档站用 docs:build；业务 SPA 改成 pnpm build
                pnpm docs:build
              '''
            }
          }
        }

        stage('Archive') {
          steps {
            // 指纹便于对照「这次构建对应哪份 dist」
            archiveArtifacts artifacts: 'docs/.vitepress/dist/**', fingerprint: true
          }
        }
      }
    }

    stage('Push image') {
      agent { label 'docker-buildx' }
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'harbor-robot',
            usernameVariable: 'REG_USER',
            passwordVariable: 'REG_PASS'
          )
        ]) {
          sh '''
            set -euo pipefail
            echo "${REG_PASS}" | docker login "${REGISTRY}" -u "${REG_USER}" --password-stdin
            docker buildx build \
              --platform linux/amd64 \
              --tag "${IMAGE}:${GIT_COMMIT}" \
              --tag "${IMAGE}:${BUILD_NUMBER}" \
              --push \
              .
          '''
        }
      }
    }
  }
}
```

读这段时抓住三件事：

1. **质量门在推镜像之前。** lint / test / build 失败，后面的 `docker buildx --push` 根本不该发生。
2. **镜像标签用 Git commit 和构建号，不要只推 `:latest`。** 回滚靠「上一份仍在仓库里的 tag」，不是靠覆盖同一个名字。
3. **`withCredentials` 是绑定，不是把 token 写进仓库。** 登录必须走 `--password-stdin`，避免密码出现在 `ps` 或构建日志里。

`VITE_API_BASE` 这类值本身是公开的，也可以改成任务参数；示例把它放进 Credentials，只是为了演示「构建期注入也不进 `Jenkinsfile`」。真正的 Registry 密码、机器人账号、上传 Source Map 的 token，必须走凭据。

## 前端场景

同一条流水线，按产物形状换命令和归档路径，不要复制三份 Jenkins 任务。

| 产物 | 构建命令 | 归档什么 | 推什么镜像 |
| ---- | -------- | -------- | ---------- |
| VitePress 文档站 | `pnpm docs:build` | `docs/.vitepress/dist/**` | `nginx:alpine` 只拷 HTML / 资源，见 [Docker 指南](/interview/guides/devops/docker) |
| Vue3 SPA（`vite build`） | `pnpm build` | `dist/**` | 同样走 Nginx 静态镜像 |
| Nuxt SSR（对比） | `pnpm build` | 通常不把 `.output` 当 CDN 包 | 推 **Node 运行镜像**，入口是 `.output/server/index.mjs` |

静态站和 SSR 不要共用「归档 dist 再丢给 Nginx」这条假设。Nuxt 的 Node 进程要健康检查、优雅退出和资源上限，这些在 [Kubernetes 指南](/interview/guides/devops/k8s) 里展开；Jenkins 侧只负责：**同一套门禁，不同的镜像目标**。

预览环境和生产建议共用这份 `Jenkinsfile`，用分支或参数区分 `VITE_*` / 运行时 `config.json`，不要为 `sit`、`uat`、`prod` 各维护一份脚本。构建期变量一旦打进 bundle 就改不了，多环境同包请改运行时配置，细节见工程化题库的环境变量题。

## 密钥、缓存、回滚、常见失败

### 密钥

- Jenkins Credentials 里建机器人账号，`Jenkinsfile` 只写 `credentialsId`。
- 禁止 `docker login -u admin -p SuperSecret`，禁止 `curl -H "Authorization: Bearer xxxxx"`。
- 构建日志当泄漏面：`set -x`、错误重试打印环境变量、把 `.env` `cat` 出来，都会把绑定值写进 Console Output。
- Source Map 若要上传错误监控，用单独凭据和单独 stage；**不要把 `.map` 打进生产镜像**，也不要归档到可被匿名下载的 Artifact 服务器。
- 前端没有「藏在 bundle 里的服务端秘密」。能进 `VITE_` 的都默认公开。

### 缓存

前端 CI 最贵的是 `pnpm install`，不是 `vite build` 本身。

- 把 `pnpm` store 固定到 `${WORKSPACE}/.pnpm-store`（或 Agent 上的命名卷），**缓存键跟 `pnpm-lock.yaml` 走**。lockfile 变了必须让 store 失效或允许增量补齐，不能假设「昨天的 `node_modules` 还能用」。
- 用 `pnpm install --frozen-lockfile`，不要在 CI 里 `pnpm install` 再把新 lockfile 提交回来。
- 本地 pnpm、CI 却 `npm ci`，等于没锁。工程化题库里这条是高频踩坑。
- Docker Buildx 的层缓存和 Jenkins 工作区缓存是两件事：JS 依赖缓存在 Agent，镜像层缓存在 Buildx；不要指望「上次的容器没删」当缓存策略。

若控制器装了 Pipeline Cache 一类插件，按插件文档把 `pnpm-lock.yaml` 设成 validity file。没插件时，保留带 store 的持久工作区或专用构建 Pod 即可，不必为了缓存再写一套自研脚本。

### 回滚

- **镜像回滚：** 集群把 Deployment 的 image 指回上一个 `${GIT_COMMIT}`。前提是 Harbor 没把旧 tag 当垃圾清掉。
- **静态 CDN 回滚：** 回切 `index.html`（或入口 HTML），并保证旧 HTML 引用的哈希文件还在。只回滚容器、却在对象存储里删了上一版 `assets/*.js`，用户会拿到新入口对不上的 404。
- **不要用「再跑一次流水线、把 latest 覆盖回去」当唯一手段。** `:latest` 是便利指针，不是版本。
- 发布记录写清：构建号、commit、镜像 tag、静态入口地址。面试口述这条比背插件名有用。

### 常见失败

| 现象 | 先查什么 |
| ---- | -------- |
| `ERR_PNPM_OUTDATED_LOCKFILE` | 有人改了 `package.json` 没更新 lockfile，或本地和 CI 的 pnpm 大版本不一致 |
| `corepack` 拉不到 pnpm | Agent 出不了网，或公司要镜像源；把 Corepack / pnpm 打进自建 Node 镜像比每次现场下更稳 |
| lint 过了、build 爆 | 只把 `vue-tsc` / 环境变量检查放在本地 husky，CI 没跑同一条 `pnpm build` |
| `docker: command not found` | Node 容器里没有 Docker；把「打镜像」挪到 `docker-buildx` 标签，而不是在业务脚本里装 Docker |
| 推镜像 401 | 凭据 ID 写错、机器人没有项目权限，或登录没用 stdin 导致密码被截断 |
| 构建绿、线上仍是旧站 | 只推了镜像没滚动 Deployment，或 CDN 把 `index.html` 长缓存了 |
| Console 里出现 token | 某条 `sh` 打印了环境变量，或错误监控上传脚本把 header 打进日志 |

失败时先看**退出码和是哪一阶段红**，再翻插件。门禁被跳过（「先发吧，回头补测试」）比插件版本不对更常见。

## 相关阅读

- [DevOps 面试题库](/interview/questions/26-devops) — CI 与 CD、声明式 Jenkinsfile、凭据、Agent 与容器化构建
- [工程化面试题库](/interview/questions/03-engineering) — 环境变量、Docker + Nginx 链路、从 MR 到生产的口述
- [Docker 前端镜像实战指南](/interview/guides/devops/docker)
- [Kubernetes 前端上线实战指南](/interview/guides/devops/k8s)

## 官方资料

- [Jenkins Pipeline 语法](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Credentials Binding](https://www.jenkins.io/doc/pipeline/steps/credentials-binding/)
- [Docker Buildx](https://docs.docker.com/build/buildx/)
- [pnpm CI 安装](https://pnpm.io/continuous-integration)
