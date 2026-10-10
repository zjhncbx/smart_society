# SmartSociety Web 管理端

> 面向社会团体管理人员的纯管理端 Web 应用。**不承担日常活动报名，不提供社交关系链，不以内容社区为核心。**
>
> Web 与 Android / HarmonyOS 手机端共享同一套身份、组织、权限、业务 API、事件、自动化治理和数据契约。

## 1. 技术方案

| 层级 | 技术 | 说明 |
|---|---|---|
| 开发语言 | **TypeScript 5.x** | `strict` 开启；与现有云函数 TS/JS 契约衔接 |
| UI 框架 | **React 19.x** | 适合复杂、数据密集型企业管理后台 |
| 构建工具 | **Vite 7.x** | SPA 构建快，适合静态托管 |
| UI 组件库 | **Ant Design 5.x** | 表格、表单、Drawer、Modal、Tree、Steps 等成熟后台组件 |
| 路由 | **React Router 7.x** | 嵌套路由、权限路由、懒加载 |
| 服务端状态 | **TanStack Query 5.x** | API 缓存、分页、失效、重试和并发状态管理 |
| 客户端状态 | **Zustand 5.x** | 仅保存会话、当前组织和 UI 状态，不镜像服务端数据 |
| API | **原生 fetch + 统一 API Client** | 统一处理 `{ ret }`、认证、错误、分页、幂等和追踪 |
| Schema | **Zod** | API 入参/响应运行时校验 |
| 图表 | **Apache ECharts 6.x** | 组织态势、治理指标、风险、质量和趋势分析 |
| 日期 | **Day.js** | 轻量，与 Ant Design 生态兼容 |
| 样式 | **CSS Modules + CSS Variables** | 组件隔离 + Design Token |
| 测试 | **Vitest + React Testing Library + Playwright** | 单元、组件、E2E |
| 代码质量 | **ESLint + Prettier + TypeScript strict** | 代码 Review 门禁 |
| 包管理 | **pnpm** | 严格依赖隔离 |

### 为什么选择 React + TypeScript + Vite

SmartSociety Web 是长期演进的组织治理管理端，不是营销站点。核心场景是高密度数据表、复杂表单、权限、工作项、审批、财务、风险、数据治理和可视化。React + TypeScript + Ant Design 能提供成熟的企业后台组件体系，同时保持与现有云端 TypeScript 代码的一致性。

### 明确不采用

- **Vue**：避免引入第二套前端生态；当前项目 React 更适合复杂管理工作台。
- **Next.js / Nuxt**：当前不需要 SEO、SSR/SSG；SPA 更适合管理后台和静态部署。
- **Electron**：Web 不承担桌面客户端职责。
- **微前端**：当前规模没有拆分必要，先保持单体前端、模块化边界。
- **Web 直连 CloudDB**：业务数据必须经过统一 Business API，服务端负责权限、DataScope、状态机、审计和幂等。

## 2. 总体架构

```text
Browser
  │
  ▼
React + TypeScript + Vite
  │
  ├─ App Shell / Layout / Router
  ├─ Auth / Organization / Permission Guard
  ├─ Design System / Shared Components
  └─ Feature Modules
       │
       ▼
Unified API Client
  │  Access Token / orgId / requestId
  │  correlationId / idempotencyKey / Zod
  ▼
API Gateway / Cloud Functions / Cloud Objects
  │
  ├─ Business API
  ├─ Permission / DataScope
  ├─ State Machine
  ├─ Idempotency
  ├─ BusinessEvent / Rule / WorkItem
  └─ AuditLog
       │
       ▼
Huawei CloudDB / Cloud Storage
```

端云总体架构与十项核心设计原则见 [docs/architecture.md](../docs/architecture.md)。Web 侧核心原则：

