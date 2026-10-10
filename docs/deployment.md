# 部署指南

完整的端云一体化部署流程，从环境准备到验收联调。本文件是 AGC 部署与联调的**单一信息源**。

---

## 一、前置要求

| 工具 | 版本 | 备注 |
|------|------|------|
| Flutter-OH | **3.41.10-ohos-1.0.1** | 鸿蒙定制版（含 Dart 3.11） |
| DevEco Studio | 6.1+ | 安装时勾选 HarmonyOS SDK |
| JDK | 17 | 构建必需 |
| Node.js | 18+ | hvigor/ohpm 依赖；Web 端建议 20+（pnpm） |

环境变量：`DEVECO_SDK_HOME`、`HOS_SDK_HOME`、`PUB_HOSTED_URL=https://pub.flutter-io.cn`、`FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn`。详细支持环境矩阵见 [`SUPPORTED.md`](../SUPPORTED.md)。

---

## 二、应用关联

1. AGC 控制台创建项目与应用，**包名必须等于** `com.hnmrxz.smart_society`。
2. 启用数据处理位置（必须含中国站点），开通云开发服务（云函数 + 云数据库）。
3. 开通华为 Account Kit，在 AGC 配置 OAuth 回调。

---

## 三、项目侧配置

| 项 | 位置 |
|----|------|
| `agconnect-services.json` | `entry/src/main/resources/rawfile/`（已加入 `.gitignore`） |
| 云开发初始化 + 认证 | `EntryAbility.ets`：`cloudCommon.init({ region: CHINA, authProvider })` |
| 云函数桥接 | `EntryAbility.ets` → `com.smartsociety/cloud` → `cloudFunction.call` |
| 认证桥接 | `EntryAbility.ets` → `com.smartsociety/auth` → 登录/退出/获取用户信息 |
| 存储桥接 | `EntryAbility.ets` → `com.smartsociety/storage` → `getStoragePath` |

---

## 四、云数据库

32 个对象类型定义位于 `CloudProgram/clouddb/objecttype/`（对象清单与统一字段契约见 [`docs/data-contract.md`](data-contract.md)）：

| 对象类型 | 主键 | 说明 |
|----------|------|------|
| Member / Project / Notice | id | 业务主数据（+orgId 隔离，tasks/milestones 内嵌 JSON） |
| Organization / OrganizationRelationship / UserOrganization | orgId / relId / id | 组织、组织间关系、用户-组织关联 |
| OrgSettings / UserSettings | orgId / userId | 组织级设置（roleLabels、ruleConfig、钉钉凭证）/ 用户级设置 |
| AppUser / ExternalIdentity / Person | id / identityId / personId | 账号、外部身份映射、自然人主档 |
| FinanceRecord / ApprovalFlow / ApprovalInstance / FinanceOpeningBalance | id | 财务单据、审批流、审批实例、期初余额 |
| BusinessEvent / DataQualityIssue / DataQualitySnapshot | id | 业务事件、数据质量问题、健康度快照 |
| AutoTask / RiskAlert / AutomationRunLog / AuditLog | id | 自动任务、风险预警、自动化运行日志、审计日志 |
| IdempotencyRecord / WorkItem | id | 幂等记录、统一工作项 |
| Role / Permission / DataScope | id | RBAC 角色、权限目录、数据范围 |
| Resolution / License / ComplianceItem / Term | id | 决议、证照、合规事项、任期 |
| Document | id | 云存储文件元数据（软删） |

权限配置：World/Authenticated 仅可读，Creator/Administrator 可读写删。端侧不直连云数据库，由云函数服务端 SDK 访问；`OrgSettings` 中的钉钉凭证由 `get-org-settings` 按角色裁剪，普通成员不可见。

### OrgSettings.ruleConfig 控制台同步（手动步骤）

`OrgSettings` 对象类型新增 `ruleConfig` 字段（`mobile/CloudProgram/clouddb/objecttype/OrgSettings.json` 已更新），需在 AGC 控制台同步：

1. 登录 AGC 控制台 → 我的项目 → 选择 `com.hnmrxz.smart_society` 所属项目。
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
5. `ruleConfig` 存储格式（JSON 字符串）：`{ "disabled": ["GR-03", "GR-08"] }`

---

## 五、云函数部署

80 个云函数（HTTP 触发器、POST、认证类型 `apigw-client`，统一返回 `{ ret: { code, message, data } }`）的功能分类见 [`docs/api-contract.md`](api-contract.md) 附录。

> **部署顺序**：先完成 §四 OrgSettings.ruleConfig 控制台同步，再部署 `run-governance-rules` 与 5 个新函数，最后按 §八 验收清单联调。

### CLI 部署不可用说明

当前工具链**无云函数部署通道**：

1. `devecocli`：提供模拟器管理、签名材料生成等能力，但当前版本**不包含云函数部署命令**。
2. `hvigor`：Flutter-OH 工具链的构建仅覆盖 `Application` 模块（端侧 HAP），**无法触达 `CloudProgram` 云函数工程**。
3. 结论：云函数部署必须走 DevEco Studio 图形界面或 AGC 控制台在线编辑器。

### 方式 A（推荐）——DevEco Studio

1. DevEco Studio 打开 `mobile/` 目录（工程根，仅含 `Application/` + `CloudProgram/`）。
2. 在 Project 视图定位 `CloudProgram/cloudfunctions/<函数名>`。
3. 右键函数目录 → **Deploy Cloud Function**（首次部署会同时创建 HTTP 触发器）。
4. `run-governance-rules` 为重新部署：直接重复上述操作覆盖云端版本。

### 方式 B——AGC 控制台在线编辑器

