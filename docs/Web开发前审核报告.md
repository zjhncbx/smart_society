# 社易管 Web 开发前审核报告

> **依据**：docs/产品审视与优化路线.md（V6.0）  
> **审核日期**：2026-08-17  
> **审核范围**：V6.0 Phase 0–4（统一契约、数据底座、业务服务、自动化治理、全域感知）在 Web 开发前必须就绪的项  
> **审核方法**：对照 V6.0 逐项盘点 CloudDB 对象类型、云函数源码、Flutter 端能力，逐项给出 状态/缺口/证据

---

# 一、结论摘要

当前移动端已经具备：事件中心、数据质量中心、规则引擎（GR-01~08）、自动任务、风险/预警、组织态势、数字画像、全域检索、统一待办、同步中心等能力，**Phase 3/4 的整体完成度较高**。

但在 **Phase 0（统一契约）与 Phase 1（数据底座）** 上仍有 P0 缺口，这些是 Web 开发前必须补齐的：

1. **统一字段契约未落地**：19 张 CloudDB 表均未完整具备 `id/orgId/code/status/createdAt/createdBy/updatedAt/updatedBy/version/sourceType/sourceId` 统一字段。
2. **云端权限校验不完整**：10 个关键云函数（CRUD 与组织层级、钉钉凭证）缺少成员/管理员校验，存在越权风险。
3. **审计日志缺失**：仅有事件流（BusinessEvent）与自动化运行日志，没有面向“谁在何时改了什么、改前改后”的 AuditLog/ChangeLog。
4. **事件关联链不完整**：BusinessEvent 无 `correlationId`，无法把“一个业务动作产生的一串事件”关联起来。
5. **统一工作项（WorkItem）未落地**：审批实例、自动任务、项目任务、风险整改仍分散，Web 无法只用一个待办接口消费。
6. **依赖新对象的能力**：主数据（Person/Department/Position/Term/Role/Permission）、治理对象（Meeting/Resolution/Contract/License/ComplianceItem）尚未建模，对应的决议执行中心、任期自动化、合规自动化是 Web 第一阶段的补充项而非前置阻塞项。

---

# 二、Phase 0 统一契约（状态：部分）

| 项 | 状态 | 缺口 |
|---|---|---|
| 数据模型 | ⚠️ 部分 | 19 张表存在，但统一字段契约未冻结（见 §五） |
| 组织模型 | ✅ | Organization/OrganizationRelationship/UserOrganization 已就绪 |
| 身份/权限 | ❌ | 仅二元 admin/member 角色，无 Role/Permission/DataScope/OperationPolicy |
| 状态机 | ⚠️ 部分 | 财务审批、项目、任务有状态机；治理/合规无对象 |
| API 契约 | ⚠️ 部分 | 46 个云函数即 API，但无契约文档；缺少统一业务动作封装（幂等/事务） |
| Event 契约 | ⚠️ 部分 | BusinessEvent 已建，缺 correlationId |

---

# 三、Phase 1 数据底座（状态：部分）

| 项 | 状态 | 缺口 |
|---|---|---|
| Cloud DB 模型 | ✅ | 19 张表（含事件/质量/自动化） |
| 主数据 | ❌ | Person/Department/Position/Term 未建模；会员仍是独立实体 |
| 数据质量 | ✅ | DQ-001~011 + 健康度快照 + 问题闭环 |
| 版本 | ❌ | 无 version 字段、ChangeLog、历史对比/恢复 |
| 审计 | ❌ | 无 AuditLog（仅有事件与自动化运行日志） |
| 文件存储 | ❌ | Cloud Storage 未接入；文档/证照/合同均为空对象 |

---

# 四、Phase 2 业务服务 / Phase 3 自动化治理 / Phase 4 全域感知

## 4.1 Phase 2 业务服务（状态：部分）

- 云函数承担了业务服务层职责（46 个，全部走 `{ ret: { code, message, data } }` 契约）✅
- 统一业务动作（如 `POST /projects/{id}/progress`）尚未抽象；部分动作直接由客户端 CRUD 驱动 ⚠️
- 幂等/重试：客户端有重试（3 次指数退避），云端动作本身无幂等键 ⚠️

## 4.2 Phase 3 自动化治理（状态：较强）

- 规则引擎 GR-01~08（逾期升级/进度偏差/审批SLA/数据质量任务/预算超支/职位空缺/驳回异常/长期未更新）✅
- 自动任务（SLA、升级路径、来源可解释）+ 风险/预警分级 + 自动化运行审计日志 ✅
- 统一 WorkItem ❌（审批、自动任务、项目任务、风险整改未统一抽象）
- 规则版本管理、人工暂停/重试、死信队列 ❌（P1）

## 4.3 Phase 4 全域感知（状态：较强）

- 组织态势总览（状态/计数/最值得关注/钻取）✅
- 风险中心/预警中心/数据治理中心/事件流/数字画像 ✅
- 变化感知（环比/连续异常/突变）❌（P1，依赖统计规则）
- 业务关系图/血缘 ❌（P1，部分依赖决议/合同等新对象）

