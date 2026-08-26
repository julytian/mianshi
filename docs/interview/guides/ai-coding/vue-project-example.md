# Vue 3 后台项目：从复杂列表到构建验证

> 本文是可复制的提示词与结构示例，不会自动创建这些真实项目文件。Cursor 功能描述以 **2026-08** 为基线；实施前请核对 [Cursor 官方文档](https://cursor.com/docs)。

示例目标：在 Vue 3 + TypeScript + Pinia + Vue Router + Ant Design Vue 项目中实现「用户管理」复杂列表页，包含筛选、分页、权限、编辑表单、错误处理和测试。

## 建议目录

```text
admin-web/
├── .cursor/
│   ├── rules/
│   │   ├── vue-sfc.mdc
│   │   ├── pinia-router.mdc
│   │   └── antdv-admin.mdc
│   └── skills/
│       ├── build-admin-crud/
│       │   ├── SKILL.md
│       │   └── references/api-contract.md
│       └── review-frontend-change/
│           └── SKILL.md
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── users.ts
│   ├── components/
│   │   └── AppErrorState.vue
│   ├── features/users/
│   │   ├── api/types.ts
│   │   ├── components/UserFilterForm.vue
│   │   ├── components/UserTable.vue
│   │   ├── components/UserEditDrawer.vue
│   │   ├── composables/useUserList.ts
│   │   └── tests/
│   │       ├── useUserList.test.ts
│   │       └── UserManagementView.test.ts
│   ├── layouts/AdminLayout.vue
│   ├── router/
│   │   ├── index.ts
│   │   └── meta.d.ts
│   ├── stores/
│   │   └── auth.ts
│   ├── views/users/UserManagementView.vue
│   ├── App.vue
│   └── main.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

页面组件只负责组合。筛选表单拥有输入交互，表格只渲染数据并上抛排序/分页/操作事件，抽屉负责编辑契约，`useUserList` 负责请求状态与竞态处理。

## Rules 与 Skills 怎么分工

Rules 放稳定且按文件持续生效的约定：

- `.vue` 统一 `<script setup lang="ts">`；
- Pinia 解构使用 `storeToRefs`；
- 路由 meta 权限类型；
- Ant Design Vue 表格、表单和错误态基线。

Skills 放完整的按需流程：

- `/build-admin-crud`：契约核对、测试优先、分步实现和验证；
- `/review-frontend-change`：独立审查 diff；
- 性能诊断、发布检查等不必每次进入上下文的专业步骤。

Rule 或 Skill 都不能代替服务端鉴权、Hook、CI 和人工审批。
通用职责和验收项统一引用 [Cursor 前端 AI 编程工作流](./cursor-workflow#职责矩阵与统一质量基线)，本篇只保留用户管理场景的增量检查。

## 先固定 API 契约

不要根据 UI 或函数名臆造 API。让 Agent 从 OpenAPI、现有请求代码或后端确认结果中建立类型。下面只是一份可替换模板：

```ts
export type UserStatus = 'active' | 'disabled'

export interface UserListQuery {
  keyword?: string
  status?: UserStatus
  departmentId?: string
  page: number
  pageSize: number
  sortBy?: 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface UserSummary {
  id: string
  name: string
  email: string
  departmentName: string
  status: UserStatus
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UpdateUserInput {
  name: string
  departmentId: string
  status: UserStatus
}

export interface ApiError {
  code: string
  message: string
  fieldErrors?: Record<string, string>
  requestId?: string
}
```

确认以下问题后才能编码：

- 分页从 `0` 还是 `1` 开始；
- 排序字段和方向的真实名称；
- 空字符串应省略还是原样传递；
- 响应是否有统一包裹；
- `403`、校验错误、冲突和限流如何表示；
- 更新是否需要版本号或 ETag；
- 列表查询能否取消，写操作是否支持幂等键。

## 提示词链

每轮只执行一个阶段。把示例路径替换为真实路径，不存在的文件不要伪造 `@` 引用。

### 第 1 轮：调查

```text
先不要改代码。搜索现有列表页、a-table、a-form、请求封装、权限指令、
路由 meta 和测试命令。已知文件请优先阅读 @package.json、@src/router/、
@src/stores/auth.ts。输出：
1. 可复用模式及文件位置；
2. 用户列表 API 的证据与未知项；
3. 允许修改的最小文件集合；
4. 验收标准和风险。
缺失契约时提问，不得臆造。
```

### 第 2 轮：设计

```text
基于调查结果设计用户管理页，不写代码。给出页面容器、筛选表单、表格、
编辑抽屉和 useUserList 的单一职责，以及 Props/Emits、API DTO、URL 查询参数、
Pinia 权限状态的数据流。说明加载、空态、失败、取消请求和重复提交。
```

### 第 3 轮：计划

```text
把设计拆成可独立验证的小步骤：API 类型与客户端、列表 composable、筛选与 URL、
表格、编辑表单、权限、错误处理、测试、完整验证。每步注明修改文件、先写的测试、
验证命令和回滚点。不要修改无关文件或升级依赖。
```

### 第 4 轮：API 类型与测试

```text
只执行计划的 API 类型和列表 composable 测试。使用已确认契约，覆盖：
初次加载、筛选重置页码、服务端分页排序、旧请求晚返回、请求失败与重试。
先证明测试因实现缺失而失败，再做最小实现。不要继续写 UI。
```

### 第 5 轮：筛选与表格

```text
只实现 UserFilterForm 和 UserTable。筛选提交与重置通过 typed emits 上抛；
表格 rowKey 使用 user.id；分页排序使用后端能力；无权限操作不渲染且在事件处理
处再次校验。提供加载、空态和可恢复错误。不要在子组件直接请求 API。
```

### 第 6 轮：编辑表单

```text
只实现 UserEditDrawer。使用 Ant Design Vue 表单校验；打开时复制 DTO 到独立
表单模型，不直接修改表格行或 Props；提交期间防重复；映射服务端 fieldErrors；
关闭脏表单前确认。成功后上抛 saved，由页面决定刷新。
```

### 第 7 轮：权限与路由

```text
接入现有 Pinia auth store 和 Vue Router meta，不创建第二套权限源。
覆盖无权限深链、刷新恢复、401 退出和 403 页面反馈。避免导航守卫重定向循环，
不要把按钮隐藏描述成真正鉴权；服务端仍必须校验。
```

### 第 8 轮：页面组合与错误路径

```text
在 UserManagementView 组合现有组件。保持 route view 精简；
筛选与分页同步 URL，浏览器前进后退可恢复；快速筛选取消旧请求；
保留失败时的当前筛选，并提供重试。只改计划内文件。
```

### 第 9 轮：验证

```text
从 package.json 读取真实脚本。依次运行用户模块测试、typecheck、lint（若存在）
和生产构建。报告命令、工作目录、退出码与失败摘要。不得改配置、删除断言、
加 skip 或使用 any 让检查通过。
```

### 第 10 轮：独立审查

```text
在独立上下文只审查需求、完整 diff 和验证输出，不修改代码。重点检查：
API 臆造、Vue 响应式、请求竞态、权限绕过、表格稳定 key、表单脏状态、
错误恢复、键盘与焦点、测试有效性和无关文件。只报告有证据的问题。
```

## 实现关键点

### 列表请求与竞态

`useUserList` 保存查询源状态、数据、加载和错误。新的查询应取消旧请求，或使用递增请求 ID 丢弃旧响应。筛选变化时页码归一，URL 解析需要校验非法值。

```ts
const rows = ref<UserSummary[]>([])
const loading = ref(false)
const error = shallowRef<ApiError | null>(null)
let requestId = 0

async function load(query: UserListQuery) {
  const current = ++requestId
  loading.value = true
  error.value = null
  try {
    const result = await getUsers(query)
    if (current !== requestId) return
    rows.value = result.items
  } catch (cause) {
    if (current !== requestId) return
    error.value = normalizeApiError(cause)
  } finally {
    if (current === requestId) loading.value = false
  }
}
```

项目若已支持 `AbortSignal`，优先真正取消请求。不要在 `computed` 中发请求或修改状态。

### 权限

权限至少分三层：

1. 路由守卫控制页面入口；
2. UI 根据权限决定可见和可操作状态；
3. 服务端对每次资源操作重新鉴权。

前两层改善体验，第三层才是安全边界。不要从展示名称推导权限，使用稳定权限码并集中定义。

### 表格

- `rowKey` 使用后端稳定 ID；
- 页码、页长、排序和筛选使用明确类型；
- 不在模板执行昂贵过滤；
- 操作列按钮有可访问名称和禁用原因；
- 删除或停用显示对象名称、影响和二次确认；
- 大数据量先确认瓶颈，再决定虚拟化。

### 表单

- DTO 与表单模型分离；
- 打开时复制数据，取消时不污染列表行；
- 客户端校验改善体验，服务端仍做最终校验；
- 将字段错误关联到控件，焦点移动到首个错误；
- 提交期间禁用重复操作；
- 并发更新冲突需要提示刷新或合并。

### 错误处理

- `401`：清理用户态，保存安全的回跳位置；
- `403`：展示无权限，不循环登录；
- 字段校验：映射到表单项；
- 冲突：说明数据已变更并提供刷新；
- 网络失败：保留条件并提供重试；
- 未知错误：展示请求 ID，日志不含敏感数据。

## 测试矩阵

至少覆盖：

- API 查询参数转换和错误归一化；
- 筛选提交、重置与 URL 恢复；
- 分页、排序和快速连续请求；
- 加载、空态、失败、重试；
- 编辑初始化、客户端校验、服务端字段错误、重复提交；
- 有权限、无权限、会话失效；
- 键盘打开/关闭抽屉、焦点返回和错误关联；
- 页面集成中的保存后刷新与失败保留。

测试不应绑定 Ant Design Vue 的内部 DOM 细节。优先断言用户可见行为和组件公开契约。

## 构建验证

命令必须以项目 `package.json` 为准，常见顺序如下：

```bash
pnpm vitest run src/features/users
pnpm typecheck
pnpm lint
pnpm build
```

如果仓库没有某条脚本，应明确标记「未配置」，不能临时编造命令后声称通过。生产构建通过也不等于页面交互已验收，关键流程还需浏览器或组件测试。

## 四类失败示例

### 臆造 API

```text
错误：根据页面文案自行创建 POST /api/user/search，并假设响应是 { list, count }。
正确：从 OpenAPI、现有客户端或后端确认；没有证据就提出阻塞问题。
```

### 破坏响应式

```ts
// 错误：直接解构 Pinia Store，状态可能失去响应性
const { permissions } = useAuthStore()

// 正确：状态使用 storeToRefs，Action 从 store 调用
const authStore = useAuthStore()
const { permissions } = storeToRefs(authStore)
```

### 跳过 typecheck

```text
错误：把响应断言成 any、删除失败测试或只运行 build。
正确：修复契约；执行相关测试、typecheck 和生产构建并报告真实输出。
```

### 修改无关文件

```text
错误：实现列表时顺手升级依赖、重排全仓格式、重写请求层。
正确：遵守计划内文件范围；发现必要的跨层改动时先说明原因并等待确认。
```

## 最终验收

- API 字段均有可追溯来源；
- 页面、组件、composable 和 Store 职责清晰；
- 筛选、分页、排序、权限和错误路径可验证；
- Vue 响应式没有被错误解构或副作用污染；
- 测试、typecheck、lint 和 build 有真实证据；
- diff 没有密钥、生成物和无关改动；
- 文档没有声称 Cursor 会自动创建本示例中的真实文件。

## 官方资料

- [Vue 3 官方文档](https://vuejs.org/guide/introduction.html)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/)
- [Ant Design Vue](https://antdv.com/)
- [Cursor Prompting](https://cursor.com/docs/agent/prompting.md)
