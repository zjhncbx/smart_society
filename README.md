# 社易管（SmartSociety）

<p align="center">
  <img src="Application/AppScope/resources/base/media/app_icon.png" width="96" height="96" alt="社易管 Logo" />
</p>

基于 **Flutter + HarmonyOS 混合开发** 的多组织社团管理平台，支持华为账号登录、多组织管理、自动双向同步、组织层级与数据共享。

- 应用显示名：社易管（英文 SmartSociety），包名 `com.hnmrxz.smart_society`
- 文档版本：V3.2.1
- 适用平台：Windows / macOS（开发），HarmonyOS NEXT（真机）
- 真机验证：华为 Mate 70 Pro+（HarmonyOS NEXT）

## 产品定位

- **多组织 SaaS 平台**：支持学校社团、志愿服务队、社会团体三类组织独立注册与管理，同一华为账号可加入多个组织。
- **移动管理端**：面向社长/队长/会长等管理人员，提供成员、项目、公告的全量管理能力。
- **华为账号认证**：集成华为 Account Kit，用户使用华为账号一键登录，端云全链路身份透传；同时支持手机号/邮箱密码注册登录（scrypt 加盐哈希存储，注销账号联动删除）
- **自动双向同步**：离线操作入队，联网后自动推送；云端数据变更可拉取合并，无需手动触发。
- **设置数据上云**：角色自定义名 / 钉钉配置 / 主题 / 昵称全部云端存储，换设备或重新登录自动恢复；角色名按组织独立存储，钉钉凭证仅组织管理员可见。

## 技术栈

| 层 | 技术 |
|----|------|
| UI / 业务 | Flutter（Dart 3.11），Flutter-OH 3.41.10 |
| 原生壳 | HarmonyOS（ArkTS，API 26） |
| 账号认证 | 华为 Account Kit（HuaweiIDProvider + AuthenticationController） |
| 状态管理 | Provider 6 |
| 路由 | go_router 14（StatefulShellRoute 四 Tab + 认证守卫） |
| 本地缓存 | Hive（settings / auth / organizations / syncQueue / members / projects / notices） |
| 网络请求 | Dio |
| 云开发 | 华为 AGC Serverless（云函数 + 云数据库） |
| 混合通信 | MethodChannel（存储路径 / 云函数 / 认证桥接） |
| UI 组件 | 自研 AppCard / StatusBadge / AppEmptyState / AppTheme |

## 功能清单

### 已实现（V3.2）

- **华为账号认证**：一键登录/退出，用户身份端云透传（`cloudCommon.init(authProvider)`）
- **多组织管理**：创建组织（学校社团/志愿服务队→自动生成 ID，社会团体→统一社会信用代码）、切换组织、加入已有组织
- **组织类型**：学校社团、志愿服务队、社会团体，引导页首次选择后自动创建首个组织
- **主题**：校园风（蓝）、青年风（紫）、公益红（红，合并原志愿/政务）；主题色按组织保存（管理员设置，成员共用），黑色深色模式为个人偏好（云端同步，仅影响本人设备）
- **角色体系**：分级角色 + 人数上限约束，名称可在设置中自定义，按组织独立存储并云端同步（`OrgSettings.roleLabels`）
  - 学校社团：社长(1)、部长(不限)
  - 志愿服务队：队长(1)、部长(不限)
  - 社会团体：会长(1)、副会长(不限)、秘书长(1)、理事(不限)、监事长(1)、监事(不限)
