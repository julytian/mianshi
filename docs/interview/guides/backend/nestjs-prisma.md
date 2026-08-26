# NestJS + Prisma + MySQL 实战指南

> **目标读者：** 已掌握 TypeScript 与 NestJS 基础，希望把 Prisma 用到真实 BFF / 后端项目中的资深前端或全栈工程师。
>
> **版本基线（2026-08-27 核对）：** 本文锁定 **NestJS 11.x + Prisma ORM 7.x + MySQL 8.0 / 8.4**。NestJS 11 要求 Node.js 20+；Prisma 7 要求 Node.js `^20.19.0`、`^22.12.0` 或 `^24.0.0`，TypeScript 5.4+，本文统一推荐 Node.js 22 LTS。Prisma CLI、`@prisma/client` 和驱动适配器必须锁定同一 major，并在升级时一起验证。
>
> **为什么不是 Prisma 8：** 核对当天，Prisma 8 新工作流页面仍带有 Release Candidate / `@next` 标识，并使用不同的 Contract、Migration 与查询 API。本文所需的 `prisma-client`、`PrismaClient`、`migrate dev/deploy` 和 `$transaction` 属于稳定的 Prisma 7 工作流，不能混抄 Prisma 8 预发布示例。

相关题库：[NestJS 面试题库](/interview/questions/13-nestjs) · [数据库与 Prisma 面试题库](/interview/questions/15-database-prisma)

## 1. 环境与依赖

### 1.1 版本选择

建议先把运行时和包管理策略固定下来：

```json
{
  "engines": {
    "node": ">=22 <23"
  }
}
```

Prisma 7 本身采用 ESM-first 默认值，而 NestJS CLI 默认项目通常以 CommonJS 编译。本文沿用 NestJS 官方 Prisma Recipe 的 CommonJS 方案，在生成器中显式写 `moduleFormat = "cjs"`；因此不要求给 Nest 默认项目增加 `"type": "module"`。如果项目已整体切到原生 ESM，则应同步调整 Nest 构建配置、`package.json` 和生成器格式，不要只改其中一边。

安装依赖：

```bash
pnpm add @nestjs/config @prisma/client@^7 @prisma/adapter-mariadb@^7 \
  class-transformer class-validator dotenv
pnpm add -D prisma@^7 tsx
```

- `prisma` 是 CLI，负责初始化、生成 Client 和迁移。
- `@prisma/client` 提供生成 Client 所需的运行时。
- Prisma 7 的直连必须传入 driver adapter；MySQL 使用官方文档推荐的 `@prisma/adapter-mariadb`。
- `dotenv` 是 Prisma CLI 显式加载 `.env` 的常见方式；Nest 运行时则由 `@nestjs/config` 读取环境变量。

### 1.2 配置来源与边界

配置分为两条路径：

1. **Prisma CLI：** 根目录 `prisma.config.ts` 读取 `DATABASE_URL`，供 `migrate`、`generate`、`db seed` 使用。
2. **NestJS 运行时：** `ConfigModule` 读取数据库连接信息，`PrismaService` 创建 adapter 和 Client。

生产环境应由 Secret Manager 或平台注入环境变量，不提交 `.env`。示例：

```dotenv
DATABASE_URL=mysql://app_user:change-me@127.0.0.1:3306/interview
DB_CONNECTION_LIMIT=10
DB_ACQUIRE_TIMEOUT_MS=10000
DB_CONNECT_TIMEOUT_MS=3000
PRISMA_SLOW_QUERY_MS=200
```

`DATABASE_URL` 同时作为 CLI 与运行时的单一事实来源；其用户名、密码、主机和库名由运行时代码解析后传给 MariaDB adapter。连接池参数属于 Prisma 7 adapter 配置，不再依赖旧版 Prisma URL 参数。

## 2. 初始化 Prisma 和连接 MySQL

初始化：

```bash
pnpm exec prisma init --datasource-provider mysql --output ../src/generated/prisma
```

Prisma 7 使用根目录 `prisma.config.ts` 配置 CLI：

