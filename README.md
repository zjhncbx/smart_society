# 智联社团（SmartSociety）

基于 **Flutter + HarmonyOS 混合开发** 的社团管理应用，定位为**组织管理端**：成员管理、活动管理、通知公告、管理仪表盘，支持 3 种组织类型（学校社团 / 志愿服务队 / 社会团体）、4 套主题、自定义角色名称，并预留钉钉协同与华为云开发（AGC Serverless）能力。

- 文档版本：V2.0
- 适用平台：Windows / macOS
- 真机验证：华为 Mate 70 Pro+（HarmonyOS NEXT）

## 产品定位

- **管理端**：App 面向社长/队长/会长等管理人员，提供成员、活动、公告的全量管理能力。
- **普通成员留在钉钉**：普通成员不直接使用本 App，通过钉钉接收通知与参与活动。
- **预留钉钉集成**：`DingTalkApi` / `DingTalkSyncService` 已预留联系人同步、群消息、审批等接口。

## 技术栈

| 层 | 技术 |
|----|------|
| UI / 业务 | Flutter（Dart 3.11），Flutter-OH 3.41.10 |
| 原生壳 | HarmonyOS（ArkTS，`ohos/` 模块，API 26） |
| 状态管理 | Provider 6 |
| 路由 | go_router 14（StatefulShellRoute 四 Tab） |
| 本地缓存 | Hive（settings / roleConfig / members / activities / notices） |
| 网络请求 | Dio（预留 REST API） |
| 云开发 | 华为 AGC Serverless（云函数 + 云数据库），系统 Kit `@kit.CloudFoundationKit` |
| 混合通信 | MethodChannel（存储路径 / 云函数桥接） |
| UI 组件 | 自研 AppCard / StatusBadge / AppEmptyState / AppTheme |

## 功能清单

### 已实现

- **组织类型**：学校社团、志愿服务队、社会团体，引导页首次选择
- **主题**：校园风（蓝）、志愿风（橙）、青年风（绿）、政务风（红）
- **角色体系**：分级角色 + 人数上限约束，名称可在设置中自定义并持久化
  - 学校社团：社长(1)、部长(不限)
  - 志愿服务队：队长(1)、部长(不限)
  - 社会团体：会长(1)、副会长(不限)、秘书长(1)、理事(不限)、监事长(1)、监事(不限)
- **成员管理**：列表（搜索/角色筛选）、详情、新增/编辑、删除
- **活动管理**：列表（状态色条：未开始/进行中/已结束）、创建/编辑、**参与人管理**（添加/移除）
- **通知公告**：发布、重要标记、已读状态
- **管理仪表盘**：成员总数 / 进行中活动 / 未读通知 / 钉钉同步状态统计、快捷操作（添加成员/创建活动/发布公告）
- **云开发桥接**：MethodChannel 调用华为云函数（`cloudFunction.call`），云数据库读写全部经云函数（免鉴权 + 权限收紧）
- **多语言文案体系**：全部 UI 文案经 `OrgLabels` 按组织类型分发，无硬编码中文

### 规划中

- 钉钉通讯录同步、群消息、审批流（接口已预留，见 `lib/services/dingtalk_*.dart`）
- 华为推送 Kit（公告推送）、扫码签到（PlatformView）

## 目录结构

