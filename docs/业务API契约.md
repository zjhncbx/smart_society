# 社易管统一业务 API 契约（P0-D / P0-E）

> 依据：docs/产品审视与优化路线.md（V6.0）§21 业务服务层、§23 自动化可靠性  
> 目的：Web / Android / HarmonyOS 三端共用一套业务动作语义，禁止三端各自实现核心业务规则。

---

# 一、总体约定

- 传输：HTTP POST，JSON body，认证类型 `apigw-client`。
- 返回：统一 `{ ret: { code, message, data } }`，`code=0` 成功。
- 组织上下文：所有组织级调用必须携带 `orgId` + `userId`；云函数在服务端重新校验成员/管理员身份。
- 业务动作：核心状态迁移通过“动作型”云函数完成（见 §二），客户端不得直接 upsert 覆盖状态字段。

---

# 二、业务动作命名规范

动词：`submit / approve / reject / done / cancel / close / unclose / resolve / ack / reopen / assign / verify`

命名：`{动词}-{对象}`，与现有云函数一一对应：

| 业务动作 | 云函数 | 说明 |
|---|---|---|
| submit-finance | `submit-finance-record` | 提交财务单据并启动审批 |
| approve/reject/done-finance | `act-finance-node` | 审批通过/驳回、办理完成 |
| close-period / unclose-period | `close-period` / `unclose-period` | 期末结账 / 反结账 |
| done/cancel/reopen-auto-task | `act-auto-task` | 自动任务处理 |
| resolve/ack/reopen-risk | `act-risk-alert` | 风险/预警处理 |
| resolve/ignore/reopen-data-quality | `resolve-data-quality-issue` | 数据问题闭环 |
| sync/get/act-work-item | `refresh-work-items` / `get-work-items` / `act-work-item` | 统一工作项物化/查询/处理 |
| run-data-quality | `run-data-quality` | 数据质量检查 |
| run-governance-rules | `run-governance-rules` | 规则引擎批量运行 |
| record-event / record-audit | `record-business-event` / `record-audit-log` | 事件与审计写入 |
| get-my-permissions / get-roles / save-role / save-data-scope | `get-my-permissions` / `get-roles` / `save-role` / `save-data-scope` | 权限计算与 RBAC 配置（Web 权限框架消费） |
| create/update-resolution | `save-resolution` | 创建/更新决议（强制幂等键，事件+审计） |
| get-resolutions | `get-resolutions` | 决议列表（状态/责任人筛选、分页） |
| start/done/reopen-resolution | `act-resolution` | 决议执行状态迁移（原子认领幂等，事件+审计） |
| save/get/act-license | `save-license` / `get-licenses` / `act-license` | 证照管理（保存/查询/续期-过期-重开，幂等+事件+审计） |
| save/get/act-compliance-item | `save-compliance-item` / `get-compliance-items` / `act-compliance-item` | 合规事项（保存/查询/开始-完成-重开） |
| save/get/act-term | `save-term` / `get-terms` / `act-term` | 任期管理（保存/查询/换届准备-生效-归档） |
| get-trend-stats | `get-trend-stats` | 变化感知：近 7 天趋势与环比异常（事件/风险/自动化/审批时长） |
| get-entity-relations | `get-entity-relations` | 业务血缘：项目根节点聚合决议/负责人/财务/审批/风险/任务 |
| init/commit-file | `init-file-upload` / `commit-file-upload` | 文件上传：初始化（幂等）+ 提交（SDK 直传 move 或代理写入，事件+审计） |
| list/get/delete-document | `list-documents` / `get-document-file` / `delete-document` | 文件中心：按 DataScope 分页查询 / 服务端代理下载（base64，≤10MB）/ 软删+存储删除（强制幂等键） |
| get/set-rule-config | `get-rule-config` / `set-rule-enabled` | 治理规则配置查询（GR-01~12 定义+启停状态）/ 规则启停（仅管理员，**强制幂等键**，事件+审计） |
| get-automation-logs | `get-automation-logs` | 自动化运行日志分页查询（runAt 倒序，pageSize≤100） |
| get-report-stats | `get-report-stats` | 治理报表聚合：收支月度趋势/风险分布/数据质量维度/项目状态/汇总指标 |
| search-all | `search-all` | 全域检索：工作项/风险/自动任务/事件/成员/项目/公告七类关键词统一搜索 |