1. Web 只负责展示、交互和管理操作，不复制服务端业务规则。
2. Web 不直接读写 CloudDB，不直接依赖底层云函数 SDK。
3. 前端 Permission Guard 只改善体验，**服务端才是最终安全边界**。
4. 审批、财务、风险、任务等状态机必须通过业务动作 API，不得通过 CRUD 绕过。
5. 高风险写操作必须强制 `idempotencyKey`。
6. DataScope、过滤、分页必须服务端执行，禁止先拉取组织全量数据再由浏览器过滤。

## 3. 工程目录

```text
web/
├── src/
│   ├── app/                 # App、Router、Providers
│   ├── auth/                # 登录态、身份、认证 API
│   ├── api/                 # 唯一 API Client、Schema、错误处理
│   ├── layouts/             # AuthLayout、AppLayout
│   ├── components/          # DataTable、Form、WorkItem 等共享组件
│   ├── features/            # 业务模块
│   │   ├── dashboard/ workbench/ organization/ membership/
│   │   ├── project/ approval/ finance/ risk/ data-quality/
│   │   ├── automation/ sensing/ reports/ settings/
│   ├── stores/              # 仅客户端状态
│   ├── permissions/         # 前端展示级权限守卫
│   ├── models/ hooks/ utils/
│   └── styles/              # Design Token / Global CSS
└── tests/
    ├── unit/ component/ e2e/
```

依赖方向：`features → api / hooks / components / models`；`api → schemas / models`；`stores → session / UI state`。

禁止：页面 → CloudDB、页面 → 云函数 SDK、页面 → 直接修改权限、页面 → 直接修改状态机字段。

## 4. API Client 规范

建立唯一 `src/api/client.ts`，业务页面禁止自行 `fetch()`。

统一处理：Access Token / 认证上下文、当前 `orgId`、`requestId`、`correlationId`、`idempotencyKey`、超时和网络错误、`{ ret }` 业务错误、401/403/404/409/429/5xx、服务端分页、文件上传下载、Zod 响应校验、诊断日志。

典型业务动作：

```ts
await api.workItems.act({
  workItemId,
  action: 'approve',
  idempotencyKey: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
});
```

普通查询不强制生成幂等键；高风险写操作必须生成并传递 `idempotencyKey`。

## 5. 状态管理

- **TanStack Query**：服务端数据统一使用（列表、详情、Dashboard、WorkItem、风险、数据质量、项目、组织、会员、报表等）。
- **Zustand**：只保存真正的客户端状态（会话摘要、当前组织、UI 偏好、侧边栏状态）。禁止把 CloudDB 或整个服务端对象树镜像到 Zustand。
- **URL 状态**：列表页的搜索、筛选、分页、排序优先放入 URL，保证页面可复制、恢复和审计。

## 6. 身份、组织与权限

跨端统一身份规范见 [docs/identity-spec.md](../docs/identity-spec.md)。前端负责登录态、组织切换、权限菜单、页面/操作级 Guard；但**前端 Guard 不是安全边界**，所有 Permission / DataScope 必须由服务端重新验证。

## 7. UI / UX 信息架构

SmartSociety Web 不是传统 CRUD 后台，应采用 **"工作台 + 治理中心 + 全域感知"**。

> **实现现状（W0~W4 已落地）**：一级导航已按此架构实现并扩展（含治理对象、审计与事件、文件中心、通知公告），见 `src/layouts/AppLayout.tsx` 的 `navItems`；全局视觉对标钉钉/飞书，设计令牌唯一基准为 `src/theme/tokens.ts`（主色 `#1677FF` 系），统一页面骨架 `src/components/PageContainer.tsx`。

建议一级导航：工作台、组织治理、成员与档案、项目与任务、审批与决议、财务管理、风险与预警、数据治理、自动化治理、全域感知、报表与分析、系统设置。

## 8. 部署方案

Web 采用 **SPA 静态资源部署**，不依赖 Node.js 常驻 Web Server：

```text
pnpm build → dist/ → 静态托管 / CDN → Browser → API Gateway / Cloud Functions → CloudDB / Storage
```

