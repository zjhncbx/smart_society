# 智联社团（SmartSociety）

基于 **Flutter + HarmonyOS 混合开发** 的社团管理应用，覆盖成员管理、活动管理、通知公告等核心功能，通过 Platform Channel 集成华为推送、扫码签到等鸿蒙原生能力。

**Phase 1 目标**：完成开发环境搭建、MVP 核心功能开发、混合通信集成，并于第 12 周前上架华为应用市场。

- 文档版本：V1.0
- 适用周期：第 1-12 周（2026年8月—10月）
- 适用平台：Windows / macOS

## 技术栈

| 层 | 技术 |
|----|------|
| UI / 业务 | Flutter（Dart） |
| 原生壳 | HarmonyOS（ArkTS，`ohos/` 模块） |
| 状态管理 | Provider |
| 网络请求 | Dio |
| 本地缓存 | Hive / hive_flutter（纯 Dart，无需适配） |
| 路由 | go_router |
| 响应式适配 | flutter_screenutil |
| 混合通信 | MethodChannel + PlatformView |

## 里程碑总览（12 周）

| 阶段 | 周次 | 核心交付物 | 验收标准 |
|------|------|------------|----------|
| 环境搭建 | W1 | 开发环境就绪 | `flutter doctor -v` 全部绿标 |
| 项目初始化 | W2 | Flutter+鸿蒙混合工程 | 真机运行 Hello World |
| 核心UI开发 | W3-W4 | 成员管理+活动管理界面 | UI 高保真还原 |
| 业务逻辑开发 | W5-W6 | 完整 CRUD+网络+缓存 | 核心功能端到端打通 |
| 混合通信 | W7-W8 | Platform Channel 打通 | 推送+扫码功能可用 |
| 测试优化 | W9-W10 | 全量测试+性能优化 | Bug率<5%，启动<2秒 |
| 打包上架 | W11-W12 | HAP 包上架 | 华为应用市场审核通过 |

## 环境搭建（W1）

### 前置工具

| 工具 | 版本要求 | 备注 |
|------|----------|------|
| 操作系统 | Windows 10+ / macOS 12+ | 推荐 macOS（可同时开发 iOS） |
| JDK | **17** | 必须使用 17 版本，低版本不兼容 |
| Git | 最新版 | 用于拉取 Flutter-OH 源码 |
| Node.js | 18+ | HarmonyOS 构建依赖 |
| DevEco Studio | **6.0.2 Release**（构建版本 6.0.2.640） | 鸿蒙 IDE，安装时勾选 HarmonyOS SDK |

### 安装 JDK 17

**Windows**：下载 [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/)，配置环境变量：

```
JAVA_HOME = D:\Program Files\Java\jdk-17
PATH 追加 %JAVA_HOME%\bin
```

**macOS**：

```bash
brew install openjdk@17
# ~/.zshrc
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

验证：`java -version` 应显示 `17.x.x`。

### 安装 DevEco Studio

1. 从[华为开发者官网](https://developer.huawei.com/consumer/cn/download/)下载 DevEco Studio 6.0.2 Release，安装时**务必勾选 HarmonyOS SDK**。
2. 通过 SDK Manager 安装 OpenHarmony SDK（API 20）、Build Tools、Toolchains。
3. macOS 可能需要解除安全限制：`sudo xattr -r -d com.apple.quarantine /Applications/DevEco-Studio.app`

SDK 路径参考：
- Windows：`C:\Users\你的用户名\AppData\Local\Huawei\Sdk`
- macOS：`/Applications/DevEco-Studio.app/Contents/sdk`

### 下载 Flutter-OH SDK

> ⚠️ **关键**：Flutter 适配鸿蒙必须使用鸿蒙定制版，不能用官方原版！

```bash
git clone -b oh-3.35.7-dev --single-branch https://gitcode.com/openharmony-tpc/flutter_flutter.git
```

建议路径：Windows `D:\Developments\flutter\harmony_flutter`，macOS `~/flutter_flutter`。

### 配置环境变量

**Windows（系统环境变量，推荐永久生效）**：

| 变量名 | 值 |
|--------|-----|
| `DEVECO_SDK_HOME` | `C:\Users\你的用户名\AppData\Local\Huawei\Sdk\sdk` |
| `HOS_SDK_HOME` | `C:\Users\你的用户名\AppData\Local\Huawei\Sdk\sdk` |
| `PUB_HOSTED_URL` | `https://pub.flutter-io.cn` |
| `FLUTTER_STORAGE_BASE_URL` | `https://storage.flutter-io.cn` |