- **成员管理**：列表（搜索/角色筛选）、详情、新增/编辑、删除，按 orgId 隔离
- **项目管理**：项目/任务/里程碑三级管理、状态流转（筹备中→进行中→已暂停→已完成）、进度自动计算、任务指派负责人，按 orgId 隔离
- **通知公告**：发布、重要标记、已读状态，按 orgId 隔离
- **管理仪表盘**：成员总数 / 进行中项目 / 未读通知 / 同步状态统计
- **自动双向同步**：离线操作本地持久化 + 云端队列推送，30s 周期自动同步，失败操作保留在队列中等待重试；启动与切换组织时自动拉取云端数据落库
- **组织层级**：父-子组织和合作伙伴关系，支持成员/项目/公告选择性共享
- **多语言文案体系**：全部 UI 文案经 `OrgLabels` 按组织类型分发
- **钉钉通讯录单向同步**：按组织配置钉钉 Client ID/Secret，同步前可选择要同步的钉钉组织（部门），一键同步通讯录成员到本应用（`d+userid` 幂等 upsert、只增改不删）；自动取钉钉数据中的工号/手机号等作为会员编号（优先级：工号 > 手机号 > 固定电话 > unionid > userid）；启用钉钉的组织成员列表只读，但支持变更成员角色，同步默认分配普通成员（社员/队员/会员）并保留人工调整的角色
- **财务管理**：社会团体按《民间非营利组织会计制度》提供会计科目、记账凭证（借贷分录、平衡校验）、期初余额（支持从上期期末结转）、科目余额表、总账/明细账、资产负债表、业务活动表（限定/非限定）、现金流量表与期末结账（自动生成结转凭证）；学校社团/志愿组织提供简化版收支登记；财务单据可关联项目（项目预算/支出联动），并接入自定义审批流程（审批/办理/抄送三类节点），抄送与完成结果自动生成通知公告
- **工作台看板与 UI 设计语言**：工作台首页集成全览看板（成员/进行中项目/未读通知/待办统计、我的任务逾期与到期提醒、财务收支概览、预算预警、快捷入口、最近动态）；项目详情支持任务看板（待办/进行中/已完成三列、状态流转）；底部导航 5 栏（首页/成员/项目/通知/财务）；全局主题对标钉钉/飞书（浅灰画布、白卡细边框、语义化功能色、统一圆角与字阶、渐变头像、浮动圆角提示）。完整审视与优化路线见 `docs/产品审视与优化路线.md`
- **成员数据管理**：支持 CSV 导出与粘贴导入（钉钉托管组织仅可导出）；财务支持反结账（撤销结转凭证，恢复年度录入）
- **设置数据上云**：角色自定义名 / 钉钉配置 / 主题 / 昵称全部云端存储（`OrgSettings` / `UserSettings` 表），换设备或重新登录自动恢复；钉钉凭证仅组织管理员可见，普通成员只读同步状态；离线保存设置提示失败，读取用本地缓存兜底

### 规划中

- 钉钉群消息、审批流（接口已预留）
- 华为推送 Kit（公告推送）、扫码签到（PlatformView）

## 仓库结构

项目采用 DevEco Studio **端云一体化** 工程结构：

