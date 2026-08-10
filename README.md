# 社易管（SmartSociety）

<p align="center">
  <img src="Application/AppScope/resources/base/media/app_icon.png" width="96" height="96" alt="社易管 Logo" />
</p>

基于 **Flutter + HarmonyOS 混合开发** 的多组织社团管理平台，支持华为账号登录、多组织管理、自动双向同步、组织层级与数据共享。

- 应用显示名：社易管（英文 SmartSociety），包名 `com.hnmrxz.smart_society`
- 文档版本：V3.1
- 适用平台：Windows / macOS（开发），HarmonyOS NEXT（真机）
- 真机验证：华为 Mate 70 Pro+（HarmonyOS NEXT）

## 产品定位

- **多组织 SaaS 平台**：支持学校社团、志愿服务队、社会团体三类组织独立注册与管理，同一华为账号可加入多个组织。
- **移动管理端**：面向社长/队长/会长等管理人员，提供成员、活动、公告的全量管理能力。
- **华为账号认证**：集成华为 Account Kit，用户使用华为账号一键登录，端云全链路身份透传。
- **自动双向同步**：离线操作入队，联网后自动推送；云端数据变更可拉取合并，无需手动触发。

## 技术栈

| 层 | 技术 |
|----|------|
| UI / 业务 | Flutter（Dart 3.11），Flutter-OH 3.41.10 |
| 原生壳 | HarmonyOS（ArkTS，API 26） |
| 账号认证 | 华为 Account Kit（HuaweiIDProvider + AuthenticationController） |
| 状态管理 | Provider 6 |
| 路由 | go_router 14（StatefulShellRoute 四 Tab + 认证守卫） |
| 本地缓存 | Hive（settings / auth / organizations / syncQueue / members / activities / notices） |
| 网络请求 | Dio |
| 云开发 | 华为 AGC Serverless（云函数 + 云数据库） |
| 混合通信 | MethodChannel（存储路径 / 云函数 / 认证桥接） |
| UI 组件 | 自研 AppCard / StatusBadge / AppEmptyState / AppTheme |

## 功能清单

### 已实现（V3.0）

- **华为账号认证**：一键登录/退出，用户身份端云透传（`cloudCommon.init(authProvider)`）
- **多组织管理**：创建组织（学校社团/志愿服务队→自动生成 ID，社会团体→统一社会信用代码）、切换组织、加入已有组织
- **组织类型**：学校社团、志愿服务队、社会团体，引导页首次选择后自动创建首个组织
- **主题**：校园风（蓝）、志愿风（橙）、青年风（绿）、政务风（红）
- **角色体系**：分级角色 + 人数上限约束，名称可在设置中自定义并持久化
  - 学校社团：社长(1)、部长(不限)
  - 志愿服务队：队长(1)、部长(不限)
  - 社会团体：会长(1)、副会长(不限)、秘书长(1)、理事(不限)、监事长(1)、监事(不限)
- **成员管理**：列表（搜索/角色筛选）、详情、新增/编辑、删除，按 orgId 隔离
- **活动管理**：列表（状态色条）、创建/编辑、参与人管理，按 orgId 隔离
- **通知公告**：发布、重要标记、已读状态，按 orgId 隔离
- **管理仪表盘**：成员总数 / 进行中活动 / 未读通知 / 同步状态统计
- **自动双向同步**：离线操作本地持久化 + 云端队列推送，30s 周期自动同步，失败操作保留在队列中等待重试
- **组织层级**：父-子组织和合作伙伴关系，支持成员/活动/公告选择性共享
- **多语言文案体系**：全部 UI 文案经 `OrgLabels` 按组织类型分发

### 规划中

- 钉钉通讯录同步、群消息、审批流（接口已预留）
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
│   │   ├── models/                # Member / SocietyActivity / Notice / CustomRoleConfig
│   │   │                          # AuthUser / Organization / UserOrgMembership (new)
│   │   ├── providers/             # Settings / Auth / Organization / Sync
│   │   │                          # Member / Activity / Notice / RoleConfig / OrgTree
│   │   ├── screens/
│   │   │   ├── auth/              # 登录页（华为账号一键登录）
│   │   │   ├── org/               # 组织创建 / 组织选择器
│   │   │   ├── member/ activity/ notice/   # 三模块：列表 + 详情 + 表单
│   │   │   ├── profile/                    # 管理仪表盘（用户信息 + 组织切换）
│   │   │   └── settings/                   # 设置、角色编辑器、引导页
│   │   ├── services/
│   │   │   ├── auth_service.dart           # 华为账号 MethodChannel 桥接 (new)
│   │   │   ├── cloud_function_service.dart # 云函数调用（含 callWithRetry）
│   │   │   ├── storage_service.dart        # Hive 初始化
│   │   │   ├── api_client.dart             # Dio 封装
│   │   │   ├── dingtalk_api.dart           # 钉钉 API 占位
│   │   │   └── dingtalk_sync_service.dart  # 钉钉同步编排
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
    │   ├── objecttype/             # 6 个对象类型定义
    │   │   ├── Member.json         # +orgId +updatedAt
    │   │   ├── Activity.json       # +orgId +updatedAt
    │   │   ├── Notice.json         # +orgId +updatedAt
    │   │   ├── Organization.json   # (new)
    │   │   ├── OrganizationRelationship.json  # (new)
    │   │   └── UserOrganization.json          # (new)
    │   └── dataentry/              # 种子数据
    └── cloudfunctions/             # 12 个云函数
        ├── common/                 # 共享 TS 模型 (new)
        │   ├── Organization.ts
        │   ├── OrganizationRelationship.ts
        │   └── UserOrganization.ts
        ├── get-all-data/           # 全量拉取（按 orgId 过滤）
        ├── upsert-member/  delete-member/
        ├── upsert-activity/  delete-activity/
        ├── upsert-notice/  delete-notice/
        ├── create-org/             # (new) 创建组织
        ├── get-my-orgs/            # (new) 获取用户所属组织列表
        ├── join-org/               # (new) 加入已有组织
        ├── set-org-relationship/   # (new) 设置组织间关系
        └── get-org-hierarchy/      # (new) 获取组织层级树
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

