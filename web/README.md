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

核心原则：

1. Web 只负责展示、交互和管理操作，不复制服务端业务规则。
2. Web 不直接读写 CloudDB，不直接依赖底层云函数 SDK。
3. 前端 Permission Guard 只改善体验，**服务端才是最终安全边界**。
4. `userId` 必须来自认证身份映射；手机号、邮箱、Huawei OpenID、设备 ID 均不得作为业务主键。
5. 多组织用户必须显式维护当前组织，服务端再次校验组织成员关系。
6. 审批、财务、风险、任务等状态机必须通过业务动作 API，不得通过 CRUD 绕过。
7. 高风险写操作必须强制 `idempotencyKey`。
8. 业务链路统一使用 `correlationId` 追踪 BusinessEvent → Rule → AutoTask/Risk → WorkItem → AuditLog。
9. 所有业务 API 遵循 `docs/业务API契约.md` 的 `{ ret: { code, message, data } }` 契约。
10. DataScope、过滤、分页必须服务端执行，禁止先拉取组织全量数据再由浏览器过滤。

## 3. 工程目录

```text
web/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
├── src/
│   ├── app/                 # App、Router、Providers
│   ├── auth/                # 登录态、身份、认证 API
│   ├── api/                 # 唯一 API Client、Schema、错误处理
│   ├── layouts/             # AuthLayout、AppLayout
│   ├── components/          # DataTable、Form、WorkItem 等共享组件
│   ├── features/            # 业务模块
│   │   ├── dashboard/
│   │   ├── workbench/
│   │   ├── organization/
│   │   ├── membership/
│   │   ├── project/
│   │   ├── approval/
│   │   ├── finance/
│   │   ├── risk/
│   │   ├── data-quality/
│   │   ├── automation/
│   │   ├── sensing/
│   │   ├── reports/
│   │   └── settings/
│   ├── stores/              # 仅客户端状态
│   ├── permissions/         # 前端展示级权限守卫
│   ├── models/
│   ├── hooks/
│   ├── utils/
│   └── styles/              # Design Token / Global CSS
└── tests/
    ├── unit/
    ├── component/
    └── e2e/
```

依赖方向必须保持：

```text
features → api / hooks / components / models
api      → schemas / models
stores   → session / UI state
```

禁止：页面 → CloudDB、页面 → 云函数 SDK、页面 → 直接修改权限、页面 → 直接修改状态机字段。

## 4. API Client 规范

建立唯一 `src/api/client.ts`，业务页面禁止自行 `fetch()`。

统一处理：

- Access Token / 认证上下文
- 当前 `orgId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- 超时和网络错误
- `{ ret }` 业务错误
- 401 / 403 / 404 / 409 / 429 / 5xx
- 服务端分页
- 文件上传下载
- Zod 响应校验
- 诊断日志

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

### TanStack Query

服务端数据统一使用 TanStack Query：列表、详情、Dashboard、WorkItem、风险、数据质量、项目、组织、会员、报表等。

### Zustand

只保存真正的客户端状态：

- 会话摘要
- 当前组织
- UI 偏好
- 侧边栏状态
- 必要的临时 UI 状态

禁止把 CloudDB 或整个服务端对象树镜像到 Zustand。

### URL 状态

列表页的搜索、筛选、分页、排序优先放入 URL，保证页面可复制、恢复和审计。

## 6. 身份、组织与权限

```text
认证身份
  ↓
ExternalIdentity
  ↓
内部 userId
  ↓
Person
  ↓
OrganizationMembership / UserOrganization
  ↓
Role
  ↓
Permission
  ↓
DataScope
```

前端负责登录态、组织切换、权限菜单、页面/操作级 Guard；但**前端 Guard 不是安全边界**，所有 Permission / DataScope 必须由服务端重新验证。

Web 阶段需要完成真实的：

```text
Access Token → Auth Context → userId → Organization → Role/Permission/DataScope
```

## 7. UI / UX 信息架构

SmartSociety Web 不是传统 CRUD 后台，应采用 **“工作台 + 治理中心 + 全域感知”**。

建议一级导航：

```text
工作台
组织治理
成员与档案
项目与任务
审批与决议
财务管理
风险与预警
数据治理
自动化治理
全域感知
报表与分析
系统设置
```

默认工作台重点展示：

- 我的 WorkItem
- 待审批
- 风险处置
- 数据质量问题
- 自动化异常
- 即将到期事项
- 组织关键指标
- 最近重要事件

数据密集型页面统一采用：查询区、快速筛选、DataScope 提示、表格、批量操作、Drawer/Modal、状态时间线、操作审计、分页、导出。

## 8. 部署方案

Web 采用 **SPA 静态资源部署**，不依赖 Node.js 常驻 Web Server：

```text
pnpm build
  ↓
dist/
  ↓
静态托管 / CDN
  ↓
Browser
  ↓
API Gateway / Cloud Functions
  ↓