至少区分 development / staging / production 环境。API Base URL、认证配置、静态资源地址全部通过环境变量注入，不写死生产地址。SPA 路由需要静态托管侧配置 fallback 到 `index.html`。

### 真实 AGC 网关对接

Web 真实接入步骤：
1. AGC 控制台「云开发 > 云函数」为云函数配置 HTTP 触发器，获取访问域名。
2. 将访问域名填入 `VITE_API_BASE_URL`（见 `.env.production.example`），无需在 Web 端使用 client_secret。
3. 认证链：`login-user(account, password)` → 内部 userId → `get-my-orgs` → 组织切换 → `get-my-permissions` 写入会话（华为账号等外部身份经 `ensure-user-identity` 映射，见 [docs/identity-spec.md](../docs/identity-spec.md)）。
4. 替换 Mock：`mock/dev-api.ts` 仅 dev 生效（`apply: 'serve'`），生产构建不包含。

> 完整部署清单、CLI 不可用说明与联调验收清单见 [docs/deployment.md](../docs/deployment.md)。

## 9. 性能要求

- 路由级懒加载、大表格服务端分页、必要时才使用虚拟滚动
- Dashboard 查询并行化、TanStack Query 缓存
- 附件按需加载、ECharts 按页面按需加载
- 避免全局 Store 导致大范围 React 重渲染
- 首屏只加载工作台必要数据
- 1000+ 行数据禁止一次性全量拉入浏览器

## 10. 测试门禁

- **Unit**：API Client、Schema、数据转换、权限展示逻辑、工具函数。
- **Component**：DataTable、Form、WorkItem、Permission Guard、状态组件、Drawer/Modal。
- **E2E**：至少覆盖 登录 → 组织切换 → 查看 WorkItem → 执行业务动作 → 幂等重试 → 查看结果 → 查询 AuditLog / 关联事件；并验证普通成员 403 / 管理员允许操作。

## 11. Web 开发硬约束

代码 Review 必须检查：

- [ ] TypeScript `strict` 开启
- [ ] 页面禁止直接访问 CloudDB
- [ ] 页面禁止直接调用底层云函数 SDK
- [ ] 禁止手机号 / 邮箱 / Huawei OpenID 作为业务主键
- [ ] 禁止前端自行决定 Permission / DataScope
- [ ] 禁止 CRUD 绕过业务动作 API 修改状态机
- [ ] 高风险写操作必须提供 `idempotencyKey`
- [ ] 跨业务链路必须传递 `correlationId`
- [ ] 服务端分页优先
- [ ] API 统一 `{ ret }` 契约
- [ ] 新增数据模型遵循 [docs/data-contract.md](../docs/data-contract.md)
- [ ] 新增业务 API 遵循 [docs/api-contract.md](../docs/api-contract.md)
- [ ] 身份体系遵循 [docs/identity-spec.md](../docs/identity-spec.md)

## 12. 当前状态

> **Web 核心业务：🟢 W0~W4 全部完成**（认证链/组织切换/核心工作台/组织业务/高级治理/设置中心/治理对象/财务高级/公告/统一错误处理，Mock 68 项冒烟断言全绿）。剩余集成验收门禁：真实 AGC 网关部署与联调（见 [docs/deployment.md](../docs/deployment.md)）、幂等并发、`correlationId` 全链路验证。

### 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | **>= 20.19.0** | Vite 7 / React Router 7 硬性要求 |
| pnpm | >= 9 | 可通过 `corepack enable` 启用；大陆网络可在 `web/.npmrc` 配置 mirror |

### 下一步

按 [docs/deployment.md](../docs/deployment.md) 接入真实 AGC 网关：云函数 HTTP 触发器域名填入 `VITE_API_BASE_URL`（`VITE_API_MODE=agc`），走认证链替换 Mock，按验收清单完成三端联调；云存储按 [docs/cloud-storage-security.md](../docs/cloud-storage-security.md) 配置安全规则与 `CLOUD_STORAGE_BUCKET` 环境变量。
