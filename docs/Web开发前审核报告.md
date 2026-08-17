# 社易管 Web 开发前审核报告

> **依据**：docs/产品审视与优化路线.md（V6.0）  
> **审核日期**：2026-08-17  
> **审核范围**：V6.0 Phase 0–4（统一契约、数据底座、业务服务、自动化治理、全域感知）在 Web 开发前必须就绪的项  
> **审核方法**：对照 V6.0 逐项盘点 CloudDB 对象类型、云函数源码、Flutter 端能力，逐项给出 状态/缺口/证据

---

## 阅读规则（口径说明）

1. **§〇 是本报告的当前权威结论**（2026-08-17 第二轮代码级核验 + H1/H2 加固）：Web 基础工程 GO；Web 核心业务 **AGC 部署与集成验证通过后 GO**（P0-A~P0-E 代码实现完成）。
2. **§一～§九 为第一轮历史审计记录**，其中描述“当前状态”的语句已在本轮同步修正为第二轮口径；若与 §〇 冲突，**一律以 §〇 为准**。
3. 本轮统一口径：**云函数 56 个、CloudDB 对象 27 张；新增对象（AuditLog/WorkItem/IdempotencyRecord/Role/Permission/DataScope/Person/ExternalIdentity）自建即满足统一字段契约，存量表按业务模块并行迁移；AuditLog 云侧已闭环；correlationId 全链贯通（待 AGC 部署后真实链路验收）**。

---

# 〇、Web 开发启动门禁（Go / No-Go 终审）

> **终审日期**：2026-08-17（第二轮代码级核验 + H1/H2 加固）  
> **结论：Web 基础工程 GO；Web 核心业务 AGC 部署与集成验证通过后 GO。**

当前已具备进入 **Web 基础工程搭建**（Layout/Design System/API Client/Auth/状态管理/数据模型/权限框架/基础组件）的条件；P0-A~P0-E **代码实现已完成并经 H1 安全加固**，correlationId 全链贯通（H2）。剩余为 **AGC 部署与集成验证**（CloudDB/云函数/Auth）与**统一字段契约并行迁移**，不再阻塞 Web 基础工程与通用组件开发。

## 0.1 逐项终审结果（代码级证据）

| 核验项 | 结论 | 证据 |
|---|---|---|
| ① Cloud DB 对象（27 张表） | ✅ 基础可用 | 27 张表 JSON 可解析；新增对象自建即满足统一字段 |
| ② 统一字段契约 | ⚠️ 并行迁移项（不阻塞 Web） | 新增对象（AuditLog/WorkItem/IdempotencyRecord/Role/Permission/DataScope/Person/ExternalIdentity）满足 11 项统一字段；存量表按业务模块分批补齐 `code/version/sourceType/sourceId` 等 |
| ③ 云函数权限 | ✅ 组织级已加固 | 56 个函数全量 TS 编译通过；组织级写接口已成员校验，管理员操作已 admin 校验（结账/审批流/期初/组织设置/关系/钉钉凭证/钉钉同步） |
| ④ AuditLog | ✅ 云侧闭环 / ⚠️ 查询入口待建 | AuditLog 对象 + record/get-audit-logs + 10 个关键业务函数接入（成员/项目/公告增删改、财务提交/审批/驳回/结账/反结账）；Web 审计页与端侧页面待建设 |
| ⑤ BusinessEvent / correlationId | ✅ 已全链贯通 | 业务动作生成关联键写入 BusinessEvent/AuditLog；规则引擎任务/风险与 WorkItem 携带同一关联键；Flutter 模型已同步 |
| ⑥ 跨端 userId | ✅ 客户端已落地 | 华为登录自动换取内部 userId，原 19 处 openId 用法已替换；Person 对象已建 |
| ⑦ User/Person/Membership | ✅ 第一版落地 | AppUser（User）+ Person + UserOrganization（OrganizationMembership，含 roleId/dataScope/status） |
| ⑧ Role/Permission/DataScope | ✅ 第一版落地 | Role/Permission/DataScope 对象 + get-my-permissions 云端鉴权（内置矩阵+回退兼容）+ 管理配置接口 |
| ⑨ WorkItem | ✅ 第一版落地 | WorkItem 对象 + refresh/get/act 云函数 + 移动端统一工作项页 |
| ⑩ 统一业务 API | ✅ 第一版落地 | 业务动作命名规范冻结于 docs/业务API契约.md；审批/财务/风险/数据治理/工作项已动作化 |
| ⑪ 服务端幂等 | ✅ 第一版落地 | IdempotencyRecord + 7 个关键动作函数幂等键支持 |
| ⑫ Flutter Models 与契约一致性 | ⚠️ 部分同步（并行迁移） | 新对象（BusinessEvent correlationId/WorkItem/Role 等）已同步；存量业务模型（Member/Project/Notice 等）统一字段随表结构迁移 |
| ⑬ Web 工程 | ⚠️ 仅壳 | `web/` 仅 README.md，无工程初始化 |
| ⑭ cloud_objects IdGenerator | ⚠️ 编译 stub | `id-generator/IdGenerator.ts` 为 Cloud Object 编译生成占位，`randomUUID` 未实现，不代表身份体系完成 |