`PATH` 追加：`%JAVA_HOME%\bin`、Flutter-OH 的 `bin` 目录、`Huawei\Sdk\default\openharmony\toolchains`、`Huawei\Sdk\tools\` 下的 `hvigor\bin`、`node\bin`、`ohpm\bin`。

**macOS（~/.zshrc）**：

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

export TOOL_HOME=/Applications/DevEco-Studio.app/Contents
export DEVECO_SDK_HOME=$TOOL_HOME/sdk
export PATH=$TOOL_HOME/tools/ohpm/bin:$PATH
export PATH=$TOOL_HOME/tools/hvigor/bin:$PATH
export PATH=$TOOL_HOME/tools/node/bin:$PATH

export PATH=~/flutter_flutter/bin:$PATH

export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

重新加载：Windows 重启终端（或 `refreshenv`），macOS 执行 `source ~/.zshrc`。

### 配置 Flutter 的 ohos-sdk 路径

```bash
flutter config --ohos-sdk=''
flutter config --ohos-sdk=<你的DevEco SDK路径>
```

### 验证环境

```bash
flutter doctor -v
```

正常输出应包含：

```
[✓] Flutter (Channel dev, 3.35.7-dev)
[✓] OpenHarmony toolchain - develop for OpenHarmony devices
[✓] DevEco Studio (version 6.0.2)
```

## 项目初始化与真机运行（W2）

### 创建项目

仅鸿蒙平台（推荐）：

```bash
flutter create --platforms ohos smart_society
```

三端同步（保留安卓/iOS）：

```bash
flutter create smart_society
```

### 项目结构

```
smart_society/
├── lib/                          # Flutter 主代码（核心开发在此进行）
│   ├── main.dart
│   ├── models/                   # 数据模型
│   ├── screens/                  # 页面（member/、activity/ 等按模块分包）
│   ├── widgets/                  # 可复用组件
│   ├── services/                 # 网络/本地/原生服务
│   └── utils/                    # 工具函数
├── ohos/                         # 鸿蒙原生壳工程
│   └── entry/src/main/ets/       # ArkTS 原生代码（混合通信在此编写）
├── pubspec.yaml                  # Flutter 依赖管理
└── build-profile.json5           # 鸿蒙签名配置
```

### 真机签名配置（核心步骤）

运行到真机前**必须完成签名配置**：

1. 用 DevEco Studio 打开项目的 `ohos` 模块。
2. `File → Project Structure → Project → Signing Configs`，勾选 `Automatically generate signature`（DevEco Studio 26.0.0 Beta2+ 支持自动签名；旧版本需在 AGC 手动生成 .p12/.csr/.cer/.p7b 并配置到 `build-profile.json5`）。
3. 登录华为账号，签名成功后点击 `Apply`。

### 真机调试

1. 手机开启开发者模式：设置 → 关于手机 → 连续点击“版本号”7 次。
2. 开启 USB 调试：设置 → 系统和更新 → 开发人员选项 → USB 调试。
3. USB 连接手机，`flutter devices` 应显示 `ohos-arm64` 设备。

```bash
# 方式1（推荐）：开发调试，支持热重载
flutter run --debug -d <deviceId>
# 方式2：批量部署/离线安装
flutter build hap --debug && hdc install <hap路径>
# 方式3：DevEco Studio 选择真机直接运行
```

**成功标志**：手机上显示 “Hello, World!” 应用。

## 核心功能开发（W3-W6）

### 依赖库

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.0.0              # 网络请求
  provider: ^6.0.0         # 状态管理
  hive: ^2.2.0             # 本地缓存（纯 Dart）
  hive_flutter: ^1.1.0
  go_router: ^14.0.0       # 路由
  flutter_screenutil: ^5.9.0  # 响应式适配
  intl: ^0.19.0            # 日期处理
```

### 模块优先级

| 优先级 | 模块 | 核心功能 | 预计工时 |
|--------|------|----------|----------|
| P0 | 成员管理 | 列表、详情、添加、编辑、角色筛选 | W3 |
| P0 | 活动管理 | 创建、报名列表、名额管理 | W4 |
| P0 | 通知公告 | 发布、列表、已读状态 | W5 |
| P1 | 网络层 | Dio 封装、API 定义、拦截器 | W3 穿插 |
| P1 | 本地缓存 | Hive 初始化、数据持久化 | W4 穿插 |

### 代码规范

- 命名：类名大驼峰（`MemberModel`），变量/方法小驼峰（`getMemberList`）。
- 目录：按功能模块分包（`screens/member/`、`screens/activity/`）。
- 状态管理：使用 Provider，避免过多 `setState`。

## 混合通信集成（W7-W8）

| 鸿蒙原生能力 | 使用场景 | 通信方式 |
|-------------|----------|----------|
| 华为推送 Kit | 通知公告推送 | MethodChannel |
| 扫码能力 | 活动签到 | MethodChannel + PlatformView |
| 文件选择器 | 资料库上传 | MethodChannel |

**Dart 端（lib/services/native_service.dart）**：

```dart
import 'package:flutter/services.dart';

class NativeService {
  static const MethodChannel _channel = MethodChannel('com.smartsociety/native');

  static Future<bool> sendNotification(String title, String content) async {
    try {
      final result = await _channel.invokeMethod('sendNotification', {
        'title': title,
        'content': content,
      });
      return result == true;
    } on PlatformException catch (e) {
      print('推送失败: ${e.message}');
      return false;
    }
  }

  static Future<String> startScan() async {
    try {
      final result = await _channel.invokeMethod('startScan');
      return result.toString();
    } on PlatformException catch (e) {
      print('扫码失败: ${e.message}');
      return '';
    }
  }
}
```