```ts
// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

这里按 Prisma 7 官方的 optional environment variables 指南直接读取 `process.env`。`env('DATABASE_URL')` 会在加载配置时立即抛错，连不需要数据库的 `prisma generate` 也会失败；非空断言 `!` 只告诉 TypeScript 此处接受字符串，不做运行时校验。`generate` / 应用构建不会连接数据库，不应为此向 Docker build arg 注入生产 Secret。真正访问数据库的 `migrate *`、`db *` 和应用运行阶段必须由部署环境注入并校验 `DATABASE_URL`。

Schema 中的数据源只声明数据库类型，URL 不再写在 `schema.prisma`：

```prisma
// prisma/schema.prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "mysql"
}
```

版本敏感点：

- `prisma-client` 是 Prisma 7 新项目的生成器，`output` 必填；旧的 `prisma-client-js` 已弃用。
- Prisma 7 不会自动加载 `.env`，所以 `prisma.config.ts` 显式 `import 'dotenv/config'`。
- 直连数据库时，`new PrismaClient()` 不再足够，必须传 `adapter`；使用 Accelerate 时是另一条初始化路径。
- 不把 Preview flag 当稳定契约。启用 Preview 前必须核对锁定版本、单独测试，并准备移除或回退方案。

## 3. Schema：User、Role 与 Order 关系

下面的模型同时展示租户、显式多对多和一对多：

```prisma
enum OrderStatus {
  PENDING
  PAID
  CANCELLED
}

model Tenant {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  users     User[]
  roles     Role[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        Int        @id @default(autoincrement())
  tenantId  Int
  email     String     @db.VarChar(191)
  name      String     @db.VarChar(100)
  tenant    Tenant     @relation(fields: [tenantId], references: [id])
  roles     UserRole[] @relation("UserRoleUser")
  orders    Order[]    @relation("OrderUser")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@unique([tenantId, email])
  @@unique([tenantId, id])
  @@index([tenantId, createdAt, id])
}

model Role {
  id        Int        @id @default(autoincrement())
  tenantId  Int
  code      String     @db.VarChar(50)
  name      String     @db.VarChar(100)
  tenant    Tenant     @relation(fields: [tenantId], references: [id])
  users     UserRole[] @relation("UserRoleRole")
  createdAt DateTime   @default(now())

  @@unique([tenantId, code])
  @@unique([tenantId, id])
}

model UserRole {
  tenantId Int
  userId   Int
  roleId   Int
  user     User @relation("UserRoleUser", fields: [tenantId, userId], references: [tenantId, id], onDelete: Cascade)
  role     Role @relation("UserRoleRole", fields: [tenantId, roleId], references: [tenantId, id], onDelete: Cascade)

  @@id([tenantId, userId, roleId])
  @@index([tenantId, roleId])
}

model Order {
  id          Int         @id @default(autoincrement())
  tenantId    Int
  userId      Int
  orderNo     String      @db.VarChar(64)
  amountCents Int
  status      OrderStatus @default(PENDING)
  paymentKey  String?     @db.VarChar(64)
  user        User        @relation("OrderUser", fields: [tenantId, userId], references: [tenantId, id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([tenantId, orderNo])
  @@unique([tenantId, paymentKey])
  @@index([tenantId, userId, createdAt, id])
}
```

设计说明：

- 邮箱和订单号都按租户唯一，数据库约束才是并发下的最终兜底。
- `UserRole` 使用显式关联表，便于增加租户键、授权时间、授权人等字段。
- `amountCents` 用最小货币单位，避免 JavaScript 浮点数参与最终财务计算；多币种系统还应增加币种和舍入规则。
- `User` / `Role` 的 `(tenantId, id)` 复合唯一约束是复合外键的引用目标。`UserRole` 的两条关系都复用 `tenantId`，并用显式 relation name 区分；因此数据库会拒绝把不同租户的 User 与 Role 关联。`Order` 也必须用 `(tenantId, userId)` 引用同租户 User，不能只依赖全局 `userId`。
- 复合外键保证持久化关系不跨租户，但不能替代服务层授权。应用仍须从可信身份取得 `tenantId`，在所有查询和写入条件中携带它；数据库约束负责最后一道完整性兜底。
- 索引应来自查询模式；上线前用真实数据量和 `EXPLAIN ANALYZE` 验证，而不是因为字段常用就全部加索引。

## 4. 生成 Client 和迁移

开发环境创建迁移：

```bash
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

Prisma 7 的 `migrate dev`：

- 仅用于开发环境；
- 需要 shadow database，重放迁移历史并检测 drift；
- 生成和应用迁移，但不再自动执行 `prisma generate` 或 Seed；
- 如果提示 reset，会删除开发库数据，必须先确认目标库。

提交以下产物：

```text
prisma/schema.prisma
prisma/migrations/**/migration.sql
prisma.config.ts
```

生成目录 `src/generated/prisma` 可以选择提交，也可以在 `postinstall` / 构建阶段生成；团队必须统一，避免本地类型与部署产物不一致。每次 Schema 或 generator 配置变化后都重新执行：

```bash
pnpm exec prisma generate
```

生产和测试环境只应用已评审迁移：

```bash
pnpm exec prisma migrate deploy
```

`migrate deploy` 不检测 Schema drift、不使用 shadow database、不 reset，也不生成 Client，因此构建流水线必须另跑 `prisma generate`。

## 5. NestJS PrismaModule 与 PrismaService

根模块加载配置：

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
  ],
})
export class AppModule {}
```

把数据库 URL 解析集中在一个函数，避免每个脚本各写一套：

```ts
// src/prisma/database-config.ts
export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function parseMysqlUrl(value: string): DatabaseConfig {
  const url = new URL(value);
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use mysql://');
  }

  const database = decodeURIComponent(url.pathname.slice(1));
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}
```

这个解析器只覆盖基础 `mysql://` URL。生产环境还应按锁定版本的 adapter 类型显式映射 TLS、证书和其他驱动选项，并在启动时校验；不要默默忽略 URL query 中的安全参数。

