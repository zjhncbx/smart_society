# 支持环境矩阵（SUPPORTED）

与仓库实际工具链一致的支持环境清单。未列出的版本未经验证，不承诺可用。

## 开发环境

| 工具 | 支持版本 | 说明 |
|------|----------|------|
| Flutter-OH | **3.41.10-ohos-1.0.1**（Dart 3.11.5） | 鸿蒙定制版，源 https://gitcode.com/openharmony-tpc/flutter_flutter（本仓库验证分支 CPF-Flutter/flutter_flutter） |
| DevEco Studio | 6.1+ | 需勾选 HarmonyOS SDK；**打开 `mobile/` 目录**（非仓库根） |
| HarmonyOS SDK | API 26 | 环境变量 `DEVECO_SDK_HOME` / `HOS_SDK_HOME` |
| JDK | 17 | 端侧构建必需 |
| Node.js | 18+（推荐 **24.x**，验证版本 24.19.0） | hvigor/ohpm 依赖与 Web 工具链 |
| pnpm | 8+（验证版本 12.6.0） | Web 端包管理器 |
| 包管理器（Flutter） | pub（`PUB_HOSTED_URL=https://pub.flutter-io.cn`） | `FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn` |

## 运行环境

| 平台 | 支持范围 | 说明 |
|------|----------|------|
| HarmonyOS NEXT（真机） | 华为 Mate 70 Pro+ 已验证 | 应用包名 `com.hnmrxz.smart_society`；华为账号登录需 AGC 开通 Account Kit |
| 现代浏览器（Web 管理端） | Chrome / Edge / Firefox / Safari 最近两个大版本 | 依赖 ES2022、React 19；不支持 IE |
| 操作系统（开发） | Windows / macOS | Windows 需 NTFS（`mobile/Application/ohos/` Junction） |

## 云端依赖

| 服务 | 说明 |
|------|------|
| 华为 AGC Serverless | 云函数（HTTP 触发器、`apigw-client`）+ 云数据库（32 对象类型）+ 云存储 |
| 华为 Account Kit | 华为账号一键登录（OAuth 回调需在 AGC 配置） |

部署与联调步骤见 [`docs/AGC部署联调.md`](docs/AGC部署联调.md)。

## 门禁基线

| 门禁 | 命令 | 基线 |
|------|------|------|
| Web 类型检查 | `pnpm typecheck`（web/） | 0 error |
| Web 静态检查 | `pnpm lint`（web/） | 0 error / 0 warning |
| Web 单元与组件测试 | `pnpm test`（web/） | 全部通过 |
| Web 生产构建 | `pnpm build`（web/） | 成功 |
| Web Mock 冒烟 | `pnpm smoke`（web/） | 68 项断言全过 |
| 移动端静态分析 | `flutter analyze`（mobile/Application/） | 0 issue |
| 移动端测试 | `flutter test`（mobile/Application/） | 全部通过 |
