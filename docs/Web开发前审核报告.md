# 社易管 Web 开发前审核报告

> **依据**：docs/产品审视与优化路线.md（V6.0）  
> **审核日期**：2026-08-17  
> **审核范围**：V6.0 Phase 0–4（统一契约、数据底座、业务服务、自动化治理、全域感知）在 Web 开发前必须就绪的项  
> **审核方法**：对照 V6.0 逐项盘点 CloudDB 对象类型、云函数源码、Flutter 端能力，逐项给出 状态/缺口/证据

---

## 阅读规则（口径说明）

1. **§〇 是本报告的当前权威结论**（2026-08-17 第二轮代码级核验）：Web 基础工程 Go、核心业务页面 No-Go，阻塞项为 P0-A~P0-E。
2. **§一～§九 为第一轮历史审计记录**，其中描述“当前状态”的语句已在本轮同步修正为第二轮口径；若与 §〇 冲突，**一律以 §〇 为准**。
3. 本轮统一口径：**云函数 49 个、CloudDB 对象 21 张、完整满足统一字段契约 1 张（AuditLog）、AuditLog 云侧已闭环、correlationId 字段已建但链路未贯通**。

---

# 〇、Web 开发启动门禁（Go / No-Go 终审）

> **终审日期**：2026-08-17（第二轮，代码级核验，非文档自述）  
> **结论：基础工程 Go；核心业务页面 No-Go。**

当前已具备进入 **Web 基础工程搭建**（技术栈/路由/Layout/Design System/API Client/Auth/状态管理/数据模型/权限框架/基础组件）的条件；但 **5 项 P0 架构缺口未封口，暂不建议大规模开发会员/组织/项目/审批/财务/决议等核心业务页面**，否则会再次出现三端模型与业务逻辑分叉。

## 0.1 逐项终审结果（代码级证据）

| 核验项 | 结论 | 证据 |
|---|---|---|
| ① Cloud DB 对象（21 张表） | ✅ 基础可用 | 21 张表 JSON 可解析；`AuditLog` 完整满足统一字段 |
| ② 统一字段契约 | ❌ 未代码级冻结 | 21 张表中仅 1 张（AuditLog）满足 11 项统一字段；20 张存量表缺 `code/version/sourceType/sourceId` 等 |
| ③ 云函数权限 | ✅ 组织级已加固 | 49 个函数全量 TS 编译通过；组织级写接口已成员校验，管理员操作已 admin 校验（结账/审批流/期初/组织设置/关系/钉钉凭证） |
| ④ AuditLog | ✅ 云侧闭环 / ⚠️ 查询入口待建 | AuditLog 对象 + record/get-audit-logs + 10 个关键业务函数接入（成员/项目/公告增删改、财务提交/审批/驳回/结账/反结账）；Web 审计页与端侧页面待建设 |
| ⑤ BusinessEvent / correlationId | ⚠️ 字段级完成，链路未贯通 | CloudDB 字段 + 17 个云函数模型 + record/get 透传 ✅；但各业务函数 recordEvent 写入 `correlationId=''`（未生成关联键），且 Flutter 模型未含该字段 |
| ⑥ 跨端 userId | ❌ 客户端未落地 | 云侧 ensure-user-identity + ExternalIdentity 已建 ✅；客户端仍有 19 处直接使用华为 `openId` 作为 userId；User/Person/OrganizationMembership 四层模型未落地 |
| ⑦ User/Person/Membership | ❌ 未落地 | Flutter models 无 Person/OrganizationMembership；UserOrganization 仅二元 admin/member，无 personId/roleId/dataScope |
| ⑧ Role/Permission/DataScope | ❌ 不足 | 无 Role/Permission/DataScope/OperationPolicy 对象；权限仅 `role === 'admin'` 二元判断 |
| ⑨ WorkItem | ❌ 未完成 | 云函数/对象/Flutter 均无 WorkItem（0 命中）；审批/自动任务/项目任务/风险整改仍分散 |
| ⑩ 统一业务 API | ⚠️ 基础有，动作化不足 | 49 个云函数统一 `{ ret: { code, message, data } }`；但成员/项目/公告仍由客户端通用 upsert/delete CRUD 驱动，无统一业务动作封装（如 progress/approve/resolve） |
| ⑪ 服务端幂等 | ❌ 不足 | 0 个函数包含 idempotencyKey；仅客户端 3 次指数退避重试 |
| ⑫ Flutter Models 与契约一致性 | ❌ 未同步 | BusinessEvent 无 correlationId；Member/Project/Notice 等无 code/version/sourceType |
| ⑬ Web 工程 | ⚠️ 仅壳 | `web/` 仅 README.md，无工程初始化 |
| ⑭ cloud_objects IdGenerator | ⚠️ 编译 stub | `id-generator/IdGenerator.ts` 为 Cloud Object 编译生成占位，`randomUUID` 未实现，不代表身份体系完成 |

