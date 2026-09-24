# 社易管 AGC 部署联调指南

> 范围：本轮新增 5 个云函数 + `run-governance-rules` 改造版 + `OrgSettings.ruleConfig` 字段的部署清单、Web 接入真实网关步骤与联调验收清单。
> 前置阅读：`README.md`「鸿蒙云开发（AGC）配置」、`docs/业务API契约.md`、`docs/云数据契约.md`。

---

## 一、部署清单

本轮需部署/重新部署的云函数（全部为 HTTP 触发器、POST、认证类型 `apigw-client`，统一返回 `{ ret: { code, message, data } }`）：

| 函数 | 类型 | 说明 | 依赖对象类型 |
|---|---|---|---|
| `search-all` | **新增** | 全域检索：跨工作项/风险/自动任务/事件/成员/项目/公告统一关键词搜索（每类上限 20 条） | WorkItem / RiskAlert / AutoTask / BusinessEvent / Member / Project / Notice / UserOrganization |
| `get-rule-config` | **新增** | 治理规则配置查询：返回 GR-01~12 规则定义（WHEN/IF/THEN）与启停状态 | OrgSettings / UserOrganization |
| `set-rule-enabled` | **新增** | 治理规则启停（仅管理员，强制幂等键，审计+事件） | OrgSettings / IdempotencyRecord / AuditLog / BusinessEvent / UserOrganization |
| `get-automation-logs` | **新增** | 自动化运行日志分页查询（runAt 倒序，pageSize≤100） | AutomationRunLog / UserOrganization |
| `get-report-stats` | **新增** | 治理报表聚合：收支月度趋势/风险分布/数据质量维度/项目状态/汇总指标 | FinanceRecord / RiskAlert / Project / Member / DataQualitySnapshot / WorkItem / AutomationRunLog / UserOrganization |
| `run-governance-rules` | **改造，需重新部署** | 规则引擎接入规则启停：读取 `OrgSettings.ruleConfig`，跳过被禁用规则并在结果 `actions.skippedRules` 与日志中记录 | 原有对象 + OrgSettings |

> 部署顺序：先完成「二、OrgSettings.ruleConfig 控制台同步」，再部署 `run-governance-rules` 与 5 个新函数，最后按「五、验收清单」联调。

---

## 二、OrgSettings.ruleConfig 控制台同步（手动步骤）

`OrgSettings` 对象类型新增 `ruleConfig` 字段（`mobile/CloudProgram/clouddb/objecttype/OrgSettings.json` 已更新），需在 AGC 控制台同步：

1. 登录 [AGC 控制台](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html) → 我的项目 → 选择 `com.hnmrxz.smart_society` 所属项目。
2. 「云开发 > 云数据库 > 对象类型」→ 找到 `OrgSettings` → 编辑字段。
3. 新增字段：

| 属性 | 值 |
|---|---|
| fieldName | `ruleConfig` |
| fieldType | `String` |
| notNull | 是 |
| defaultValue | `{}` |
| isNeedEncrypt / isSensitive | 否 |
| belongPrimaryKey | 否 |

4. 发布对象类型变更。存量组织行无需回填：云函数侧对空/损坏的 `ruleConfig` 一律按 `{}`（全部启用）兜底处理。
5. `ruleConfig` 存储格式（JSON 字符串）：

```json
{ "disabled": ["GR-03", "GR-08"] }
```

---

## 三、CLI 部署不可用说明（T019 结论）

本轮曾尝试通过命令行完成云函数与 schema 部署，结论为**当前工具链无云函数部署通道**：

1. `devecocli`：提供模拟器管理、签名材料生成等能力，但当前版本**不包含云函数部署命令**。
2. `hvigor`：Flutter-OH 工具链的构建仅覆盖 `Application` 模块（端侧 HAP），**无法触达 `CloudProgram` 云函数工程**。
3. 结论：云函数部署必须走 DevEco Studio 图形界面或 AGC 控制台在线编辑器（手动步骤见下）。

### 手动部署步骤

**方式 A（推荐）——DevEco Studio：**

1. DevEco Studio 打开 `mobile/` 目录（工程根，仅含 `Application/` + `CloudProgram/`）。
2. 在 Project 视图定位 `CloudProgram/cloudfunctions/<函数名>`。
3. 右键函数目录 → **Deploy Cloud Function**（首次部署会同时创建 HTTP 触发器）。
4. `run-governance-rules` 为重新部署：直接重复上述操作覆盖云端版本。

**方式 B——AGC 控制台在线编辑器：**

1. 「云开发 > 云函数」→ 创建函数（名称与清单一致）。
2. 将本地 `index.ts` 连同同目录模型类 `.ts` 文件打包上传（或在线粘贴，注意一并上传 `WorkItem.ts` / `OrgSettings.ts` 等模型类）。
3. 配置 HTTP 触发器（POST，认证类型 `apigw-client`），记录访问域名。

---

## 四、Web 接入真实网关

### 4.1 环境变量

复制 `web/.env.production.example` 为 `web/.env.production` 并填写：

```bash
# 生产/联调必须为 agc（URL = ${VITE_API_BASE_URL}/${functionName}，body 自动合并 orgId/userId）
VITE_API_MODE=agc
# 云函数 HTTP 触发器访问域名：AGC 控制台「云开发 > 云函数 > 触发器」获取
VITE_API_BASE_URL=https://<your-agc-cloudfunction-http-trigger-domain>
# 请求超时（毫秒）
VITE_API_TIMEOUT_MS=30000
```