创建全局模块和单例 Client：

```ts
// src/prisma/prisma.service.ts
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { parseMysqlUrl } from './database-config';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const database = parseMysqlUrl(config.getOrThrow<string>('DATABASE_URL'));
    const adapter = new PrismaMariaDb({
      ...database,
      connectionLimit: Number(config.get('DB_CONNECTION_LIMIT') ?? 10),
      acquireTimeout: Number(config.get('DB_ACQUIRE_TIMEOUT_MS') ?? 10_000),
      connectTimeout: Number(config.get('DB_CONNECT_TIMEOUT_MS') ?? 3_000),
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    const slowMs = Number(config.get('PRISMA_SLOW_QUERY_MS') ?? 200);
    this.$on('query', (event) => {
      if (event.duration >= slowMs) {
        this.logger.warn({
          message: 'slow database query',
          durationMs: event.duration,
          target: event.target,
        });
      }
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
```

```ts
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

关键边界：

- 一个进程通常只创建一个长生命周期 `PrismaClient`，不要每个请求 `new` / `$disconnect`。
- 全局模块是明确的基础设施选择，不代表业务模块可以跳过仓储或应用服务边界。
- `$disconnect()` 放在应用关闭钩子；进程退出时由 Nest 的 shutdown hooks 触发。
- 示例不记录参数、密码、完整错误对象或数据库返回详情。查询参数可能包含隐私数据。

## 6. CRUD、DTO 映射与 select / include

DTO 负责 HTTP 输入校验，Prisma 类型负责数据库调用，两者职责不同：

```ts
// src/users/dto/create-user.dto.ts
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 100)
  name!: string;
}
```

全局开启 ValidationPipe：

```ts
// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(3000);
}

void bootstrap();
```

Service 显式映射 DTO，不把请求对象直接展开到 `data`：

```ts
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: number, dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
      },
      select: publicUserSelect,
    });
  }

  findOne(tenantId: number, id: number) {
    return this.prisma.user.findFirstOrThrow({
      where: { id, tenantId },
      select: publicUserSelect,
    });
  }

  async updateName(tenantId: number, id: number, name: string) {
    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { name },
    });
    if (result.count === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: number, id: number): Promise<void> {
    const result = await this.prisma.user.deleteMany({
      where: { id, tenantId },
    });
    if (result.count === 0) {
      throw new Error('USER_NOT_FOUND');
    }
  }
}
```

`updateMany` / `deleteMany` 允许把 `tenantId` 放入条件，并通过 `count` 判断记录是否存在；如果业务要求返回修改后的行，可在短事务中先校验归属再更新，或像示例一样二次读取。不要为了使用 `update()` 而退化成只按全局 `id` 写入。

`select` 与 `include` 的选择：

```ts
const userWithRoles = await prisma.user.findFirstOrThrow({
  where: { id: userId, tenantId },
  select: {
    id: true,
    email: true,
    roles: {
      select: {
        role: { select: { code: true, name: true } },
      },
    },
  },
});
```

- API 默认使用 `select` 白名单，避免意外返回内部字段。
- `include` 适合确实需要完整基础字段和关系的内部用例，但不要为了省代码把整棵关系树加载出来。
- Prisma Client Validation Error 是调用形状与生成类型不匹配等问题的运行时信号，不能替代 DTO、业务规则和授权校验。

## 7. 游标分页与 N+1

### 7.1 稳定游标分页

按递增主键分页，取 `limit + 1` 判断是否还有下一页：

```ts
type ListUsersQuery = {
  after?: number;
  limit: number;
};

