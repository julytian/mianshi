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

## 目录说明

```text
docs/
  index.md                 # 首页（定位 + CTA + 路径指引）
  interview/
    00-overview.md         # 总览、侧重点矩阵、Java 边界
    plans/                 # 7 / 14 / 30 天冲刺计划
    questions/             # 分域题库（含可折叠参考答案）
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