```
smart_society/                     # 仓库根目录（用 DevEco Studio 打开此目录）
├── README.md
├── .gitignore
├── Application/                   # 端侧工程（Flutter + HarmonyOS 原生壳）
│   ├── lib/                       # Flutter 业务代码
│   │   ├── main.dart / app.dart   # 入口，MultiProvider 初始化链路
│   │   ├── router.dart            # go_router 配置（含认证守卫 + 组织路由）
│   │   ├── config/                # 组织类型、主题、OrgLabels
│   │   ├── models/                # Member / Project / Notice / CustomRoleConfig
│   │   │                          # AuthUser / Organization / UserOrgMembership (new)
│   │   ├── providers/             # Settings / Auth / Organization / Sync
│   │   │                          # Member / Project / Notice / RoleConfig / OrgTree
│   │   ├── screens/
│   │   │   ├── auth/              # 登录页（华为账号一键登录）
│   │   │   ├── org/               # 组织创建 / 组织选择器
│   │   │   ├── member/ project/ notice/   # 三模块：列表 + 详情 + 表单
│   │   │   ├── profile/                    # 管理仪表盘（用户信息 + 组织切换）
│   │   │   └── settings/                   # 设置、角色编辑器、引导页
│   │   ├── services/
│   │   │   ├── auth_service.dart           # 华为账号 MethodChannel 桥接 (new)
│   │   │   ├── cloud_function_service.dart # 云函数调用（含 callWithRetry）
│   │   │   ├── storage_service.dart        # Hive 初始化
│   │   │   ├── api_client.dart             # Dio 封装
│   │   │   ├── dingtalk_api.dart           # 钉钉通讯录同步（云函数调用）
│   │   │   └── dingtalk_sync_service.dart  # 钉钉同步编排（同步+拉取落库）
│   │   ├── widgets/                # AppCard / StatusBadge / AppEmptyState / AppTheme
│   │   └── utils/
│   ├── entry/                      # 鸿蒙 entry 模块
│   │   └── src/main/ets/
│   │       ├── entryability/EntryAbility.ets   # 云开发初始化 + 3 个 MethodChannel
│   │       └── resources/rawfile/agconnect-services.json
│   ├── AppScope/
│   ├── build-profile.json5
│   ├── ohos/                       # → Application/ 自身（NTFS Junction）
│   └── pubspec.yaml
└── CloudProgram/                   # 云侧工程
    ├── cloud-config.json
    ├── clouddb/
    │   ├── db-config.json
    │   ├── objecttype/             # 12 个对象类型定义
    │   │   ├── Member.json         # +orgId +updatedAt
    │   │   ├── Project.json        # +orgId +updatedAt，tasks/milestones 为 JSON 字符串
    │   │   ├── Notice.json         # +orgId +updatedAt
    │   │   ├── Organization.json   # (new)
    │   │   ├── OrganizationRelationship.json  # (new)
    │   │   ├── UserOrganization.json          # (new)
    │   │   ├── OrgSettings.json               # (new) 组织级设置：角色名/钉钉配置
    │   │   └── UserSettings.json              # (new) 用户级设置：主题/昵称
    │   └── dataentry/              # 种子数据
    └── cloudfunctions/             # 34 个云函数
        ├── common/                 # 共享 TS 模型
        │   ├── Organization.ts
        │   ├── OrganizationRelationship.ts
        │   └── UserOrganization.ts
        ├── get-all-data/           # 全量拉取（按 orgId 过滤）
        ├── dingtalk-sync-contacts/ # 钉钉通讯录单向同步
        ├── dingtalk-list-departments/ # 钉钉组织架构（部门树）获取，同步前选择
        ├── save-approval-flow/     # 审批流程定义保存
        ├── get-approval-flows/     # 审批流程列表
        ├── submit-finance-record/  # 财务单据提交（发起审批）
        ├── act-finance-node/       # 审批/办理/驳回，流程推进 + 通知
        ├── get-finance-records/    # 财务单据列表/详情
        ├── get-approval-tasks/     # 我的待办
        ├── get-finance-stats/      # 收支/收入费用统计
        ├── save-opening-balances/  # 期初余额保存/上年期末结转
        ├── get-opening-balances/   # 期初余额查询
        ├── get-accounting-reports/ # 科目余额表/资产负债表/业务活动表/现金流量表
        ├── get-ledger/             # 总账/明细账
        └── close-period/           # 期末结账（生成结转凭证 + 通知）
        ├── upsert-member/  delete-member/
        ├── upsert-project/  delete-project/
        ├── upsert-notice/  delete-notice/
        ├── create-org/             # 创建组织
        ├── get-my-orgs/            # 获取用户所属组织列表
        ├── join-org/               # 加入已有组织
        ├── set-org-relationship/   # 设置组织间关系
        ├── get-org-hierarchy/      # 获取组织层级树
        ├── set-org-admin/          # 管理员变更
        ├── delete-org/             # 注销组织（级联删数据与设置）
        ├── bind-member/            # 按手机号绑定会员
        ├── delete-user/            # 注销账号（级联删组织与设置）
        ├── get-org-settings/  save-org-settings/    # 组织设置读写（钉钉凭证仅管理员）
        └── get-user-settings/  save-user-settings/  # 用户设置读写
```

> **注意**：`Application/ohos/` 是 NTFS Junction（目录联结），指向 `Application/` 自身，供 Flutter 工具链（`flutter build/run`）与 `flutter-hvigor-plugin` 解析 `ohos/local.properties`。**根目录无需创建 `ohos/` Junction**，否则 DevEco Studio 无法识别端云一体化工程（根目录必须仅含 `Application/` 与 `CloudProgram/` 两个目录）。

## 环境要求