> 成员/项目/公告的普通增删改仍走 `upsert-*` / `delete-*`（离线队列），但**状态机与高风险迁移**必须走动作型接口；新增动作（决议执行、项目进度上报等）一律按本规范命名。

---

# 三、幂等契约（P0-E）

## 3.1 原则

以下动作**强制要求幂等**（缺失 `idempotencyKey` 直接拒绝执行）：`submit-finance-record`、`act-finance-node`、`close-period`、`unclose-period`、`act-auto-task`、`act-risk-alert`、`resolve-data-quality-issue`、`init-file-upload`、`commit-file-upload`、`delete-document`、`set-rule-enabled`。

## 3.2 调用约定

调用方为“一次业务动作”生成唯一 `idempotencyKey`，**同一动作重试时必须复用同一键**：

```json
{
  "orgId": "...",
  "userId": "...",
  "idempotencyKey": "idem_submit_finance_1723880000000_123456",
  "...": "..."
}
```

## 3.3 服务端行为

1. 校验组织成员/权限；缺少 `idempotencyKey` 直接拒绝（财务提交/审批/结账/反结账等关键动作）。
2. **原子认领（claim）**：按 `idempotencyKey` 查 `IdempotencyRecord`：
   - `status=done` → 直接返回首次执行结果（`message: ok（幂等返回）`）。
   - `status=processing` 且在认领窗口内（120s）→ 返回“操作正在处理中”，拒绝重复执行。
   - 不存在 / 超时 / failed → 写入 `status=processing` + `claimId`，**读回确认 claimId 归属后获得执行权**。
3. 执行成功 → 更新 `status=done` + `result`（首次返回 data，24h 有效）。
4. 执行失败 → 更新 `status=failed`，下次重试可重新认领执行。

> 说明：CloudDB 无事务性条件插入，本实现通过“认领 + claimId 归属确认 + 超时重领”将并发双执行窗口压缩到最小；若要求严格 Exactly-Once，需在 AGC 后端服务层引入分布式锁/唯一索引（Web 阶段可选增强）。

## 3.4 幂等键生成（客户端）

`CloudFunctionService.newIdempotencyKey(action)`：`idem_{action}_{微秒时间戳}_{随机}`。

---

# 四、权限与审计

- 权限：服务端按 `UserOrganization.role`（当前 admin/member；RBAC 落地后按 Role/Permission/DataScope）校验；客户端权限判断仅影响 UI。
- 审计：关键动作同时写 `AuditLog`（改前/改后/操作人/变更原因）与 `BusinessEvent`（含 correlationId）。
- 幂等记录：`IdempotencyRecord`（key 为主键，含 action/entityType/entityId/result/expiresAt）。

---

# 五、三端接入要求

1. Web / Android / HarmonyOS 使用同一套动作函数与幂等契约，不得另起业务逻辑。
2. 客户端重试（超时/网络失败）复用同一 `idempotencyKey`。
3. 高风险操作（结账、反结账、删除、权限变更、治理任命）服务端二次校验权限并落审计。

---

# 六、治理规则与查询函数契约（本轮新增 5 个）

> 五个函数均按 §一 总体约定执行：成员校验失败返回「您不是该组织成员」；缺 `orgId`/`userId` 直接拒绝。契约与 `mobile/CloudProgram/cloudfunctions/<函数名>/index.ts` 实现一致。

## 6.1 search-all（全域检索）