## 0.2 P0 门禁项（代码实现完成）

| 编号 | 阻塞项 | 现状 | 要求 |
|---|---|---|---|
| P0-A | WorkItem 统一工作项 | ✅ **代码实现完成**（commit：WorkItem + H1 DataScope 加固）；服务端 DataScope 前置过滤，total/openCount 过滤后口径 | 审批/自动任务/项目任务/风险整改/数据治理统一抽象，Web 只消费 WorkItem 视图 |
| P0-B | 跨端 userId 客户端落地 | ✅ **代码实现完成**（commit：跨端身份客户端落地 + H1 身份有效性校验）；登录自动换取内部 userId，原 19 处 openId 用法已替换 | 登录后调用 ensure-user-identity 换取内部 userId；建立 User→Person→OrganizationMembership 链；Gateway token→userId 为 AGC 联调项 |
| P0-C | Role/Permission/DataScope | ✅ **代码实现完成**（commit：RBAC）；Role/Permission/DataScope 对象 + get-my-permissions + get-roles/save-role/save-data-scope + UserOrganization.roleId/dataScope | 云端鉴权底座（会长/秘书长/财务/理事/监事等）；Web API Client 禁止以页面传入 userId/roleId 作为权限依据 |
| P0-D | 统一业务动作 API | ✅ **代码实现完成**（commit：统一业务API与幂等）；动作契约冻结于 docs/业务API契约.md | 审批/财务/风险/数据治理/工作项已动作化；决议执行、项目进度上报随新对象扩展 |
| P0-E | 服务端幂等 | ✅ **实现层完成**（commit：H1 原子认领）；claim(processing+claimId)→执行→done/failed，缺失 key 拒绝 | 并发单执行窗口最小化；严格 Exactly-Once 可选后端分布式锁（Web 阶段增强） |

## 0.3 并行治理项与部署验证项（不阻塞 Web 基础工程）

- **统一字段契约（并行迁移项）**：新对象必须完整契约；存量表（Member/Project/Notice/FinanceRecord 等）按业务模块分批补齐 `code/version/sourceType/sourceId/createdBy/updatedBy`，Flutter/Web 模型同步
- **correlationId（部署验证项）**：H2 已全链贯通（动作→事件→审计→规则→任务/风险→工作项），**待 AGC 部署后进行真实链路验收**
- **Gateway token→userId（AGC 联调项）**：当前以内部 userId 有效性校验兜底；Web 阶段与 AGC 确认 apigw-client 调用者身份上下文，接入 Access Token → ExternalIdentity → userId
- **AuditLog 查询入口（Web 开发阶段建设）**：云侧 get-audit-logs 已就绪，Web 审计页按权限码 `audit:view` 建设
- **API 契约文档（已完成，随动作扩展）**：动作命名、幂等契约已冻结于 docs/业务API契约.md；权限矩阵/状态机表随新对象补充

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

> 门禁更新规则：P0-A ~ P0-E 代码实现完成（含 H1/H2 加固）后为“条件 GO”；**AGC 部署与集成验证通过后正式登记“核心业务 GO”**。

## 0.5 最终门禁状态