**ArkTS 端（ohos/entry/src/main/ets/entryability/EntryAbility.ts）**：

```typescript
import { MethodChannel } from '@ohos/flutter';
import notificationManager from '@ohos.notificationManager';

export default class EntryAbility extends UIAbility {
  onCreate() {
    const channel = new MethodChannel('com.smartsociety/native');
    channel.setMethodCallHandler((call, result) => {
      if (call.method === 'sendNotification') {
        this.handleNotification(call.arguments, result);
      } else if (call.method === 'startScan') {
        this.handleScan(result);
      } else {
        result.notImplemented();
      }
    });
  }

  private async handleNotification(args: any, result: any) {
    try {
      const request = {
        id: 1001,
        title: args.title || '社团通知',
        text: args.content || '',
        smallIcon: 'common_icon',
      };
      await notificationManager.publish(request);
      result.success(true);
    } catch (error) {
      result.error('NOTIFICATION_ERROR', error.message, null);
    }
  }
}
```

**权限声明（ohos/entry/src/main/module.json5）**：

```json
"requestPermissions": [
  { "name": "ohos.permission.NOTIFICATION_CONTROLLER" }
]
```

> ⚠️ Channel 名称必须与 Dart 端完全一致（大小写、包名路径均不能错），否则通信失败。

## 测试与优化（W9-W10）

| 测试类型 | 测试内容 | 验收标准 |
|----------|----------|----------|
| 功能测试 | 成员 CRUD、活动报名、通知发布 | 所有 P0 功能正常 |
| 混合通信测试 | 推送发送、扫码签到 | Platform Channel 调用成功 |
| 性能测试 | 启动速度、列表滑动、内存占用 | 启动<2秒，无卡顿 |
| 兼容性测试 | 华为云测试平台覆盖主流机型 | 主流机型通过 |

性能优化要点：

- MethodChannel 高频调用：避免循环中频繁调用，考虑批量处理。
- 列表渲染：使用 `ListView.builder`。
- 图片加载：使用 `cached_network_image` 做缓存。

## 打包与上架（W11-W12）

### 编译 Release 版 HAP

```bash
flutter build hap --release
```

产物路径：`ohos/entry/build/default/outputs/default/entry-default-signed.hap`

### 上架前检查清单

- [ ] 应用图标（`ohos/entry/src/main/resources/base/media/icon.png`）
- [ ] 启动页（`ohos/entry/src/main/resources/base/media/splash.png`）
- [ ] 应用名称（`ohos/entry/src/main/resources/base/element/string.json`）
- [ ] 隐私政策完整（必须在应用内可访问）
- [ ] 权限申请合理（在 `module.json5` 中声明）
- [ ] 软件著作权（提前 1-2 个月申请）

### 上架流程

1. 登录 [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)。
2. 创建项目 → 添加应用 → 填写应用信息。
3. 上传 HAP 包 → 提交审核（审核周期通常 1-3 个工作日）。

### 开发者激励申请

- 报名时间：2026年4月15日 至 9月25日。
- 上架时间：须在 2026年3月12日 至 9月30日 期间首次上架。
- 激励标准：热门应用每款 1 万元，新应用每款 3000 元。
- 操作：登录 HarmonyOS 开发者官网报名。

## 常见问题（FAQ）

| 问题 | 解决方案 |
|------|----------|
| `flutter doctor` 报 OpenHarmony toolchain 缺失 | 检查 `OHOS_SDK_HOME` 路径，确认 SDK 有 `toolchains` 子目录 |
| 真机运行提示签名失效 | File → Project Structure → Signing Configs，重新勾选自动签名 |
| MethodChannel 通信失败 | 检查 Dart 端与 ArkTS 端的 Channel 名称是否完全一致 |
| 第三方库不兼容鸿蒙 | 优先选择**纯 Dart 实现**的库；依赖原生的库查找 `_ohos` 适配版本 |
| 编译 HAP 报错 | 确认 DevEco Studio 版本≥6.0.2 Release，JDK 版本=17 |
| 环境变量配置后不生效 | Windows 需重启终端；macOS 执行 `source ~/.zshrc` |

## 关键资源

| 资源 | 地址 |
|------|------|
| Flutter-OH SDK | https://gitcode.com/openharmony-tpc/flutter_flutter |
| Flutter-OH 官方文档 / 混编 Demo | https://gitcode.com/openharmony-tpc/flutter_samples |
| 华为开发者联盟 | https://developer.huawei.com/consumer/cn/ |
| AppGallery Connect | https://developer.huawei.com/consumer/cn/service/josp/agc/index.html |
| 混编 Demo 参考 | flutter_samples 仓库中的 `flutter_page_sample2` |