async function listUsers(
  prisma: PrismaService,
  tenantId: number,
  query: ListUsersQuery,
) {
  const take = Math.min(Math.max(query.limit, 1), 100);
  const rows = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { id: 'asc' },
    take: take + 1,
    ...(query.after
      ? {
          cursor: { id: query.after },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const hasNextPage = rows.length > take;
  const items = hasNextPage ? rows.slice(0, take) : rows;
  return {
    items,
    nextCursor: hasNextPage ? items.at(-1)!.id : null,
  };
}
```

如果按 `createdAt` 排序，需要用 `(createdAt, id)` 形成唯一稳定顺序，并在 Schema 建匹配索引和唯一游标。游标必须经过 DTO 转换与范围校验，不能让 `NaN` 或任意字符串进入 Prisma。

### 7.2 避免 N+1

反例：

```ts
const users = await prisma.user.findMany({ where: { tenantId } });
for (const user of users) {
  await prisma.order.findMany({ where: { tenantId, userId: user.id } });
}
```

按场景选择：

1. 用关系 `select` / `include` 一次表达所需数据。
2. 先取用户 ID，再用 `userId: { in: ids }` 批量查询并在内存分组。
3. GraphQL 字段解析器使用请求级 DataLoader 合并同一批 key。
4. 观测每个请求的 SQL 数量与耗时，用数据识别 N+1。

不要默认开启 Preview 的关系加载策略。Preview API、支持数据库和 SQL 形态可能变化；必须在锁定版本中验证，并保留稳定查询方案。

## 8. 批量事务与交互式事务

### 8.1 独立操作：批量 API 或 `$transaction([])`

同模型批量写优先 `createMany`、`updateMany`、`deleteMany`。不同类型且互不依赖的操作可用数组事务：

```ts
await prisma.$transaction([
  prisma.userRole.deleteMany({ where: { tenantId, userId } }),
  prisma.order.updateMany({
    where: { tenantId, userId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  }),
]);
```

数组中的操作作为一个原子单元执行；后一个操作不能读取前一个操作刚生成的 ID。有关联依赖时使用 nested write 或交互式事务。

### 8.2 读—改—写：交互式事务

```ts
import { ConflictException } from '@nestjs/common';
import { Prisma, OrderStatus } from '../generated/prisma/client';

const MAX_TRANSACTION_ATTEMPTS = 3;

class PaymentRetryExhaustedError extends Error {
  readonly code = 'PAYMENT_RETRY_EXHAUSTED';

  constructor() {
    super('支付暂时繁忙，请稍后重试');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function payOrder(
  prisma: PrismaService,
  tenantId: number,
  orderId: number,
  paymentKey: string,
) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const order = await tx.order.findFirstOrThrow({
            where: { id: orderId, tenantId },
          });

          if (
            order.status === OrderStatus.PAID
            && order.paymentKey === paymentKey
          ) {
            return order; // 相同幂等键重放，返回已成功结果。
          }
          if (order.status !== OrderStatus.PENDING) {
            throw new ConflictException('订单状态不允许支付');
          }

          const updated = await tx.order.updateMany({
            where: {
              id: orderId,
              tenantId,
              status: OrderStatus.PENDING,
            },
            data: {
              status: OrderStatus.PAID,
              paymentKey,
            },
          });
          if (updated.count !== 1) {
            throw new ConflictException('订单状态已变化');
          }

          return tx.order.findFirstOrThrow({
            where: { id: orderId, tenantId },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 2_000,
          timeout: 5_000,
        },
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2034';
      if (!retryable) {
        throw error;
      }
      if (attempt === MAX_TRANSACTION_ATTEMPTS) {
        throw new PaymentRetryExhaustedError();
      }

      const exponentialBackoffMs = 50 * 2 ** (attempt - 1);
      const jitterMs = Math.floor(Math.random() * 50);
      await sleep(exponentialBackoffMs + jitterMs);
    }
  }

  throw new PaymentRetryExhaustedError();
}
```

事务原则：

- 回调内所有数据库操作都使用 `tx`，不要偷偷调用外层 `prisma`。
- 事务应短小；不要在回调内等待外部 HTTP、消息服务、文件上传或人工输入。
- 数据库事务无法回滚已经成功的外部 HTTP。需要跨系统一致性时，先在同一数据库事务写业务数据和 Outbox，再由异步发布器重试发送；消费端实现幂等。
- `Serializable` 不能消灭所有业务竞态，仍需唯一幂等键和带状态条件的更新。示例的 `(tenantId, paymentKey)` 唯一约束避免同一支付请求落到不同订单。
- Prisma 用 `P2034` 表示事务写冲突或死锁。必须在事务回调**外部**重试整个 `$transaction`，不能只重试回调中的一段读写；仅对 `P2034` 做有限次数、指数退避加抖动的重试，耗尽后抛稳定领域错误，其他错误原样交给上层映射。

## 9. Prisma 错误到 HTTP 错误契约的映射

Controller 输入先由 ValidationPipe 校验。数据库错误在边界层映射为稳定、最小化的 HTTP 契约：

```ts
// src/prisma/prisma-error.mapper.ts
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException({
          code: 'RESOURCE_CONFLICT',
          message: '资源已存在',
        });
      case 'P2003':
        throw new ConflictException({
          code: 'RELATION_CONFLICT',
          message: '关联资源状态不允许此操作',
        });
      case 'P2025':
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: '资源不存在',
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    // 这是服务端调用契约或生成 Client 漂移，应告警修复，不是用户参数校验器。
    throw new InternalServerErrorException({
      code: 'INTERNAL_ERROR',
      message: '服务暂时不可用',
    });
  }

  throw new InternalServerErrorException({
    code: 'INTERNAL_ERROR',
    message: '服务暂时不可用',
  });
}
```

使用时保留业务上下文，但不把 `error.message`、`meta`、约束名、SQL 或连接信息返回客户端：

```ts
async create(tenantId: number, dto: CreateUserDto) {
  try {
    return await this.prisma.user.create({
      data: { tenantId, email: dto.email, name: dto.name },
      select: publicUserSelect,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}
```

`P2002` 不一定都对应相同业务冲突，应结合当前用例和约束白名单映射；未知错误统一返回安全消息，同时在服务端用关联 ID 记录脱敏日志。不要把数据库错误详情当调试便利直接泄露给调用方。

## 10. 日志、慢查询、连接池与健康检查

### 10.1 日志与慢查询

前面的 `PrismaService` 订阅 query event，`duration` 表示 Client 发出查询到数据库响应的总时长，不等于数据库纯执行时间。生产观测至少包含：

- 路由 / 用例、trace ID、Prisma model 与 operation；
- 查询数量、总耗时、慢查询阈值和错误率；
- 连接获取等待、数据库 CPU / 锁等待、慢查询日志；
- 经脱敏或哈希处理的租户维度。

默认不记录 `event.params`，也不在普通日志打印完整 SQL。需要 SQL 排障时采用受控采样、权限隔离和短期保留，并用 MySQL 慢查询日志及执行计划交叉验证。

Prisma 7 已移除旧的 Client middleware `$use`；跨查询能力使用稳定的 Client Extensions `$extends`。扩展有边界：

- `query` 扩展不覆盖 nested read / write；
- 某些引用外层 Client 并调用 client-level 方法的共享扩展可能脱离当前事务连接；
- 多租户授权不能只押在扩展上，仓储条件、数据库约束和测试仍要兜底。

### 10.2 连接池

`@prisma/adapter-mariadb` 的 Prisma 7 常见默认值为：

- `connectionLimit = 10`；
- `acquireTimeout = 10s`；
- `connectTimeout = 1s`；
- `idleTimeout = 1800s`。

默认值属于版本敏感项，以上线时锁定版本的 adapter / MariaDB driver 文档为准。容量计算使用：

```text
总连接上限 ≈ 每实例 connectionLimit × 最大实例数 + 迁移 / 运维预留
```

不要通过无限增大连接池掩盖慢 SQL。排查池耗尽时同时看：长事务、N+1、锁等待、实例扩容、数据库 `max_connections` 和连接获取超时。

### 10.3 存活与就绪

就绪检查可以调用 `ping()`：

```ts
// src/health/health.controller.ts
import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.ping();
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}
```

存活检查不依赖数据库，避免数据库短故障导致容器重启风暴；就绪失败时由负载均衡摘除实例。平台可以给 readiness HTTP 请求设置超时，但请求超时只限制探针等待时间，**不保证取消已经发给 MySQL 的 SQL**，因此这里不使用会制造取消假象的 `Promise.race`。示例通过 adapter 的 `acquireTimeout` / `connectTimeout` 限制获取连接和建连等待；SQL 执行截止时间要按锁定的 MySQL、MariaDB driver 和代理能力单独设计。响应不返回主机、库名或底层错误。

## 11. Seed、测试数据库与集成测试

### 11.1 可重复 Seed

Prisma 7 只在显式执行 `prisma db seed` 时运行 `prisma.config.ts` 的 seed 命令：

```ts
// prisma/seed.ts
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { parseMysqlUrl } from '../src/prisma/database-config';

const adapter = new PrismaMariaDb(
  parseMysqlUrl(process.env.DATABASE_URL ?? ''),
);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: { name: 'Demo' },
    create: { id: 1, name: 'Demo' },
  });

  await prisma.role.upsert({
    where: {
      tenantId_code: { tenantId: tenant.id, code: 'ADMIN' },
    },
    update: { name: '管理员' },
    create: {
      tenantId: tenant.id,
      code: 'ADMIN',
      name: '管理员',
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
```

执行：

```bash
pnpm exec prisma db seed
```

Seed 应幂等、数据最小化，不创建默认弱密码，不连接生产库。正式业务初始化更适合显式管理命令或迁移，而不是每次启动自动 Seed。

### 11.2 独立测试库

集成测试使用独立 MySQL 容器和专用账号：

```dotenv
# .env.test
DATABASE_URL=mysql://test_user:test_password@127.0.0.1:3307/interview_test
```

测试前应用已提交迁移，而不是使用生产库或共享开发库：

```bash
DATABASE_URL='mysql://test_user:test_password@127.0.0.1:3307/interview_test' \
  pnpm exec prisma migrate deploy
```

这里与 `prisma.config.ts`、`.env.test` 始终使用同一个变量名 `DATABASE_URL`。CI 应把测试库 URL 作为 Secret 注入 `DATABASE_URL`；若团队选择 `dotenv-cli`，也可执行 `dotenv -e .env.test -- pnpm exec prisma migrate deploy`，不再额外维护测试 URL 别名。

### 11.3 可运行的 NestJS HTTP E2E

先提供 Controller 与租户 Guard。真实认证 Guard 应校验 token / session 并写入可信租户上下文；测试会覆盖该 Guard，不读取客户端提交的租户 ID：

```ts
// src/users/users.controller.ts
import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Injectable,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { mapPrismaError } from '../prisma/prisma-error.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

type TenantRequest = Request & {
  tenantId?: number;
  auth?: { tenantId?: number };
};

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const tenantId = request.auth?.tenantId;
    if (
      typeof tenantId !== 'number'
      || !Number.isInteger(tenantId)
      || tenantId <= 0
    ) {
      throw new UnauthorizedException();
    }
    request.tenantId = tenantId;
    return true;
  }
}

@Controller('users')
@UseGuards(TenantGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(
    @Req() request: TenantRequest,
    @Body() dto: CreateUserDto,
  ) {
    try {
      return await this.users.create(request.tenantId!, dto);
    } catch (error) {
      mapPrismaError(error);
    }
  }
}
```

测试模块显式注册 Controller、Service、Guard、配置模块和 `PrismaModule`。`overrideGuard()` 提供测试租户上下文，数据库仍是真实 MySQL：

```bash
pnpm add -D @nestjs/testing supertest @types/supertest
```

```ts
// test/users.e2e-spec.ts
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  TenantGuard,
  UsersController,
} from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('Users API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
      controllers: [UsersController],
      providers: [UsersService, TenantGuard],
    })
      .overrideGuard(TenantGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const httpRequest = context
            .switchToHttp()
            .getRequest<{ tenantId?: number }>();
          httpRequest.tenantId = tenantId;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const tenant = await prisma.tenant.create({
      data: { name: 'e2e-tenant' },
    });
    tenantId = tenant.id;
  });

  afterEach(async () => {
    await prisma.userRole.deleteMany({ where: { tenantId } });
    await prisma.order.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } });
    await app.close();
  });

  it('rejects an invalid email before Prisma', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'not-an-email', name: 'Alice' })
      .expect(400);
  });

  it('maps a tenant-scoped unique conflict to HTTP 409', async () => {
    const body = { email: 'alice@example.com', name: 'Alice' };

    await request(app.getHttpServer())
      .post('/users')
      .send(body)
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send(body)
      .expect(409)
      .expect({
        code: 'RESOURCE_CONFLICT',
        message: '资源已存在',
      });
  });
});
```

测试策略：

- 每个 CI Job 使用独立库名或容器，避免并行污染。
- 清理顺序遵守外键；不要关闭外键检查来掩盖模型问题。
- 事务回滚式测试很快，但应用代码若另取连接或包含提交后行为，会产生假象；关键路径仍需真实提交的集成测试。
- 测试迁移、唯一冲突、授权隔离、分页边界、事务回滚和安全错误响应。

## 12. migrate deploy、灰度、回滚与生产检查

推荐把无数据库 Secret 的构建和需要数据库连接的发布分开：

```bash
# Build Job：不注入生产 DATABASE_URL
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm test