```
smart_society/
├── lib/
│   ├── main.dart / app.dart         # 入口：Hive 初始化 + Provider 注入 + ThemeData 全局样式
│   ├── router.dart                  # go_router 路由（四 Tab + 表单/详情/设置）
│   ├── config/                      # 组织类型、主题配置、OrgLabels（角色体系+全部文案）
│   ├── models/                      # Member / SocietyActivity / Notice / CustomRoleConfig
│   ├── providers/                   # Settings / Member / Activity / Notice / RoleConfig
│   ├── screens/
│   │   ├── member/ activity/ notice/   # 三模块：列表 + 详情 + 表单
│   │   ├── profile/                    # 管理仪表盘
│   │   └── settings/                   # 设置、角色编辑器、引导页
│   ├── services/
│   │   ├── storage_service.dart        # Hive 初始化 + 种子数据
│   │   ├── cloud_function_service.dart # 云函数调用（MethodChannel 桥接）
│   │   ├── api_client.dart             # Dio 封装
│   │   ├── dingtalk_api.dart           # 钉钉 API 占位（UnimplementedError）
│   │   └── dingtalk_sync_service.dart  # 钉钉同步编排
│   ├── widgets/                        # AppCard / StatusBadge / AppEmptyState / AppTheme / common
│   └── utils/
├── ohos/                              # 鸿蒙原生壳
│   └── entry/src/main/ets/
│       ├── entryability/EntryAbility.ets   # cloudCommon.init + MethodChannel 桥接
│       └── resources/rawfile/agconnect-services.json  # AGC 配置（含密钥，不入库）
└── pubspec.yaml
```

## 环境要求

| 工具 | 版本 | 备注 |
|------|------|------|
| Flutter-OH | **3.41.10-ohos-1.0.0** | 鸿蒙定制版，勿用官方原版（`gitcode.com/openharmony-tpc/flutter_flutter`） |
| Dart SDK | ^3.11.5 | 随 Flutter-OH |
| DevEco Studio | 6.1+ | 安装时勾选 HarmonyOS SDK |
| JDK | 17 | 构建必需 |
| Node.js | 18+ | hvigor/ohpm 依赖 |

环境变量：`DEVECO_SDK_HOME`、`HOS_SDK_HOME`、`PUB_HOSTED_URL=https://pub.flutter-io.cn`、`FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn`。

## 快速开始

```bash
# 环境验证
flutter doctor -v

# 拉依赖 + 分析
flutter pub get
flutter analyze          # 应零 issue

# 调试构建（HAP 产物）
flutter build hap --debug
# 或
cd ohos && devecocli build

# 真机运行（需已开启开发者模式的鸿蒙手机）
flutter run --debug -d <deviceId>
```

首次启动进入引导页：选择组织类型与主题 → 写入种子数据（10 名成员 + 示例活动/公告）。

## 鸿蒙云开发（AGC）配置

### 1. 应用关联

1. AGC 控制台创建项目与应用，**包名必须等于** `com.hnmrxz.smart_society`（见 `ohos/AppScope/app.json5`）。
2. 启用数据处理位置（必须含中国站点），开通云开发服务（云函数 + 云数据库）。

### 2. 项目侧配置（已完成）

| 项 | 位置 |
|----|------|
| `agconnect-services.json` | `ohos/entry/src/main/resources/rawfile/`（含密钥，已加入 `.gitignore`） |
| 云开发初始化 | `EntryAbility.ets`：`cloudCommon.init({ region: CHINA })` |
| 云函数桥接 | `EntryAbility.ets` 注册 `com.smartsociety/cloud` 通道 → `cloudFunction.call` |
| Dart 调用层 | `lib/services/cloud_function_service.dart`（`call()` / `callChecked()`） |

### 3. AGC 控制台侧

- **证书指纹**：项目设置 → 常规 → 证书指纹，登记调试证书 SHA256（真机调试签名与 `build-profile.json5` 一致；发布时替换正式证书）。
- **云数据库对象类型**：`Member` / `Activity` / `Notice`，字段与 Dart 模型 `toJson()` 一致（时间戳为 Long 毫秒）。权限建议全关，仅「管理员」开启 query/upsert/delete（端侧不直连，云函数服务端访问不受限）。
- **云函数**（HTTP 触发器、POST、认证类型 `apigw-client`、**不启用 decode**，入口 `index.xxx`）：

