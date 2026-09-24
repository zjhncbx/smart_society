import 'package:flutter/foundation.dart';

import 'app.dart';

void main() {
  // 全局错误兜底：框架异常先正常呈现再落日志，避免静默丢失
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('[GlobalError] Flutter 框架异常: ${details.exception}\n${details.stack}');
  };
  // 未捕获的异步/平台异常：记录并吞掉，避免进程崩溃
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('[GlobalError] 未捕获异常: $error\n$stack');
    return true;
  };
  mainApp();
}