> Web 端不使用 `client_secret` / AGC SDK 凭据，避免在前端暴露密钥；`agconnect-services.json` 仅作 region/project_id 参考。开发态 Mock（`web/mock/dev-api.ts`）仅在 `vite serve` 时生效，生产构建不包含。

### 4.2 认证链联调步骤

Web 端密码账号认证链：

```text
register-user（手机号/邮箱 + 密码注册，可选）
  → login-user(account, password)          # 返回 { userId, displayName, phone, email }
  → get-my-orgs(userId)                    # 组织列表（orgId/role）
  → 用户选择组织（组织切换）
  → get-my-permissions(orgId, userId)      # { roleId, permissions, dataScope } 写入会话
```

移动端华为账号链（对照）：

```text
Account Kit 登录 → ensure-user-identity(provider + providerSubject) → 稳定内部 userId
  → get-my-orgs → get-my-permissions（同上）
```

联调要点：

1. `login-user` 的 `account` 支持手机号（`1` 开头 11 位）或邮箱，账号大小写不敏感；密码错误与账号不存在返回不同 `message`。
2. Web 会话仅保存 `userId` / 组织上下文 / 权限快照；`userId` 是唯一业务主键，禁止用手机号/OpenID 替代。
3. 每次组织切换后必须重新调用 `get-my-permissions`；前端权限仅控制 UI 展示，服务端仍逐请求校验。

---

## 五、验收清单

部署完成后按下列清单逐项验收（全部通过视为联调成功）：

### 5.1 权限与隔离

- [ ] 非组织成员调用任一新函数（携带他人 orgId/userId）→ 返回 `code=-1, message=您不是该组织成员`（HTTP 层可能为 403，以 `ret.code` 为准）。
- [ ] 普通成员（member）调用 `set-rule-enabled` → 返回「仅组织管理员可以启停治理规则」。
- [ ] `search-all` / `get-rule-config` / `get-automation-logs` / `get-report-stats` 普通成员可调用（只读，成员校验通过即可）。

### 5.2 参数校验

- [ ] 任一新函数缺 `orgId` 或 `userId` → 返回「缺少 orgId/userId 参数」。
- [ ] `set-rule-enabled` 传入 `ruleId=GR-99` → 返回「规则编号无效：GR-99」（合法集合 GR-01~12）。
- [ ] `set-rule-enabled` 不携带 `idempotencyKey` → 返回「缺少 idempotencyKey（写操作强制幂等）」。
- [ ] `search-all` 空关键词 → 返回 `{ results: [] }`（避免全表扫描）。

### 5.3 幂等重试

- [ ] `set-rule-enabled` 同一 `idempotencyKey` 重复提交 → 第二次返回首次结果，`message=ok（幂等返回）`。
- [ ] 处理窗口内（120s）并发重复提交 → 返回「操作正在处理中，请勿重复提交」。
- [ ] 执行失败后重试 → 幂等记录置 `failed`，同键可重新认领执行。

### 5.4 correlationId 贯通

- [ ] `set-rule-enabled` 携带 `correlationId` → 事后在 Web「审计与事件链」页按该 `correlationId` 可同时检索到 `AuditLog`（action=set-rule-enabled，含改前/改后 enabled 值）与 `BusinessEvent`（entityType=rule）记录，两者关联键一致。

### 5.5 规则启停联动

- [ ] `get-rule-config` 返回 12 条规则，`enabled` 与控制台 `OrgSettings.ruleConfig` 的 `disabled` 集合互补一致。
- [ ] 停用某规则（如 GR-03）后手动触发 `run-governance-rules` → 返回 `actions.skippedRules` 包含 `GR-03`，函数日志输出 `skipped=[GR-03]`，且该规则不产生新的自动任务/风险。
- [ ] 重新启用后再次运行 → 该规则恢复检测。

### 5.6 查询与聚合

- [ ] `get-automation-logs`：`page`/`pageSize` 分页生效（`pageSize` 上限 100），`runAt` 倒序，返回 `total/hasMore`。
- [ ] `get-report-stats`：返回 `financeTrend`（已批准单据按月聚合）、`riskDistribution`、`dqDimensions`（最新快照）、`projectStatus`（筹备中/进行中/已暂停/已完成）、`totals`（members/projects/pendingWorkItems/dqScore/successRate）。
- [ ] `search-all`：关键词可命中成员（姓名/手机号/邮箱/部门/学号）、项目、公告、工作项、风险、自动任务、事件七类，每类≤20 条。

---

## 六、常见问题

| 问题 | 解决方案 |
|---|---|
| 调用报 `160404: Trigger not exist` | 函数未部署或 HTTP 触发器未创建，重新部署 |
| 云函数报 `2047: the input class is invalid` | 函数目录内模型类未一并上传（模型类需实现 CloudDB SDK 要求的 5 个方法） |
| 控制台同步 OrgSettings 失败 / 部署云数据库报 `Failed to decode response body` | 多为云数据库服务未开通/登录态失效/网络代理拦截；确认服务开通后 DevEco 重新登录再试 |
| `set-rule-enabled` 一直返回「操作正在处理中」 | 前一次请求异常中断且未置 failed；等待 120s 认领超时后重试，或换用新幂等键 |
| `get-rule-config` 全部返回 enabled=true 但控制台已配置禁用 | 检查 `ruleConfig` 是否为合法 JSON 字符串（损坏时云函数按全部启用兜底） |
| Web 请求全部 401/403 | 确认 HTTP 触发器认证类型为 `apigw-client`、证书指纹已在 AGC 登记；Web 侧确认 `VITE_API_MODE=agc` 且 body 已合并 `orgId/userId` |