# Release Job：由部署环境注入 DATABASE_URL
pnpm exec prisma migrate deploy
node dist/main.js
```

不要在 `migrate deploy` 前串行执行 `prisma migrate status`：当存在待应用迁移时，`status` 会以退出码 1 结束，反而阻断正常 deploy。发布步骤直接执行 `migrate deploy`；如需状态审计，在 deploy 成功后执行，或放到独立只读 Job 中。`status` 适合报告未应用、失败或迁移历史分歧，不负责应用迁移。

迁移文件应先在与生产同 major 的 MySQL 临时库验证。`migrate deploy` 只应用待执行迁移，不检测生产 drift，也不生成 Client；因此还要有备份、变更审计和数据库侧检查。

### 12.1 Expand-and-contract

破坏性变更拆成至少两次发布：

1. **Expand：** 新增可空列 / 新表 / 新索引，不删除旧结构。
2. **兼容应用：** 新版本双读或兼容读，必要时双写；旧版本仍能运行。
3. **Backfill：** 小批量、可暂停、可重入地回填，监控锁和复制延迟。
4. **切流：** 校验新旧数据一致，逐步让读流量使用新结构。
5. **Contract：** 所有实例升级且观察期结束后，再删旧列、旧索引和兼容代码。

大表加索引、改类型或设 `NOT NULL` 可能长时间持锁。先检查 MySQL 版本支持的在线 DDL 能力，必要时使用专门在线变更工具；Prisma 迁移文件可以人工编辑，但必须评审实际 SQL。

### 12.2 回滚

Prisma Migrate 不等于自动生成安全 down migration。回滚分两类：

- **应用回滚：** Schema 仍向后兼容时，回滚应用版本。
- **数据 / Schema 修复：** 前向修复迁移、恢复备份或经审批执行人工 SQL。

不要删除或修改已经在生产应用的迁移来“回滚”。失败迁移按官方流程使用 `prisma migrate resolve` 标记处理状态，并保留审计。不可逆数据删除前必须验证备份可恢复。

### 12.3 上线检查清单

- CLI、Client、adapter 版本一致，生成产物与 Schema 同步。
- 迁移 SQL 已评审，估算锁时间、空间和回填成本。
- 应用版本与迁移满足向前、向后兼容。
- 数据库账号最小权限；运行账号通常不持有 DDL 权限，迁移账号单独管理。
- 池大小乘实例数未超过数据库容量，超时和告警已配置。
- 就绪检查、慢查询、错误率、连接数、锁等待和回滚触发条件已验证。
- 灰度不是事务：失败时按预案停止扩流、回滚应用或执行前向修复。

## 13. 参数化原生 SQL 与多租户

### 13.1 参数化原生 SQL

优先使用 Prisma 查询 API 或 TypedSQL。必须写原生 SQL 时，使用 tagged template：

```ts
type OrderSummaryRow = {
  userId: number;
  totalCents: unknown;
};