Huawei CloudDB / Storage
```

至少区分：

```text
development
staging
production
```

API Base URL、认证配置、静态资源地址全部通过环境变量注入，不写死生产地址。SPA 路由需要静态托管侧配置 fallback 到 `index.html`。

### 真实 AGC 网关对接（联调项）

`agconnect-services.json`（gitignore，不入库）提供 AGC 项目信息供参考：

| 字段 | 含义 | 用途 |
|---|---|---|
| `region` / `agcgw.CN` | 中国区 AGC 网关（connect-drcn.dbankcloud.cn） | AGC SDK 通道参考 |
| `service.cloudstorage.storage_url` | AGC 云存储域名（agc-storage-drcn.platform.dbankcloud.cn） | 文件中心 /documents（代理上传≤5MB、代理下载≤10MB、软删） |
| `client.project_id / app_id` | 项目与应用标识 | 网关/控制台定位 |

Web 真实接入步骤：
1. AGC 控制台「云开发 > 云函数」为云函数配置 HTTP 触发器，获取访问域名。
2. 将访问域名填入 `VITE_API_BASE_URL`（见 `.env.production.example`），无需在 Web 端使用 client_secret（避免暴露凭据）。
3. 认证链：Web 获取 Access Token → `ensure-user-identity` 映射内部 userId → `get-my-permissions` 写入会话。
4. 替换 Mock：`mock/dev-api.ts` 仅 dev 生效（`apply: 'serve'`），生产构建不包含。

## 9. 性能要求

- 路由级懒加载
- 大表格服务端分页
- 必要时才使用虚拟滚动
- Dashboard 查询并行化
- TanStack Query 缓存
- 附件按需加载
- ECharts 按页面按需加载
- 避免全局 Store 导致大范围 React 重渲染
- 首屏只加载工作台必要数据
- 1000+ 行数据禁止一次性全量拉入浏览器

## 10. 测试门禁

### Unit

API Client、Schema、数据转换、权限展示逻辑、工具函数。

### Component

DataTable、Form、WorkItem、Permission Guard、状态组件、Drawer/Modal。

### E2E

至少覆盖：

```text
登录 → 组织切换 → 查看 WorkItem → 执行业务动作
→ 幂等重试 → 查看结果 → 查询 AuditLog / 关联事件
```

并验证：

```text
普通成员 → 无权操作 → 403 / 隐藏入口
管理员   → 允许操作 → 服务端 Permission / DataScope 验证
```

## 11. 第一阶段实施顺序

### Phase W0：工程底座

1. React + TypeScript + Vite
2. pnpm
3. ESLint / Prettier / TypeScript strict
4. Ant Design Design System
5. Router / Layout
6. API Client
7. TanStack Query
8. Zustand
9. Auth / Organization Context
10. Permission Guard
11. 测试基础设施

### Phase W1：核心工作台

1. 我的 WorkItem
2. 组织态势
3. 全域检索
4. 风险与预警
5. 数据质量
6. 自动化治理
7. AuditLog / 事件链查询

### Phase W2：组织业务

1. 组织治理
2. 成员与档案
3. 项目
4. 审批
5. 决议
6. 财务

### Phase W3：高级治理

1. 规则管理
2. 自动化管理
3. 数据质量规则
4. 风险规则
5. 报表中心
6. 数据导出
7. 高级全域感知

## 12. Web 开发硬约束

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
- [ ] 新增数据模型遵循 `docs/云数据契约.md`
- [ ] 新增业务 API 遵循 `docs/业务API契约.md`
- [ ] 身份体系遵循 `docs/跨端统一用户身份与唯一标识规范.md`

## 13. 当前状态

> **Web 基础工程：🟢 GO**
>
> **Web 核心业务：🟢 进入开发阶段。** AGC 部署、认证链、幂等并发、`correlationId` 全链路作为集成验收门禁；统一字段契约按模块并行迁移，不阻塞 Web 工程建设。
>
> Web 端不是重新设计一套业务系统，而是 SmartSociety 统一业务能力在大屏、键鼠和高数据密度场景下的管理工作台实现。

## 14. 环境要求与 W0 状态

### 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | **>= 20.19.0** | Vite 7 / React Router 7 硬性要求（当前开发机为 18，需先升级；可用 nvm-windows 或官方安装包） |
| pnpm | >= 9 | 可通过 `corepack enable` 启用；大陆网络可在 `web/.npmrc` 配置 `registry=https://registry.npmmirror.com` |

### W0 工程底座（已完成 ✅）

```text
React 19 + TypeScript 5 (strict) + Vite 7 + Ant Design 5
├─ Router / AppLayout（工作台 + 12 个一级导航占位）
├─ 唯一 API Client（{ ret } 契约、requestId/correlationId/idempotencyKey、超时/错误映射）
├─ TanStack Query + Zustand（会话/UI 状态，不镜像服务端数据）
├─ Auth / Organization Context（W0 模拟登录，AGC 认证联调后替换）
├─ Permission Guard（展示级，服务端仍为安全边界）
├─ 测试基础设施（Vitest + RTL 5 用例 ✅；Playwright E2E 骨架）
└─ ESLint + Prettier + TS strict（0 error）
```