## 0.2 阻塞项（核心业务页面 No-Go 的原因）

| 编号 | 阻塞项 | 现状 | 要求 |
|---|---|---|---|
| P0-A | WorkItem 统一工作项 | ✅ 第一版已完成（commit：WorkItem）；refresh/get/act 三个云函数 + 移动端统一工作项页 | 审批/自动任务/项目任务/风险整改/数据治理统一抽象，Web 只消费 WorkItem 视图 |
| P0-B | 跨端 userId 客户端落地 | ✅ 第一版已完成（commit：跨端身份客户端落地）；登录自动换取内部 userId，原 19 处 openId 用法已替换；Person 对象已建；OrganizationMembership 增强随 RBAC 批次落地 | 登录后调用 ensure-user-identity 换取内部 userId；建立 User→Person→OrganizationMembership 链 |
| P0-C | Role/Permission/DataScope 第一版 | ✅ 第一版已完成（commit：RBAC）；Role/Permission/DataScope 对象 + get-my-permissions（内置矩阵，回退兼容）+ get-roles/save-role/save-data-scope + UserOrganization.roleId/dataScope；客户端权限框架已接入 | 建立 Role/Permission/DataScope 数据模型与云端鉴权（会长/秘书长/财务/理事/监事等） |
| P0-D | 统一业务动作 API | ✅ 第一版已完成（commit：统一业务API与幂等）；项目/决议等新动作按 `docs/业务API契约.md` 命名 | 审批/财务/风险/数据治理已动作化；决议执行、项目进度上报待新对象 |
| P0-E | 服务端幂等 | ✅ 第一版已完成（IdempotencyRecord + 7 个动作函数） | 审批/财务/状态迁移/自动化/任务支持幂等键与去重 |

## 0.3 必须补强（可与基础工程并行，核心页面开发前完成）

- 统一字段代码级冻结：20 张存量表分批补齐 `code/version/sourceType/sourceId/createdBy/updatedBy` 等，Flutter/Web 模型同步
- correlationId 端到端贯通：业务函数按“一次业务动作”生成关联键，事件→规则→动作→审计可全链追踪；Flutter/Web 模型同步
- AuditLog 查询入口：Web 审计页消费 `get-audit-logs`（云侧已就绪）
- API 契约文档：动作命名、权限矩阵、状态机表、错误码统一

## 0.4 可以进入 Web 的基础工程

```text
Web 项目初始化
├─ 技术栈与目录结构
├─ 路由 / Layout / Design System
├─ API Client（对接云函数 { ret } 契约）
├─ Auth（对接 ensure-user-identity 获取内部 userId）
├─ 状态管理 / 数据模型（严格按 docs/云数据契约.md）
├─ 权限框架（预留 RBAC/DataScope 接口，先落角色判断）
└─ 基础组件（表格/表单/弹窗/分页/批量操作）
```

> 门禁更新规则：P0-A ~ P0-E 全部封口并部署验证后，将本报告结论改为“核心业务页面 Go”，并在下方登记门禁变更记录。

### 门禁变更记录

| 日期 | 结论 | 说明 |
|---|---|---|
| 2026-08-17 | 基础工程 Go / 核心业务 No-Go | 首版门禁：5 项 P0 架构缺口待封口 |

---

# 一、结论摘要

> ⚠️ 完整 Go/No-Go 结论见 §〇（2026-08-17 第二轮终审）：**基础工程 Go / 核心业务页面 No-Go**，阻塞项为 WorkItem、跨端 userId 客户端落地、RBAC、统一业务动作 API、服务端幂等。