const rows = await prisma.$queryRaw<OrderSummaryRow[]>`
  SELECT \`userId\` AS userId, SUM(\`amountCents\`) AS totalCents
  FROM \`Order\`
  WHERE \`tenantId\` = ${tenantId}
    AND status = ${'PAID'}
  GROUP BY \`userId\`
`;
```

`${tenantId}` 和 `${'PAID'}` 会作为参数传递，不要字符串拼接。表名、列名、排序方向不能作为普通值参数；动态排序使用代码白名单：

```ts
const orderBy = input.sort === 'oldest'
  ? { createdAt: 'asc' as const }
  : { createdAt: 'desc' as const };

return prisma.order.findMany({
  where: { tenantId },
  orderBy,
});
```

避免 `$queryRawUnsafe` / `$executeRawUnsafe`。即使使用占位符，也要确认目标数据库语法；任何把用户输入拼进 SQL 标识符的做法都可能注入。原生查询返回类型由开发者声明，不能证明数据库实际返回形状，边界处仍需运行时校验和测试。

### 13.2 多租户

共享 Schema 模式至少采用四层防线：

1. 鉴权层从可信 token / session 得到 `tenantId`，不信任 body 中的租户 ID。
2. 应用服务和仓储的每个读写都显式带 `tenantId`。
3. 唯一键和常用索引以 `tenantId` 开头，防止跨租户冲突和低效查询。
4. 自动化测试覆盖同 ID、同邮箱、分页、关系查询和原生 SQL 的跨租户越权。

仓储封装示例：

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: number, orderId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: {
        id: true,
        orderNo: true,
        amountCents: true,
        status: true,
      },
    });
  }

  cancelPending(tenantId: number, orderId: number) {
    return this.prisma.order.updateMany({
      where: {
        id: orderId,
        tenantId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });
  }
}
```