---

# 五、统一字段契约审计（19 张表）

约定统一字段：`id orgId code status createdAt createdBy updatedAt updatedBy version sourceType sourceId`

| 对象类型 | 缺失字段 |
|---|---|
| ApprovalFlow | code,status,createdBy,updatedBy,version,sourceType,sourceId |
| ApprovalInstance | code,updatedBy,version,sourceType,sourceId |
| AppUser | orgId,code,status,createdBy,updatedBy,version,sourceType,sourceId |
| AutomationRunLog | code,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| AutoTask | code,createdBy,updatedBy,version,sourceId |
| BusinessEvent | code,status,createdBy,updatedAt,updatedBy |
| DataQualityIssue | code,createdBy,updatedBy,version,sourceType,sourceId |
| DataQualitySnapshot | code,status,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| FinanceOpeningBalance | code,status,createdAt,createdBy,updatedBy,version,sourceType,sourceId |
| FinanceRecord | code,updatedBy,version,sourceType,sourceId |
| Member | code,status,createdAt,createdBy,updatedBy,version,sourceType,sourceId |
| Notice | code,status,createdAt,createdBy,updatedBy,version,sourceType,sourceId |
| Organization | id,code,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| OrganizationRelationship | id,code,status,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| OrgSettings | id,code,status,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| Project | code,createdBy,updatedBy,version,sourceType,sourceId |
| RiskAlert | code,createdBy,updatedBy,version,sourceType,sourceId |
| UserOrganization | code,status,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| UserSettings | id,orgId,code,status,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |

> 结论：**无一张表满足统一字段契约**。新增对象（AuditLog、WorkItem 等）必须自建时即满足；存量表按优先级分批补齐。

---

# 六、云端权限审计（46 个云函数）

## 6.1 高风险：缺少成员/管理员校验

| 函数 | 问题 | 风险 |
|---|---|---|
| upsert-member / upsert-project / upsert-notice | 无任何身份校验 | 任意调用者可按 id/orgId 写入数据 |
| delete-member / delete-project / delete-notice | 无任何身份校验 | 任意调用者可删除数据 |
| get-all-data | 无任何身份校验 | 任意调用者可拉取组织全量数据（成员/项目/公告） |
| get-org-hierarchy | 无身份校验 | 可读取组织层级 |
| set-org-relationship | 无身份校验 | 可篡改组织关系/数据共享策略 |
| dingtalk-list-departments | 无身份校验 | 凭证由客户端传入，任意调用者可冒用钉钉凭证 |

> 修复方案：以上函数统一增加 `userId` 参数 + `UserOrganization`（`${orgId}_${userId}`）成员校验；`set-org-relationship`、`dingtalk-list-departments` 进一步要求 admin。

## 6.2 已具备校验（抽查通过）

- 财务/审批/结账/设置/数据质量/自动化治理类函数均校验成员身份，管理员操作（结账、反结账、审批流保存、期初余额、组织设置、管理员转让）校验 admin ✅

## 6.3 说明

- `login-user` / `register-user` / `get-user-settings` / `save-user-settings` 为用户级公开接口，无需组织成员校验 ✅
- `create-org` 创建组织时用户尚不属于任何组织，属正常 ✅

---

# 七、Web 开发前必修（P0）清单

| 编号 | 事项 | 对应路线章节 | 工作量 |
|---|---|---|---|
| P0-1 | 修复 10 个云函数权限校验缺口（成员/admin） | §5、§21 | ✅ 已完成（commit：安全权限修复） |
| P0-2 | 新增 AuditLog（对象 + record/get 函数 + 关键业务接入） | §4.4、§25 | ✅ 已完成（commit：审计日志） |
| P0-3 | BusinessEvent 增加 correlationId，打通事件关联链 | §7、§23 | 小 |
| P0-4 | 冻结云数据契约文档（统一字段清单 + 新增对象规划） | §4、§22 | 小 |
| P0-5 | 统一工作项 WorkItem 数据模型与查询接口（Web 待办统一消费） | §9 | 大 |

# 八、可后置（P1）清单

- 变化感知与趋势异常（§13）、业务关系图/血缘（§15）、结构化管理查询（§16）
- 自动化运行监控完整指标（§24）、统一通知策略（§28）、四级指标体系（§29）
- 规则版本管理、人工暂停/死信（§23）、离线冲突检测（§20）
- 细粒度 Role/Permission/DataScope（§5）、数据版本与恢复（§25）、Cloud Storage 文件（§22）

# 九、依赖新业务对象（Web 第一阶段补充，非前置阻塞）

主数据：Person / Department / GovernanceBody / Position / Term / Role / Permission  
治理：Meeting / Agenda / Resolution / Appointment / Election  
业务：Contract / Document / License / ComplianceItem / Budget  
衍生：WorkItem / AuditLog / ChangeLog / Notification / Rule（规则配置）

> 其中 AuditLog、WorkItem 属于 P0-2/P0-5 已纳入必修；其余在 Web 第一阶段按“决议执行中心 → 任期自动化 → 合规自动化”顺序建模。