当前移动端已经具备：事件中心、数据质量中心、规则引擎（GR-01~08）、自动任务、风险/预警、组织态势、数字画像、全域检索、统一待办、同步中心等能力，**Phase 3/4 的整体完成度较高**。

但在 **Phase 0（统一契约）与 Phase 1（数据底座）** 上仍有 P0 缺口，这些是 Web 开发前必须补齐的：

1. **统一字段契约未代码级冻结**：21 张 CloudDB 表中仅 1 张（AuditLog）完整具备 `id/orgId/code/status/createdAt/createdBy/updatedAt/updatedBy/version/sourceType/sourceId`，20 张存量表待补齐（第二轮口径）。
2. **云端权限校验已修复**：第一轮发现的 10 个越权函数（CRUD、组织层级、钉钉凭证）已统一增加成员/admin 校验（commit：云端权限安全加固）。
3. **AuditLog 云侧已闭环**：AuditLog 对象 + record/get-audit-logs + 10 个关键业务函数已接入；**ChangeLog / 数据版本仍缺失**，Web 审计页与端侧查询入口待建设。
4. **correlationId 字段已建、链路未贯通**：CloudDB 与 17 个云函数模型已含该字段，但业务函数尚未生成关联键、Flutter 模型未同步。
5. **统一工作项（WorkItem）未落地**：审批实例、自动任务、项目任务、风险整改仍分散，Web 无法只用一个待办接口消费（当前阻塞项 P0-A）。
6. **依赖新对象的能力**：主数据（Person/Department/Position/Term/Role/Permission）、治理对象（Meeting/Resolution/Contract/License/ComplianceItem）尚未建模，对应的决议执行中心、任期自动化、合规自动化是 Web 第一阶段的补充项而非前置阻塞项。

---

# 二、Phase 0 统一契约（状态：部分）

| 项 | 状态 | 缺口 |
|---|---|---|
| 数据模型 | ⚠️ 部分 | 21 张表存在，但统一字段契约未代码级冻结（仅 AuditLog 满足，见 §五） |
| 组织模型 | ✅ | Organization/OrganizationRelationship/UserOrganization 已就绪 |
| 身份/权限 | ❌ | 仅二元 admin/member 角色，无 Role/Permission/DataScope/OperationPolicy |
| 状态机 | ⚠️ 部分 | 财务审批、项目、任务有状态机；治理/合规无对象 |
| API 契约 | ⚠️ 部分 | 49 个云函数即 API（统一 `{ ret }` 契约），但无契约文档；缺少统一业务动作封装（幂等/事务） |
| Event 契约 | ⚠️ 部分 | BusinessEvent 已含 correlationId 字段，但业务链路未生成关联键 |

---

# 三、Phase 1 数据底座（状态：部分）

| 项 | 状态 | 缺口 |
|---|---|---|
| Cloud DB 模型 | ✅ | 21 张表（含事件/质量/自动化/审计/身份映射） |
| 主数据 | ❌ | Person/Department/Position/Term 未建模；会员仍是独立实体 |
| 数据质量 | ✅ | DQ-001~011 + 健康度快照 + 问题闭环 |
| 版本 | ❌ | 无 ChangeLog、历史对比/恢复；`version` 字段仅少量对象具备 |
| 审计 | ✅（云侧）/ ⚠️（入口） | AuditLog 对象 + record/get + 10 个关键业务函数已接入；Web 审计页与端侧查询入口待建设 |
| 文件存储 | ❌ | Cloud Storage 未接入；文档/证照/合同均为空对象 |

---

# 四、Phase 2 业务服务 / Phase 3 自动化治理 / Phase 4 全域感知

## 4.1 Phase 2 业务服务（状态：部分）

- 云函数承担了业务服务层职责（49 个，全部走 `{ ret: { code, message, data } }` 契约，全量 TS 编译通过）✅
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

# 五、统一字段契约审计（21 张表 · 第二轮口径）

约定统一字段：`id orgId code status createdAt createdBy updatedAt updatedBy version sourceType sourceId`