Prisma 7 Client Extensions 可创建带租户过滤的扩展 Client，但不能把它当唯一安全边界：query 扩展不覆盖 nested read / write，共享扩展调用外层 client-level 方法还可能脱离事务上下文。显式仓储条件、数据库约束、最小权限和越权测试仍然不可省略。

库级 / Schema 级隔离能提高隔离性，但会增加连接池、迁移编排、监控和成本。选型依据合规、租户规模、噪声隔离、备份恢复和运维能力，不能只比较代码是否方便。

## 版本敏感项速查

- **稳定基线：** NestJS 11.x、Prisma 7.x；Node.js 22 LTS 同时满足两者要求。
- **生成器：** 使用 `prisma-client` + 必填 `output`；`prisma-client-js` 已弃用。
- **连接：** Prisma 7 直连必须传 driver adapter；MySQL 使用 `@prisma/adapter-mariadb`。
- **配置：** CLI 数据源、迁移路径和 seed 命令在 `prisma.config.ts`；`.env` 显式加载。
- **迁移：** `migrate dev` 只用于开发；`migrate deploy` 用于测试 / 预发 / 生产，不生成 Client、不检测 drift。
- **事务：** `$transaction([])` 处理独立操作，交互式事务处理短小的读—改—写；外部 HTTP 不属于数据库事务。
- **扩展：** 旧 `$use` Client middleware 在 Prisma 7 已移除，使用 `$extends`；注意 nested operation 和事务上下文限制。
- **Preview：** 仅在锁定版本验证后启用，不把 Preview flag 写进通用稳定示例。
- **Prisma 8：** 核对当天仍是不同的预发布工作流，不能把其 `db.transaction`、Contract 或新 migration 命令混入本文。

## 官方资料

- [Prisma ORM 7 系统要求](https://www.prisma.io/docs/orm/v7/reference/system-requirements)
- [升级到 Prisma ORM 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Prisma Client 生成器](https://www.prisma.io/docs/orm/prisma-schema/overview/generators)
- [Prisma MySQL Quickstart](https://www.prisma.io/docs/prisma-orm/quickstart/mysql)
- [Prisma Config 参考](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference)
- [开发与生产迁移](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [事务与批量查询](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Client Extensions](https://www.prisma.io/docs/orm/v7/prisma-client/client-extensions)
- [Raw queries](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [NestJS 11 Migration Guide](https://docs.nestjs.com/migration-guide)