```text
SmartSociety Web 开发门禁
────────────────────────────
 Web 基础工程              GO
 P0-A WorkItem             GO（含 H1 DataScope 前置过滤）
 P0-B 跨端 userId          GO（含 H1 身份有效性校验）
 P0-C RBAC/DataScope       GO
 P0-D Business API         GO
 P0-E Idempotency          GO（原子认领 + 强制 key）
 H2 correlationId          GO（代码完成，待 AGC 部署验证）
 统一字段契约              并行迁移，不阻塞 Web
 Gateway Token → userId    AGC 联调项
 AuditLog Web 查询          Web 开发阶段建设
────────────────────────────
 结论：Web 基础工程 GO；Web 核心业务 AGC 部署与集成验证通过后 GO
```

### 门禁变更记录

| 日期 | 结论 | 说明 |
|---|---|---|
| 2026-08-17 | 基础工程 Go / 核心业务 No-Go | 首版门禁：5 项 P0 架构缺口待封口 |
| 2026-08-17 | 基础工程 Go / 核心业务 条件 Go | P0-A~E 第一版全部封口（WorkItem/跨端userId/RBAC/统一业务API/幂等），待 AGC 部署验证后正式放行 |
| 2026-08-17 | 基础工程 Go / 核心业务 条件 Go（加固中） | P0 验收加固 H1：幂等改原子认领+强制 key；WorkItem DataScope 服务端过滤；权限函数身份有效性校验；钉钉同步补 admin 校验；静态安全扫描 |
| 2026-08-17 | 基础工程 Go / 核心业务 条件 Go（加固完成，待部署验证） | P0 验收加固 H2：correlationId 全链贯通（动作→事件→审计→规则→任务/风险→工作项）；56 函数全量编译通过 |
| 2026-08-17 | **Web 基础工程 GO / 核心业务 AGC 验证后 GO（最终门禁）** | P0-A~E 代码实现完成（含 H1 加固）；correlationId 全链贯通（H2）；统一字段契约并行迁移；Gateway 认证为 AGC 联调项 |

---

# 十、P0 验收加固记录

## 10.1 H1 安全与一致性加固（已完成）

| 项 | 加固内容 |
|---|---|
| 幂等（P0-E） | `IdempotencyRecord` 增加 status/claimId/requestHash/updatedAt；7 个关键动作函数改为“认领(processing+claimId)→执行→提交(done)/失败(failed)”，并发请求拒绝重复执行，超时允许重领；**关键动作缺失 idempotencyKey 直接拒绝** |
| WorkItem DataScope（P0-A） | `get-work-items` 服务端解析数据范围（用户级 DataScope > 角色级 > 默认 org），`self` 时按 ownerId 在**查询前**过滤，total/openCount 均为过滤后口径 |
| 身份有效性（P0-B） | `get-my-permissions` / `get-work-items` / `get-audit-logs` 校验请求体 userId 必须是已注册内部用户（AppUser 存在），拒绝伪造身份 |
| 权限扫描（P0-C） | 56 个函数全量静态扫描：组织级接口成员校验全覆盖；钉钉同步补 admin 校验（与部门列表一致）；join-org/注册登录/用户级接口按设计豁免 |
| 认证主体绑定 | 当前 apigw-client 网关未暴露调用者身份上下文，先以“内部 userId 有效性校验”兜底；**网关认证绑定（token→userId）列为 Web 阶段 AGC 联调项** |

## 10.2 H2 事件关联链贯通（已完成）

- ✅ 已完成：7 个业务动作函数 + act-work-item 生成 correlationId 并写入 BusinessEvent / AuditLog；AutoTask / RiskAlert 增加 correlationId，规则引擎生成时携带；refresh-work-items 物化 WorkItem 时从来源复制关联键；get-work-items / get-governance-center / get-business-events 返回关联键；Flutter 模型同步，事件详情页展示关联ID

---

# 一、结论摘要

> ⚠️ 当前门禁以 §〇 0.5 最终门禁状态为准：**Web 基础工程 GO；核心业务 AGC 验证后 GO**。以下为第一轮历史审计记录。

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

# 五、统一字段契约审计（历史记录；表数以 §〇 0.1 为准）

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

> 结论（历史）：**当时 21 张表中仅 AuditLog 完整满足统一字段契约**。当前 27 张表中新增对象（AuditLog/WorkItem/IdempotencyRecord/Role/Permission/DataScope/Person/ExternalIdentity）自建即满足契约，存量表按业务模块并行迁移。

---

# 六、云端权限审计（历史记录；函数数以 §〇 0.1 为准）

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