1. 「云开发 > 云函数」→ 创建函数（名称与清单一致）。
2. 将本地 `index.ts` 连同同目录模型类 `.ts` 文件打包上传（或在线粘贴，注意一并上传 `WorkItem.ts` / `OrgSettings.ts` 等模型类）。
3. 配置 HTTP 触发器（POST，认证类型 `apigw-client`），记录访问域名。

---

## 六、Web 接入真实网关

### 环境变量

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

### 认证链联调步骤

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
2. Web 会话仅保存 `userId` / 组织上下文 / 权限快照；`userId` 是唯一业务主键，禁止用手机号/OpenID 替代（详见 [`docs/identity-spec.md`](identity-spec.md)）。
3. 每次组织切换后必须重新调用 `get-my-permissions`；前端权限仅控制 UI 展示，服务端仍逐请求校验。

---

## 七、云存储配置

云存储安全规则与桶目录布局见 [`docs/cloud-storage-security.md`](cloud-storage-security.md)。要点：

1. **开通云存储**：AGC 控制台 → Serverless → 云存储，创建存储实例，将桶名配置到云函数环境变量 `CLOUD_STORAGE_BUCKET`。
2. **粘贴安全规则**：按 cloud-storage-security.md 第二节配置，先配置再上线，避免窗口期内客户端直写任意路径。
3. **云函数依赖**：涉及存储操作的函数依赖 `@agconnect/cloudstorage-server@1.0.1`；运行时通过 `AGC_CONFIG`（自动注入）初始化，无需提交密钥。

---

## 八、验收清单

部署完成后按下列清单逐项验收（全部通过视为联调成功）：

### 权限与隔离

- [ ] 非组织成员调用任一新函数（携带他人 orgId/userId）→ 返回 `code=-1, message=您不是该组织成员`
- [ ] 普通成员（member）调用 `set-rule-enabled` → 返回「仅组织管理员可以启停治理规则」
- [ ] `search-all` / `get-rule-config` / `get-automation-logs` / `get-report-stats` 普通成员可调用

### 参数校验

- [ ] 任一新函数缺 `orgId` 或 `userId` → 返回「缺少 orgId/userId 参数」
- [ ] `set-rule-enabled` 传入 `ruleId=GR-99` → 返回「规则编号无效：GR-99」
- [ ] `set-rule-enabled` 不携带 `idempotencyKey` → 返回「缺少 idempotencyKey（写操作强制幂等）」
- [ ] `search-all` 空关键词 → 返回 `{ results: [] }`

### 幂等重试

- [ ] `set-rule-enabled` 同一 `idempotencyKey` 重复提交 → 第二次返回首次结果，`message=ok（幂等返回）`
- [ ] 处理窗口内（120s）并发重复提交 → 返回「操作正在处理中，请勿重复提交」
- [ ] 执行失败后重试 → 幂等记录置 `failed`，同键可重新认领执行

### correlationId 贯通

- [ ] `set-rule-enabled` 携带 `correlationId` → 事后在 Web「审计与事件链」页按该 `correlationId` 可同时检索到 `AuditLog` 与 `BusinessEvent` 记录

### 规则启停联动

- [ ] `get-rule-config` 返回 12 条规则，`enabled` 与控制台 `OrgSettings.ruleConfig` 的 `disabled` 集合互补一致
- [ ] 停用某规则后手动触发 `run-governance-rules` → 返回 `actions.skippedRules` 包含被停用规则，且该规则不产生新的自动任务/风险
- [ ] 重新启用后再次运行 → 该规则恢复检测

### 查询与聚合

- [ ] `get-automation-logs`：分页生效，`runAt` 倒序
- [ ] `get-report-stats`：返回五组聚合结果（financeTrend/riskDistribution/dqDimensions/projectStatus/totals）
- [ ] `search-all`：关键词可命中七类对象，每类≤20 条

---

## 九、常见问题

| 问题 | 解决方案 |
|------|----------|
| 调用报 `160404: Trigger not exist` | 函数未部署或 HTTP 触发器未创建，重新部署 |
| 云函数报 `2047: the input class is invalid` | 函数目录内模型类未一并上传 |
| 控制台同步 OrgSettings 失败 / 部署云数据库报 `Failed to decode response body` | 多为云数据库服务未开通/登录态失效/网络代理拦截；确认服务开通后 DevEco 重新登录再试 |
| `set-rule-enabled` 一直返回「操作正在处理中」 | 前一次请求异常中断且未置 failed；等待 120s 认领超时后重试，或换用新幂等键 |
| `get-rule-config` 全部返回 enabled=true 但控制台已配置禁用 | 检查 `ruleConfig` 是否为合法 JSON 字符串（损坏时云函数按全部启用兜底） |
| Web 请求全部 401/403 | 确认 HTTP 触发器认证类型为 `apigw-client`、证书指纹已在 AGC 登记；Web 侧确认 `VITE_API_MODE=agc` 且 body 已合并 `orgId/userId` |
| `flutter doctor` 报 OpenHarmony toolchain 缺失 | 检查 `DEVECO_SDK_HOME` / `HOS_SDK_HOME` |
| 真机签名失效 | DevEco → Project Structure → Signing Configs 重新生成 |
| DevEco 不显示 CloudProgram | 用 DevEco 打开 `mobile/` 目录，确保其下仅有 `Application/` + `CloudProgram/` |
| 华为账号登录失败 | 确认 AGC 已开通 Account Kit、OAuth 回调已配置 |
| 同步队列堆积 | 检查网络连接，恢复后 30s 周期内自动推送 |
| 设置保存报"保存失败" / 报缺参 | 设置保存必须先云端成功后本地生效；检查网络与 get/save-org-settings、get/save-user-settings 是否已部署 |
| `flutter test` 挂起无输出 | 测试内真实 IO（如 `Hive.openBox`）必须包在 `tester.runAsync()` 中执行 |
