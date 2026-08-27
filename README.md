# 前端面试作战手册

面向 **Vue3 + TypeScript** 主栈、**前端 / Tech Lead**，并覆盖 **Java 全栈偏前** 与 **AI / vibe coding** 协作场景的本地面试知识库。基于 [VitePress](https://vitepress.dev/) 构建。

## 规模与口径

与站点首页、[总览](docs/interview/00-overview.md) 使用同一组数字：

- 9 个能力域
- 26 个题库
- 388 道 Q
- 242 道 D
- 630 道主问题
- 所有主问题和追问均有答案
- 7 / 14 / 30 / 60 天四条路线

630 题是题库容量，按岗位权重抽题，不是必须全部背诵的清单。**长期备战走 60 天，临场走复习模块**（见下方建议学习路径）。

## 在线站点

部署地址（GitHub Pages）：[https://julytian.github.io/mianshi/](https://julytian.github.io/mianshi/)

仓库：[https://github.com/julytian/mianshi](https://github.com/julytian/mianshi)

推送到 `master` / `main` 后，GitHub Actions 会自动构建并发布。

## 快速开始

```bash
pnpm install
pnpm docs:dev
pnpm docs:validate:test
pnpm docs:validate:followups
MIN_TOTAL_QUESTIONS=620 MAX_TOTAL_QUESTIONS=640 EXPECTED_TOTAL_QUESTIONS=630 pnpm docs:check:followups
```

本地预览默认 [http://localhost:5173/mianshi/](http://localhost:5173/mianshi/)。`docs:check:followups` 会先校验 26 个题库与追问答案，再执行构建。

只构建、不跑校验时：

```bash
pnpm docs:build
pnpm docs:preview
```

> 站点配置了 `base: '/mianshi/'`，与 GitHub Pages 项目路径一致；本地 dev 也走该前缀。

## 建议学习路径

1. **第一次使用：** [总览](docs/interview/00-overview.md) → 对照矩阵自测 → [60 天完整主线](docs/interview/plans/60-day.md)
2. **长期备战：** 默认 [60 天完整主线](docs/interview/plans/60-day.md)；不够再裁到 [30 天](docs/interview/plans/30-day.md) / [14 天冲刺版](docs/interview/plans/14-day.md) / [7 天](docs/interview/plans/7-day.md)
3. **临场回炉：** [复习总览](docs/interview/review/00-overview.md)（9 速记 + 12 专题 + 面试前 3 / 7 / 14 天日程）
4. **专项补弱：** 按下方九大能力域分组进入对应题库
5. **面试前 24 小时：** [复习总览](docs/interview/review/00-overview.md) · [故事模板](docs/interview/stories/template.md) · [项目答辩与行为面试](docs/interview/questions/22-project-behavioral.md) · [模拟脚本](docs/interview/mocks/scripts.md) · [反问清单](docs/interview/mocks/reverse-questions.md)
6. **全栈补强：** [NestJS](docs/interview/questions/13-nestjs.md) → [数据库与 Prisma](docs/interview/questions/15-database-prisma.md) → [NestJS + Prisma 教程](docs/interview/guides/backend/nestjs-prisma.md)
7. **上线补强：** [Jenkins 教程](docs/interview/guides/devops/jenkins.md) → [Docker 教程](docs/interview/guides/devops/docker.md) → [Kubernetes 教程](docs/interview/guides/devops/k8s.md)

**长期备战走 60 天，临场走复习模块。** 加练用 [30 天强化版](docs/interview/plans/30-day.md)。

> 源码阅读用 `docs/...` 相对路径；站点路由带 `/mianshi/` 前缀。

## 26 个题库

当前共 630 道主问题（388 道 Q + 242 道 D）。Q 题用于高频覆盖，D 题用于原理、故障治理和架构演进追问。

### Web 与计算机基础

1. [JS / TS](docs/interview/questions/01-js-ts.md) — [线上](https://julytian.github.io/mianshi/interview/questions/01-js-ts)（28Q / 10D / 38）
2. [HTML / CSS / 可访问性](docs/interview/questions/16-html-css-a11y.md) — [线上](https://julytian.github.io/mianshi/interview/questions/16-html-css-a11y)（12Q / 8D / 20）
3. [浏览器与 Web API](docs/interview/questions/17-browser-web-api.md) — [线上](https://julytian.github.io/mianshi/interview/questions/17-browser-web-api)（12Q / 8D / 20）
4. [网络与 Web 安全](docs/interview/questions/18-network-security.md) — [线上](https://julytian.github.io/mianshi/interview/questions/18-network-security)（14Q / 9D / 23）
5. [手写题](docs/interview/questions/10-handwriting.md) — [线上](https://julytian.github.io/mianshi/interview/questions/10-handwriting)（11Q / 5D / 16）

### 框架与数据

6. [Vue3](docs/interview/questions/02-vue3.md) — [线上](https://julytian.github.io/mianshi/interview/questions/02-vue3)（31Q / 14D / 45）
7. [Nuxt](docs/interview/questions/23-nuxt.md) — [线上](https://julytian.github.io/mianshi/interview/questions/23-nuxt)（12Q / 8D / 20）
8. [Vite](docs/interview/questions/24-vite.md) — [线上](https://julytian.github.io/mianshi/interview/questions/24-vite)（12Q / 8D / 20）
9. [Webpack](docs/interview/questions/25-webpack.md) — [线上](https://julytian.github.io/mianshi/interview/questions/25-webpack)（11Q / 7D / 18）

### 工程与质量

7. [工程化](docs/interview/questions/03-engineering.md) — [线上](https://julytian.github.io/mianshi/interview/questions/03-engineering)（20Q / 14D / 34）
8. [性能与用户体验](docs/interview/questions/20-performance-ux.md) — [线上](https://julytian.github.io/mianshi/interview/questions/20-performance-ux)（12Q / 8D / 20）
9. [测试与质量保障](docs/interview/questions/21-testing-quality.md) — [线上](https://julytian.github.io/mianshi/interview/questions/21-testing-quality)（11Q / 7D / 18）

### 后台与业务前端

10. [Ant Design Vue](docs/interview/questions/04-admin-antdv.md) — [线上](https://julytian.github.io/mianshi/interview/questions/04-admin-antdv)（14Q / 8D / 22）
11. [Vant H5](docs/interview/questions/05-h5-vant.md) — [线上](https://julytian.github.io/mianshi/interview/questions/05-h5-vant)（12Q / 8D / 20）

### 移动端与跨平台

12. [uni-app / 小程序](docs/interview/questions/06-uniapp-miniprogram.md) — [线上](https://julytian.github.io/mianshi/interview/questions/06-uniapp-miniprogram)（17Q / 8D / 25）
13. [Hybrid App](docs/interview/questions/19-hybrid-app.md) — [线上](https://julytian.github.io/mianshi/interview/questions/19-hybrid-app)（13Q / 9D / 22）

### 架构与系统设计

14. [前端架构](docs/interview/questions/14-frontend-architecture.md) — [线上](https://julytian.github.io/mianshi/interview/questions/14-frontend-architecture)（15Q / 15D / 30）
15. [前端系统设计](docs/interview/questions/11-frontend-system-design.md) — [线上](https://julytian.github.io/mianshi/interview/questions/11-frontend-system-design)（7Q / 6D / 13）
16. [微前端](docs/interview/questions/12-microfrontend.md) — [线上](https://julytian.github.io/mianshi/interview/questions/12-microfrontend)（19Q / 15D / 34）

### 运维与部署

17. [Jenkins / Docker / k8s](docs/interview/questions/26-devops.md) — [线上](https://julytian.github.io/mianshi/interview/questions/26-devops)（14Q / 8D / 22）

### 全栈、数据与 AI

17. [Java 全栈偏前](docs/interview/questions/07-java-fullstack.md) — [线上](https://julytian.github.io/mianshi/interview/questions/07-java-fullstack)（14Q / 8D / 22）
18. [NestJS](docs/interview/questions/13-nestjs.md) — [线上](https://julytian.github.io/mianshi/interview/questions/13-nestjs)（20Q / 16D / 36）
19. [数据库与 Prisma](docs/interview/questions/15-database-prisma.md) — [线上](https://julytian.github.io/mianshi/interview/questions/15-database-prisma)（17Q / 10D / 27）
20. [AI / vibe coding](docs/interview/questions/09-ai-vibe-coding.md) — [线上](https://julytian.github.io/mianshi/interview/questions/09-ai-vibe-coding)（13Q / 8D / 21）

### 领导力与求职

21. [架构 / Lead](docs/interview/questions/08-architecture-lead.md) — [线上](https://julytian.github.io/mianshi/interview/questions/08-architecture-lead)（17Q / 9D / 26）
22. [项目答辩与行为面试](docs/interview/questions/22-project-behavioral.md) — [线上](https://julytian.github.io/mianshi/interview/questions/22-project-behavioral)（10Q / 8D / 18）

## 指南

AI 实践 5 篇：

- [Cursor 工作流](docs/interview/guides/ai-coding/cursor-workflow.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/cursor-workflow)
- [Cursor Rules](docs/interview/guides/ai-coding/rules.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/rules)
- [Cursor Skills](docs/interview/guides/ai-coding/skills.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/skills)
- [Hooks 与 MCP](docs/interview/guides/ai-coding/hooks-mcp.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/hooks-mcp)
- [Vue 项目实践](docs/interview/guides/ai-coding/vue-project-example.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/vue-project-example)

全栈教程：

- [NestJS + Prisma 教程](docs/interview/guides/backend/nestjs-prisma.md) — [线上](https://julytian.github.io/mianshi/interview/guides/backend/nestjs-prisma)

运维部署教程：

- [Jenkins 前端交付](docs/interview/guides/devops/jenkins.md) — [线上](https://julytian.github.io/mianshi/interview/guides/devops/jenkins)
- [Docker 前端镜像](docs/interview/guides/devops/docker.md) — [线上](https://julytian.github.io/mianshi/interview/guides/devops/docker)
- [Kubernetes 前端上线](docs/interview/guides/devops/k8s.md) — [线上](https://julytian.github.io/mianshi/interview/guides/devops/k8s)

简历 5 篇：

- [资深前端简历指南](docs/interview/resume/senior-frontend-guide.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-guide)
- [资深前端简历模板](docs/interview/resume/senior-frontend-template.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-template)
- [资深前端简历示例](docs/interview/resume/senior-frontend-example.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-example)
- [ATS 检查清单](docs/interview/resume/ats-checklist.md) — [线上](https://julytian.github.io/mianshi/interview/resume/ats-checklist)
- [项目改写检查清单](docs/interview/resume/project-rewrite-checklist.md) — [线上](https://julytian.github.io/mianshi/interview/resume/project-rewrite-checklist)

模拟与故事：

- [故事模板](docs/interview/stories/template.md) — [线上](https://julytian.github.io/mianshi/interview/stories/template)
- [故事示例](docs/interview/stories/examples.md) — [线上](https://julytian.github.io/mianshi/interview/stories/examples)
- [模拟脚本](docs/interview/mocks/scripts.md) — [线上](https://julytian.github.io/mianshi/interview/mocks/scripts)
- [评分表](docs/interview/mocks/scorecard.md) — [线上](https://julytian.github.io/mianshi/interview/mocks/scorecard)
- [反问清单](docs/interview/mocks/reverse-questions.md) — [线上](https://julytian.github.io/mianshi/interview/mocks/reverse-questions)

## 目录说明

```text
docs/
  index.md                 # 首页（定位 + CTA + 路径指引）
  interview/
    00-overview.md         # 总览、能力域矩阵、Java 边界
    plans/                 # 7 / 14 / 30 / 60 天路线
    questions/             # 26 个分域题库（Q / D 分层）
    guides/ai-coding/      # 5 篇 Cursor / AI 实践
    guides/backend/        # NestJS + Prisma 教程
    guides/devops/         # Jenkins / Docker / k8s 教程
    resume/                # 5 篇简历与 ATS 指南
    stories/               # STAR 模板与示例
    mocks/                 # 模拟脚本、评分表、反问清单
  .vitepress/              # VitePress 配置与主题
scripts/                   # 辅助校验脚本
```

## Java 深度边界

面试主身份始终是 **前端 / 前端 Lead**。Java 是差异化，不是第二套八股战场：

| 层级 | 范围 |
| ---- | ---- |
| 主路径 | Spring Boot + MyBatis-Plus + MySQL |
| 按需 | Redis、消息队列（场景级：缓存、异步、防重） |
| 点到为止 | 微服务拆分动机、网关对前端的影响 |
| 明确不做 | JVM 调优、分布式事务深挖、与专职后端拼中间件源码 |

详见总览页「Java 叙事边界」一节。

## 技术栈

- VitePress 1.x + Vue 3
- 本地全文搜索（中文导航与侧栏）
- `docs/superpowers/` 为计划与规格，构建时已排除，不进入站点导航
