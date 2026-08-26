# NestJS 面试题库

> **怎么用：** 先盖住答案，按 **机制 → 请求链路 → 数据与安全 → 生产运维** 自己口述 2～3 分钟，再点开 `参考答案` 对照补洞。追问用来模拟面试官加压；踩坑是实战里最容易翻车的点。中英文术语之间请习惯留空格，口述时也建议如此。

**编号规则：** 普通题使用 `Q1`、`Q2`……深层题使用 `D1`、`D2`……按章节目录顺序连续编号；D 题嵌入对应主题章节，不设独立「深层题」章节。

## 适合岗位 / 定位

面向 **全栈偏前** 与 **Vue3 + BFF 联调** 场景。面试主叙事仍以前端 / 全栈偏前为主——能讲清 NestJS 机制、鉴权契约与生产工程要点，但**不伪装专职 Node.js 后端专家**。表达保持 Node.js / TypeScript 语境，不机械套用 Spring 概念；必要时与 [Java 全栈偏前](/interview/questions/07-java-fullstack) 对照切换复习重点。

## 题量目标

| 类型 | 数量 |
| ---- | ---- |
| 普通题 | 17–22 道 |
| 深层题 | 15–18 道 |
| 合计 | 35–37 道 |

## 后续章节目录

1. **核心机制** — Module、Controller、Provider、依赖注入与模块可见性
2. **请求链路** — Middleware、Pipe、Guard、Interceptor、Exception Filter 执行顺序与职责
3. **数据与鉴权** — DTO / Validation、TypeORM / Prisma、JWT、RBAC / ABAC 与 Vue3 联调契约
4. **生产工程** — 配置、日志、测试、部署、限流、幂等与优雅停机
5. **高级架构** — 微服务 Transport、事件驱动、CQRS、DDD 与模块化单体取舍
6. **源码机制与并发治理** — Decorator / Metadata、容器扫描、动态模块、事件循环阻塞与 Worker / Queue 选型