| 对象类型 | 缺失字段 |
|---|---|
| ApprovalFlow | code,status,createdBy,updatedBy,version,sourceType,sourceId |
| ApprovalInstance | code,updatedBy,version,sourceType,sourceId |
| AppUser | orgId,code,status,createdBy,updatedBy,version,sourceType,sourceId |
| AuditLog | （无，完整满足） |
| AutomationRunLog | code,createdAt,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| AutoTask | code,createdBy,updatedBy,version,sourceId |
| BusinessEvent | code,status,createdBy,updatedAt,updatedBy |
| DataQualityIssue | code,createdBy,updatedBy,version,sourceType,sourceId |
| DataQualitySnapshot | code,status,createdBy,updatedAt,updatedBy,version,sourceType,sourceId |
| ExternalIdentity | id,orgId,code |
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

> 结论：**21 张表中仅 1 张（AuditLog）完整满足统一字段契约，20 张存量表需按优先级分批补齐**（业务主数据优先，治理/感知数据随后）。新增对象（WorkItem 等）必须自建时即满足契约。

---

# 六、云端权限审计（49 个云函数 · 第二轮口径）

## 6.1 第一轮高风险项：已全部修复

| 函数 | 第一轮问题 | 修复后 |
|---|---|---|
| upsert-member / upsert-project / upsert-notice | 无身份校验 | ✅ 已增加 userId + UserOrganization 成员校验 |
| delete-member / delete-project / delete-notice | 无身份校验 | ✅ 已增加 userId + 成员校验 |
| get-all-data | 无身份校验 | ✅ 已增加 userId + 成员校验 |
| get-org-hierarchy | 无身份校验 | ✅ 已增加 userId + 成员校验 |
| set-org-relationship | 无身份校验 | ✅ 已增加 userId + 成员 + admin 校验 |
| dingtalk-list-departments | 无身份校验 | ✅ 已增加 userId + 成员 + admin 校验 |

> 修复落地：commit「云端权限安全加固（Web 前置 P0-1）」，同步队列与 `get-all-data` 拉取自动注入 userId。

## 6.2 已具备校验（抽查通过）

- 财务/审批/结账/设置/数据质量/自动化治理类函数均校验成员身份，管理员操作（结账、反结账、审批流保存、期初余额、组织设置、管理员转让）校验 admin ✅

## 6.3 说明

- `login-user` / `register-user` / `get-user-settings` / `save-user-settings` 为用户级公开接口，无需组织成员校验 ✅
- `create-org` 创建组织时用户尚不属于任何组织，属正常 ✅

---

# 七、Web 开发前必修（P0）清单

> ⚠️ **当前阻塞项以 §〇 0.2 的 P0-A ~ P0-E 为准**；下表为第一轮历史清单，仅作追溯。

| 编号 | 事项 | 对应路线章节 | 工作量 |
|---|---|---|---|
| P0-1 | 修复 10 个云函数权限校验缺口（成员/admin） | §5、§21 | ✅ 已完成（commit：安全权限修复） |
| P0-2 | 新增 AuditLog（对象 + record/get 函数 + 关键业务接入） | §4.4、§25 | ✅ 已完成（commit：审计日志）；Web 查询入口待建设 |
| P0-3 | BusinessEvent 增加 correlationId | §7、§23 | ⚠️ 字段级完成（commit：事件关联链路）；链路未贯通、Flutter 模型未同步 |
| P0-4 | 冻结云数据契约文档 | §4、§22 | ✅ 文档完成（docs/云数据契约.md）；代码级冻结未完成（1/21 表） |
| P0-5 | 跨端统一身份 | 跨端统一用户身份与唯一标识规范 | ⚠️ 云侧引导层已完成；客户端 19 处 openId 迁移与 User/Person/Membership 落地待三端（现 P0-B） |
| P0-6 | 统一工作项 WorkItem | §9 | ❌ 未完成（现 P0-A） |

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

> 其中 AuditLog 已云侧闭环（第一轮 P0-2）；WorkItem 为当前阻塞项 P0-A；ChangeLog/Notification/Rule 等按 Web 第一阶段“决议执行中心 → 任期自动化 → 合规自动化”顺序建模。