本地验证：`pnpm typecheck`（通过）、`pnpm test`（5/5 通过）、`pnpm lint`（0 error）。  
`pnpm build` 需在 Node >= 20.19 环境执行（当前 Node 18 下 Vite 7 会构建产物但以非零码退出）。

### W1 核心工作台（已完成 ✅）

```text
我的 WorkItem     ✅ 列表/类型筛选/完成/取消/同步（服务端 DataScope 契约）
组织态势          ✅ 状态/待处理/风险/预警/数据问题/流程阻塞/最值得关注
全域检索          ✅ /search：跨工作项/风险/事件统一检索
风险与预警        ✅ /risk：分级计数 + 确认监控/标记解决/重开
数据治理          ✅ /data-quality：健康度+维度+问题清单+运行检查+解决/忽略
自动化治理        ✅ /automation：执行统计 + 运行记录 + 运行规则
审计与事件链      ✅ /audit：审计日志 + 事件流，按 correlationId 跨表筛选
```

W1 页面全部通过统一 API Client 对接云端业务函数；开发态由 `web/mock/dev-api.ts`（Vite 中间件 + 可独立运行的 handler）提供 `{ ret }` 契约 Mock 数据。

本地验证：`pnpm smoke`（Mock 9 项断言 ✅）、`pnpm typecheck` ✅、`pnpm lint`（0 error）✅、`pnpm test`（5/5）✅、`pnpm build` ✅。

### W2 组织业务（已完成 ✅）

```text
组织治理          ✅ /organization：组织档案编辑 + 组织关系（子组织/合作 + 数据共享开关）
成员与档案        ✅ /membership：搜索/职务筛选 + 增删改（Modal 表单）
项目              ✅ /project：列表 + 创建/编辑 + 状态迁移（启动/暂停/恢复/完成，走业务动作）
审批与决议        ✅ /approval：审批待办（通过/驳回/办理）+ 决议管理（创建/开始执行/完成/重开；云侧 save/get/act-resolution 已就绪，接入网关后替换 Mock）
财务              ✅ /finance：收支结余统计 + 单据列表 + 提交单据（进入审批）
```

所有写操作经统一 API Client 并携带 `idempotencyKey`/`correlationId`；项目状态迁移与审批动作不允许 CRUD 绕过。

本地验证：`pnpm smoke`（W1/W2 共 18 项断言 ✅）、`pnpm typecheck` ✅、`pnpm lint`（0 error）✅、`pnpm test`（5/5）✅、`pnpm build` ✅。

### W3 高级治理（已完成 ✅）

```text
规则管理          ✅ /automation 规则管理 Tab：规则列表（WHEN/IF/THEN）+ 启用/停用 + 详情 Drawer
自动化管理        ✅ 运行监控（执行统计/成功率/失败/重试/卡住）+ 导出运行记录 CSV
数据质量规则      ✅ DQ 规则（成员必填/任务逾期/预算异常）纳入规则管理
风险规则          ✅ GR 规则（逾期升级/进度偏差/审批SLA/预算超支/职位空缺）纳入规则管理
报表中心          ✅ /reports：收支趋势/风险分布/数据质量维度/项目状态 + 近 7 天事件/风险/自动化趋势与环比异常 + 导出报表 CSV
数据导出          ✅ utils/exportCsv（BOM+转义）+ 自动化记录/治理报表导出
高级全域感知      ✅ /sensing：态势指标 + 风险分布图 + 数据质量维度 + 近期事件流
业务血缘关系图    ✅ 项目页「关系图」：决议→项目→负责人/财务/审批/风险/任务（ECharts graph）
文件中心          ✅ /documents：按分类/状态/关键词/只看我的查询，代理上传（base64）与下载（Blob），DataScope 提示，软删
```

ECharts 采用 `echarts/core` 按需引入（Line/Bar/Pie + Grid/Tooltip/Legend + Canvas），报表分包约 554KB（gzip 190KB）。

本地验证：`pnpm smoke`（W1/W2/W3 + 趋势/血缘 + 文件中心共 29 项断言 ✅）、`pnpm typecheck` ✅、`pnpm lint`（0 error）✅、`pnpm test`（6/6）✅、`pnpm build` ✅（exit 0，无告警）。

### 下一步

接入真实 AGC 网关（`VITE_API_BASE_URL`）替换 Mock，并按 `docs/业务API契约.md` / `docs/云数据契约.md` 对齐真实接口；云存储按 `docs/云存储安全策略.md` 配置安全规则与 `CLOUD_STORAGE_BUCKET` 环境变量；Web 与移动端/云端联调后完成三端验收。
