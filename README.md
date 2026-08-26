# 前端面试作战手册

面向 **Vue3 + TypeScript** 主栈、**前端 / Tech Lead**，并覆盖 **Java 全栈偏前** 与 **AI / vibe coding** 协作场景的本地面试知识库。基于 [VitePress](https://vitepress.dev/) 构建。

## 在线站点

部署地址（GitHub Pages）：[https://julytian.github.io/mianshi/](https://julytian.github.io/mianshi/)

仓库：[https://github.com/julytian/mianshi](https://github.com/julytian/mianshi)

推送到 `master` / `main` 后，GitHub Actions 会自动构建并发布。

## 快速开始

```bash
pnpm install
pnpm docs:dev        # 本地预览，默认 http://localhost:5173/mianshi/
pnpm docs:validate   # 校验 14 个题库的结构、题号与统计
pnpm docs:validate:test # 运行题库校验器边界自测
pnpm docs:check      # 依次执行 validate 与 build
```

发布前使用与 CI 相同的严格门禁（以下环境变量写法用于 GitHub Linux 与 macOS/Linux Shell；普通本地开发仍直接运行上面的跨平台脚本）：

```bash
pnpm docs:validate:test
MIN_TOTAL_QUESTIONS=380 MAX_TOTAL_QUESTIONS=410 EXPECTED_TOTAL_QUESTIONS=382 pnpm docs:check
```

构建与预览静态站点：

```bash
pnpm docs:build
pnpm docs:preview
```

> 站点配置了 `base: '/mianshi/'`，与 GitHub Pages 项目路径一致；本地 dev 也走该前缀。

## 建议学习路径

1. **总览与侧重点矩阵** → [`docs/interview/00-overview.md`](docs/interview/00-overview.md)  
   （本地：`/mianshi/interview/00-overview`；线上同路径）
2. **14 天主线计划** → [`docs/interview/plans/14-day.md`](docs/interview/plans/14-day.md)  
   （压缩用 7 天，加练用 30 天）
3. **核心题库** → 从 [`docs/interview/questions/02-vue3.md`](docs/interview/questions/02-vue3.md) 开始，再按矩阵补弱项
4. **故事与模拟** → [`docs/interview/stories/template.md`](docs/interview/stories/template.md) → [`docs/interview/mocks/scripts.md`](docs/interview/mocks/scripts.md)

> 源码阅读用 `docs/...` 相对路径；站点路由带 `/mianshi/` 前缀。

## 14 个题库

当前共 382 题（约 400 题）。Q 题用于高频覆盖，D 题用于原理、故障治理和架构演进追问。

1. [JS / TS](docs/interview/questions/01-js-ts.md) — [线上](https://julytian.github.io/mianshi/interview/questions/01-js-ts)
2. [Vue 3](docs/interview/questions/02-vue3.md) — [线上](https://julytian.github.io/mianshi/interview/questions/02-vue3)
3. [工程化](docs/interview/questions/03-engineering.md) — [线上](https://julytian.github.io/mianshi/interview/questions/03-engineering)
4. [Ant Design Vue 中后台](docs/interview/questions/04-admin-antdv.md) — [线上](https://julytian.github.io/mianshi/interview/questions/04-admin-antdv)
5. [H5 / Vant](docs/interview/questions/05-h5-vant.md) — [线上](https://julytian.github.io/mianshi/interview/questions/05-h5-vant)
6. [uni-app / 小程序](docs/interview/questions/06-uniapp-miniprogram.md) — [线上](https://julytian.github.io/mianshi/interview/questions/06-uniapp-miniprogram)
7. [Java 全栈偏前](docs/interview/questions/07-java-fullstack.md) — [线上](https://julytian.github.io/mianshi/interview/questions/07-java-fullstack)
8. [架构 / Lead](docs/interview/questions/08-architecture-lead.md) — [线上](https://julytian.github.io/mianshi/interview/questions/08-architecture-lead)
9. [AI / vibe coding](docs/interview/questions/09-ai-vibe-coding.md) — [线上](https://julytian.github.io/mianshi/interview/questions/09-ai-vibe-coding)
10. [手写题](docs/interview/questions/10-handwriting.md) — [线上](https://julytian.github.io/mianshi/interview/questions/10-handwriting)
11. [前端系统设计](docs/interview/questions/11-frontend-system-design.md) — [线上](https://julytian.github.io/mianshi/interview/questions/11-frontend-system-design)
12. [微前端](docs/interview/questions/12-microfrontend.md) — [线上](https://julytian.github.io/mianshi/interview/questions/12-microfrontend)
13. [NestJS](docs/interview/questions/13-nestjs.md) — [线上](https://julytian.github.io/mianshi/interview/questions/13-nestjs)
14. [前端架构](docs/interview/questions/14-frontend-architecture.md) — [线上](https://julytian.github.io/mianshi/interview/questions/14-frontend-architecture)

## AI 实践与简历

AI 实践 5 篇：

- [Cursor 工作流](docs/interview/guides/ai-coding/cursor-workflow.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/cursor-workflow)
- [Cursor Rules](docs/interview/guides/ai-coding/rules.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/rules)
- [Cursor Skills](docs/interview/guides/ai-coding/skills.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/skills)
- [Hooks 与 MCP](docs/interview/guides/ai-coding/hooks-mcp.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/hooks-mcp)
- [Vue 项目实践](docs/interview/guides/ai-coding/vue-project-example.md) — [线上](https://julytian.github.io/mianshi/interview/guides/ai-coding/vue-project-example)

简历 5 篇：

- [资深前端简历指南](docs/interview/resume/senior-frontend-guide.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-guide)
- [资深前端简历模板](docs/interview/resume/senior-frontend-template.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-template)
- [资深前端简历示例](docs/interview/resume/senior-frontend-example.md) — [线上](https://julytian.github.io/mianshi/interview/resume/senior-frontend-example)
- [ATS 检查清单](docs/interview/resume/ats-checklist.md) — [线上](https://julytian.github.io/mianshi/interview/resume/ats-checklist)
- [项目改写检查清单](docs/interview/resume/project-rewrite-checklist.md) — [线上](https://julytian.github.io/mianshi/interview/resume/project-rewrite-checklist)

## 目录说明

```text
docs/
  index.md                 # 首页（定位 + CTA + 路径指引）
  interview/
    00-overview.md         # 总览、侧重点矩阵、Java 边界
    plans/                 # 7 / 14 / 30 天冲刺计划
    questions/             # 14 个分域题库（Q / D 分层）
    guides/ai-coding/      # 5 篇 Cursor / AI 实践
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