| 工具 | 版本 | 备注 |
|------|------|------|
| Flutter-OH | **3.41.10-ohos-1.0.0** | 鸿蒙定制版 |
| Dart SDK | ^3.11.5 | 随 Flutter-OH |
| DevEco Studio | 6.1+ | 安装时勾选 HarmonyOS SDK |
| JDK | 17 | 构建必需 |
| Node.js | 18+ | hvigor/ohpm 依赖 |

环境变量：`DEVECO_SDK_HOME`、`HOS_SDK_HOME`、`PUB_HOSTED_URL=https://pub.flutter-io.cn`、`FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn`。

## 快速开始

```bash
cd Application
flutter doctor -v
flutter pub get
flutter analyze
flutter run --debug -d <deviceId>
```

首次启动流程：华为账号登录 → 引导页选择组织类型与主题 → 自动创建首个组织 → 进入主界面。

## 鸿蒙云开发（AGC）配置

### 1. 应用关联

1. AGC 控制台创建项目与应用，**包名必须等于** `com.hnmrxz.smart_society`。
2. 启用数据处理位置（必须含中国站点），开通云开发服务（云函数 + 云数据库）。
3. 开通华为 Account Kit，在 AGC 配置 OAuth 回调。

### 2. 项目侧配置

| 项 | 位置 |
|----|------|
| `agconnect-services.json` | `entry/src/main/resources/rawfile/`（已加入 `.gitignore`） |
| 云开发初始化 + 认证 | `EntryAbility.ets`：`cloudCommon.init({ region: CHINA, authProvider })` |
| 云函数桥接 | `EntryAbility.ets` → `com.smartsociety/cloud` → `cloudFunction.call` |
| 认证桥接 | `EntryAbility.ets` → `com.smartsociety/auth` → 登录/退出/获取用户信息 |
| 存储桥接 | `EntryAbility.ets` → `com.smartsociety/storage` → `getStoragePath` |

### 3. 云数据库

12 个对象类型定义位于 `CloudProgram/clouddb/objecttype/`：

| 对象类型 | 主键 | 说明 |
|----------|------|------|
| Member | id | 成员（+orgId 隔离） |
| Project | id | 项目（+orgId 隔离，tasks/milestones 内嵌为 JSON 字符串） |
| Notice | id | 公告（+orgId 隔离） |
| Organization | orgId | 组织信息 |
| OrganizationRelationship | relId | 组织间关系 |
| UserOrganization | id | 用户-组织关联 |
| OrgSettings | orgId | 组织级设置（roleLabels 为 JSON 字符串、钉钉凭证与同步记录） |
| UserSettings | userId | 用户级设置（主题序号、昵称） |
| FinanceRecord | id | 财务单据（收支单/记账凭证，含借贷分录、审批状态） |
| ApprovalFlow | id | 审批流程定义（节点含审批/办理/抄送） |
| ApprovalInstance | id | 审批实例（当前节点、处理记录，抄送/完成生成通知） |
| FinanceOpeningBalance | id | 会计科目期初余额（按年度） |

权限配置：World/Authenticated 仅可读，Creator/Administrator 可读写删。端侧不直连云数据库，由云函数服务端 SDK 访问；`OrgSettings` 中的钉钉凭证由 `get-org-settings` 按角色裁剪，普通成员不可见。

### 4. 云函数

34 个云函数，HTTP 触发器、POST、认证类型 `apigw-client`，统一返回 `{ ret: { code, message, data } }`。

**数据 CRUD（7 个，按 orgId 隔离）**：

| 函数 | 说明 |
|------|------|
| `get-all-data` | 全量拉取 Member / Project / Notice（按 orgId 过滤） |
| `upsert-member` / `delete-member` | 成员 upsert / 删除 |
| `upsert-project` / `delete-project` | 项目 upsert（含 tasks/milestones）/ 删除 |
| `upsert-notice` / `delete-notice` | 公告 upsert / 删除 |

**组织管理（7 个）**：