- **入参**：`orgId`、`userId` 必填；`keyword`（兼容 `query` 字段，两端统一）；`limit` 可选（默认 140，上限 140）。
- **行为**：关键词转小写对七类对象做多字段包含匹配——工作项（标题/描述）、风险（标题/描述）、自动任务（标题/描述）、事件（实体名/事件类型）、成员（姓名/手机号/邮箱/部门/学号）、项目（名称/描述）、公告（标题/内容）；每类命中上限 20 条，超出截断。
- **出参**：`data.results: [{ type, id, title, subtitle, updatedAt }]`，`type ∈ work_item/risk/task/event/member/project/notice`。
- **约束**：空关键词返回空 `results`（避免全表扫描）；查询按 `orgId` 等值过滤分页拉取（单页 1000、上限 50 页）。

## 6.2 get-rule-config（规则配置查询）

- **入参**：`orgId`、`userId` 必填（组织成员即可，只读）。
- **行为**：读取 `OrgSettings.ruleConfig` 的 `disabled` 集合，与内置 GR-01~12 静态定义（id/name/category/whenText/ifText/thenText，语义与 `run-governance-rules` 引擎一致）合并。
- **出参**：`data.rules: [{ id, name, category, whenText, ifText, thenText, enabled }]`，恒为 12 条；`ruleConfig` 为空/损坏时按全部启用兜底。

## 6.3 set-rule-enabled（规则启停，写操作）

- **入参**：`orgId`、`userId`、`ruleId`（兼容 `id` 字段，合法值 GR-01~12）、`enabled`（布尔）、`idempotencyKey`（**强制**）、`correlationId`（建议必传）。
- **权限**：组织成员且 `role === 'admin'`，否则拒绝（「仅组织管理员可以启停治理规则」）。
- **幂等**：按 §三 原子认领协议执行（`IDEM_TIMEOUT_MS=120s`，`requestHash` 含 orgId/ruleId/enabled）；`done`→返回首次结果，`processing` 窗口内→拒绝，失败置 `failed` 可重领。
- **行为**：维护 `OrgSettings.ruleConfig.disabled` 集合增删（`enabled=true` 移除、`false` 加入）；同步写 `AuditLog`（action=set-rule-enabled，before/after 含 enabled 变化）与 `BusinessEvent`（entityType=rule），携带同一 `correlationId`。
- **出参**：`data: { id, enabled }`；幂等命中时 `message: ok（幂等返回）`。
- **联动**：停用后的规则在 `run-governance-rules` 运行时被跳过，结果 `actions.skippedRules` 与运行日志记录被跳过规则编号。

## 6.4 get-automation-logs（自动化运行日志）

- **入参**：`orgId`、`userId` 必填；`page`（默认 0）、`pageSize`（默认 20，**上限 100**）。
- **行为**：`AutomationRunLog` 按 `orgId` 过滤、`runAt` 倒序分页；`actions` 字段为 JSON 字符串，服务端解析失败时置 `{}`。
- **出参**：`data: { logs: [{ id, orgId, ruleId, ruleName, status, actions, runBy, runAt, durationMs, errorMessage }], total, page, pageSize, hasMore }`。

## 6.5 get-report-stats（治理报表聚合）

- **入参**：`orgId`、`userId` 必填（组织成员即可，只读）。
- **出参**：`data` 包含五组聚合结果：
  - `financeTrend: [{ month, income, expense }]`——已批准（status=approved）财务单据按月（YYYY-MM）聚合，升序；
  - `riskDistribution: [{ name, value }]`——未关闭（status=open）风险/预警按 kind 计数（风险/预警）；
  - `dqDimensions: [{ name, value }]`——最新 `DataQualitySnapshot` 的维度分（无快照时为空数组、总分按 100）；
  - `projectStatus: [{ name, value }]`——项目按状态展示名计数（筹备中/进行中/已暂停/已完成）；
  - `totals: { members, projects, pendingWorkItems, dqScore, successRate }`——成员数/项目数/未关闭工作项数/数据质量总分/自动化近 20 次运行成功率（无记录按 100）。
- **约束**：明细查询按 `orgId` 等值过滤分页拉取（单页 1000、上限 50 页），服务端聚合，禁止端侧全量拉取。