| 函数 | 入口 | 说明 |
|------|------|------|
| `get-all-data` | `index.getAllData` | 全量拉取三张表 |
| `save-member` / `delete-member` | `index.saveMember` / `index.deleteMember` | 成员 upsert / 删除 |
| `save-activity` / `delete-activity` | `index.saveActivity` / `index.deleteActivity` | 活动 upsert（含 participants）/ 删除 |
| `save-notice` / `delete-notice` | `index.saveNotice` / `index.deleteNotice` | 公告 upsert / 删除 |

云函数统一返回 `{ code: 0, message: 'ok', data: ... }`，依赖 `@hw-agconnect/database-server`（Node.js 服务端 SDK，不受对象类型权限限制）。

### 4. 端侧调用示例

```dart
final data = await CloudFunctionService.instance.callChecked('get-all-data');
```

## 混合通信

| Channel | 方法 | 用途 |
|---------|------|------|
| `com.smartsociety/storage` | `getStoragePath` | 返回 `filesDir`（Hive 落盘路径） |
| `com.smartsociety/cloud` | `callFunction` | 参数 `{ name, data?, timeout? }` → `cloudFunction.call`，返回 JSON 字符串 |

## 里程碑

| 阶段 | 状态 | 交付物 |
|------|------|--------|
| 环境搭建 / 项目初始化 | ✅ | Flutter-OH + DevEco 工程，真机运行 |
| 核心 UI（三模块 + 仪表盘） | ✅ | 成员/活动/公告/设置页，钉钉风格卡片化 UI |
| 角色体系与文案重构 | ✅ | 分级角色、自定义角色名、OrgLabels 全量文案 |
| 本地持久化 | ✅ | Hive 五盒 + 种子数据 |
| 云开发接入 | ✅ | AGC 配置、云函数桥接、7 个云函数部署 |
| 钉钉集成 | ⏳ | 接口预留，待企业资质与开放平台配置 |
| 测试优化 | ⏳ | 功能回归、性能（启动 <2s）、兼容性 |
| 打包上架 | ⏳ | 签名证书、隐私政策、上架审核 |

## 上架流程（规划）

1. 准备正式签名证书，AGC 更新证书指纹，`build-profile.json5` 切换 signingConfig。
2. `flutter build hap --release`，产物：`ohos/entry/build/default/outputs/default/entry-default-signed.hap`。
3. 检查清单：图标、启动页、应用名称、隐私政策、权限声明（`module.json5` 已含 INTERNET）。
4. AGC 上传 HAP → 提交审核（1-3 个工作日）。
5. 开发者激励：2026 年报名通道（9 月 25 日截止），首次上架需在 9 月 30 日前。

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| `flutter doctor` 报 OpenHarmony toolchain 缺失 | 检查 `DEVECO_SDK_HOME` / `HOS_SDK_HOME`，确认 SDK 含 `toolchains` |
| 真机签名失效 | DevEco File → Project Structure → Signing Configs 重新生成，并同步 AGC 证书指纹 |
| 云函数调用报 `160404: Trigger not exist` | 函数未部署或触发器未生效，重新部署 |
| 云函数报权限错误 | 确认认证类型为 `apigw-client`、证书指纹已登记、对象类型权限已放开管理员 |
| decode 开启导致 `JSON.parse` 报错 | HTTP 触发器保持「不启用 decode」，body 为原始字符串 |
| MethodChannel 通信失败 | 核对 Dart 与 ArkTS 两端 Channel 名称、参数 key 完全一致 |

## 关键资源

| 资源 | 地址 |
|------|------|
| Flutter-OH SDK | https://gitcode.com/openharmony-tpc/flutter_flutter |
| Flutter-OH 官方文档 / 混编 Demo | https://gitcode.com/openharmony-tpc/flutter_samples |
| 华为开发者联盟 | https://developer.huawei.com/consumer/cn/ |
| AppGallery Connect | https://developer.huawei.com/consumer/cn/service/josp/agc/index.html |
| 云开发（Serverless）文档 | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/agc-harmonyos-clouddev-createproject |