| 函数 | 说明 |
|------|------|
| `create-org` | 创建组织（校验名称唯一性、信用代码格式），自动添加创建者为管理员 |
| `get-my-orgs` | 获取当前用户所属所有组织及角色 |
| `join-org` | 加入已有组织 |
| `set-org-relationship` | 设置父-子或伙伴关系及数据共享策略 |
| `get-org-hierarchy` | 获取组织层级树 |
| `set-org-admin` | 变更组织管理员 |
| `delete-org` | 注销组织，级联删除该组织全部数据与设置 |

**用户与绑定（2 个）**：

| 函数 | 说明 |
|------|------|
| `bind-member` | 按手机号绑定会员 |
| `delete-user` | 注销账号，级联删除所属组织（唯一账号时）与用户设置 |

**钉钉同步（1 个）**：

| 函数 | 说明 |
|------|------|
| `dingtalk-sync-contacts` | 钉钉通讯录单向同步（凭证入参，`d+userid` 幂等批量 upsert） |
| `dingtalk-list-departments` | 获取钉钉组织架构（部门树），同步前选择要同步的组织 |

**财务与审批（7 个）**：
| 函数 | 说明 |
|------|------|
| `submit-finance-record` | 提交财务单据（收支/记账凭证），自动发起审批流程并生成抄送通知 |
| `act-finance-node` | 审批通过/驳回、办理完成；推进流程节点，完成时更新单据状态并通知 |
| `get-finance-records` | 财务单据列表/详情（含我可操作标记） |
| `get-finance-stats` | 收入/费用/结余汇总、按科目与按项目统计（收入费用表） |
| `get-approval-tasks` | 我的待办（当前节点处理人） |
| `save-approval-flow` / `get-approval-flows` | 审批流程定义保存（仅管理员）与列表 |

**财务结账与报表（5 个）**：
| 函数 | 说明 |
|------|------|
| `save-opening-balances` / `get-opening-balances` | 期初余额录入（仅管理员），支持从上期期末一键结转 |
| `get-accounting-reports` | 科目余额表、资产负债表、业务活动表（限定/非限定）、现金流量表 |
| `get-ledger` | 总账/明细账（按科目，含期初与逐笔余额） |
| `close-period` | 期末结账：收入/费用结转至净资产，生成结转凭证并通知（仅管理员） |

**设置（4 个，新增）**：

| 函数 | 说明 |
|------|------|
| `get-org-settings` | 读取组织设置；校验成员身份，钉钉凭证仅 admin 可见，member 仅返回配置状态与同步记录 |
| `save-org-settings` | 保存组织设置（仅管理员）；roleLabels 以 JSON 字符串存储 |
| `get-user-settings` | 读取用户设置（主题/昵称） |
| `save-user-settings` | 保存用户设置 |

## 混合通信

| Channel | 方法 | 用途 |
|---------|------|------|
| `com.smartsociety/storage` | `getStoragePath` | 返回 `filesDir`（Hive 落盘路径） |
| `com.smartsociety/cloud` | `callFunction` | 参数 `{ name, data?, timeout? }` → `cloudFunction.call` |
| `com.smartsociety/auth` | `signIn` / `signOut` / `getUserInfo` | 华为 Account Kit 桥接 |

## 同步机制

- **本地优先**：所有写入操作先持久化到 Hive，界面即时响应。
- **操作入队**：每个 save/delete 操作自动入队到 SyncProvider 的持久化队列。
- **周期推送**：30s 定时器自动处理队列，网络不可用时操作保留在队列中等待。
- **云端拉取**：`flush()` 在推送完成后自动拉取云端最新数据合并到本地；启动与切换组织时同样自动拉取。
- **重试策略**：单次云函数调用失败时自动重试 3 次（指数退避 500ms / 1000ms / 2000ms）。
- **全自动同步**：所有增删改操作自动入队推送，无手动同步入口。

## 数据隔离模型

```
用户 A ──┬── 组织 X（admin）── MemberX, ProjectX, NoticeX
         │       └── 子组织 X1（shareMembers=true）→ 可查看 X1 成员
         └── 组织 Y（member）── 仅可见 Y 的数据

用户 B ──── 组织 X（manager）── 与 A 共享 X 的数据（同 orgId）
```

