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

> 成员/项目/公告的普通增删改仍走 `upsert-*` / `delete-*`（离线队列），但**状态机与高风险迁移**必须走动作型接口；新增动作（决议执行、项目进度上报等）一律按本规范命名。

---

# 三、幂等契约（P0-E）

## 3.1 原则

以下动作**强制要求幂等**（缺失 `idempotencyKey` 直接拒绝执行）：`submit-finance-record`、`act-finance-node`、`close-period`、`unclose-period`、`act-auto-task`、`act-risk-alert`、`resolve-data-quality-issue`。

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