6 个对象类型定义位于 `CloudProgram/clouddb/objecttype/`：

| 对象类型 | 主键 | 说明 |
|----------|------|------|
| Member | id | 成员（+orgId 隔离） |
| Activity | id | 活动（+orgId 隔离） |
| Notice | id | 公告（+orgId 隔离） |
| Organization | orgId | 组织信息 |
| OrganizationRelationship | relId | 组织间关系 |
| UserOrganization | id | 用户-组织关联 |

权限配置：World/Authenticated 仅可读，Creator/Administrator 可读写删。端侧不直连云数据库，由云函数服务端 SDK 访问。

### 4. 云函数

12 个云函数，HTTP 触发器、POST、认证类型 `apigw-client`，统一返回 `{ ret: { code, message, data } }`。

**数据 CRUD（7 个，按 orgId 隔离）**：

| 函数 | 说明 |
|------|------|
| `get-all-data` | 全量拉取 Member / Activity / Notice（按 orgId 过滤） |
| `upsert-member` / `delete-member` | 成员 upsert / 删除 |
| `upsert-activity` / `delete-activity` | 活动 upsert（含 participants）/ 删除 |
| `upsert-notice` / `delete-notice` | 公告 upsert / 删除 |

**组织管理（5 个，新增）**：

| 函数 | 说明 |
|------|------|
| `create-org` | 创建组织（校验名称唯一性、信用代码格式），自动添加创建者为管理员 |
| `get-my-orgs` | 获取当前用户所属所有组织及角色 |
| `join-org` | 加入已有组织 |
| `set-org-relationship` | 设置父-子或伙伴关系及数据共享策略 |
| `get-org-hierarchy` | 获取组织层级树 |

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
- **云端拉取**：`flush()` 在推送完成后自动拉取云端最新数据合并到本地。
- **重试策略**：单次云函数调用失败时自动重试 3 次（指数退避 500ms / 1000ms / 2000ms）。
- **强制同步**：设置页「强制同步」按钮调用 `SyncProvider.instance.flush()` 立即推送 + 拉取。

## 数据隔离模型

```
用户 A ──┬── 组织 X（admin）── MemberX, ActivityX, NoticeX
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
| 核心 UI（三模块 + 仪表盘） | ✅ | 成员/活动/公告/设置页 |
| 角色体系与文案重构 | ✅ | 分级角色、自定义角色名、OrgLabels |
| 本地持久化 | ✅ | Hive 多盒存储 |
| 端云一体化工程结构 | ✅ | Application/ + CloudProgram/ |
| 云函数 + 云数据库（V2） | ✅ | 7 个云函数 + 3 张表 |
| **多组织架构（V3）** | ✅ | 华为账号认证、多组织管理、自动同步、组织层级 |
| 云函数部署 + 真机联调 | ⏳ | 12 个云函数 + 6 张表部署至 AGC |
| 钉钉集成 | ⏳ | 接口预留，待企业资质 |
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
| 同步队列堆积 | 检查网络连接，使用「强制同步」按钮手动触发 |
| MethodChannel 通信失败 | 核对 Dart 与 ArkTS 两端 Channel 名称、参数 key 完全一致 |

## 关键资源

| 资源 | 地址 |
|------|------|
| Flutter-OH SDK | https://gitcode.com/openharmony-tpc/flutter_flutter |
| Flutter-OH 混编 Demo | https://gitcode.com/openharmony-tpc/flutter_samples |
| 华为开发者联盟 | https://developer.huawei.com/consumer/cn/ |
| AppGallery Connect | https://developer.huawei.com/consumer/cn/service/josp/agc/index.html |
| 云开发（Serverless）文档 | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/agc-harmonyos-clouddev-createproject |
| 华为 Account Kit | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/account-kit-overview |