- 所有数据表通过 `orgId` 字段隔离，云函数强制校验用户是否属于该组织。
- 组织关系（`OrganizationRelationship`）控制跨组织数据共享：`shareMembers`、`shareActivities`、`shareNotices` 分别控制成员/活动/公告的可见性。

## 里程碑

| 阶段 | 状态 | 交付物 |
|------|------|--------|
| 环境搭建 / 项目初始化 | ✅ | Flutter-OH + DevEco 工程，真机运行 |
| 核心 UI（三模块 + 仪表盘） | ✅ | 成员/项目/公告/设置页 |
| 角色体系与文案重构 | ✅ | 分级角色、自定义角色名、OrgLabels |
| 本地持久化 | ✅ | Hive 多盒存储 |
| 端云一体化工程结构 | ✅ | Application/ + CloudProgram/ |
| 云函数 + 云数据库（V2） | ✅ | 7 个云函数 + 3 张表 |
| **多组织架构（V3）** | ✅ | 华为账号认证、多组织管理、自动同步、组织层级 |
| 云函数部署 + 真机联调 | ✅ | 34 个云函数 + 12 张表部署至 AGC |
| 钉钉集成 | ✅ | 通讯录单向同步（按组织配置凭证、成员只读）；群消息/审批流待后续 |
| **设置数据上云（V3.2）** | ✅ | 角色名/钉钉配置/主题/昵称云端存储，按组织隔离，凭证仅管理员可见 |
| 测试优化 | ⏳ | 功能回归、性能、兼容性 |
| 打包上架 | ⏳ | 签名证书、隐私政策、上架审核 |

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| `flutter doctor` 报 OpenHarmony toolchain 缺失 | 检查 `DEVECO_SDK_HOME` / `HOS_SDK_HOME` |
| 真机签名失效 | DevEco → Project Structure → Signing Configs 重新生成 |
| DevEco 不显示 CloudProgram | 确保根目录仅有 `Application/` + `CloudProgram/` |
| 云函数调用报 `160404: Trigger not exist` | 函数未部署，在 DevEco 中重新部署 |
| 云函数报 `2047: the input class is invalid` | 模型类未实现 CloudDB SDK 要求的 5 个方法 |
| 云函数报权限错误 | 确认认证类型为 `apigw-client`、证书指纹已登记 |
| 华为账号登录失败 | 确认 AGC 已开通 Account Kit、OAuth 回调已配置 |
| 同步队列堆积 | 检查网络连接，恢复后 30s 周期内自动推送 |
| MethodChannel 通信失败 | 核对 Dart 与 ArkTS 两端 Channel 名称、参数 key 完全一致 |
| 云数据库部署报 `Failed to decode response body. createDataBaseResource` | 多为云数据库服务未开通/登录态失效/网络代理拦截；先在 AGC 控制台确认云数据库已开通、DevEco 重新登录，再重试部署 |
| 设置保存报"保存失败" | 设置保存必须先云端成功后本地生效，检查网络与云函数是否已部署（get/save-org-settings、get/save-user-settings） |
| 设置页点击"保存"无反应 / 设置数据不上云 | 事件回调中误用 `context.labels`（内部为 `context.watch`，只能在 build 方法中调用）会在调试模式抛错且被吞掉；事件回调应使用 `context.labelsRead`（`read` 版本）。已修复设置页与成员/项目/公告表单页 |
| 登录后保存设置报"缺少 orgId/userId 参数" | Provider 的 userId 原仅在启动时初始化，冷启动未登录、之后再登录时仍为空；已增加登录态监听，登录后自动同步 userId 并重新拉取云端用户/组织设置 |

## 关键资源

| 资源 | 地址 |
|------|------|
| Flutter-OH SDK | https://gitcode.com/openharmony-tpc/flutter_flutter |
| Flutter-OH 混编 Demo | https://gitcode.com/openharmony-tpc/flutter_samples |
| 华为开发者联盟 | https://developer.huawei.com/consumer/cn/ |
| AppGallery Connect | https://developer.huawei.com/consumer/cn/service/josp/agc/index.html |
| 云开发（Serverless）文档 | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/agc-harmonyos-clouddev-createproject |
| 华为 Account Kit | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/account-kit-overview |
