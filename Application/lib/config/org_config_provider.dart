import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import 'org_labels.dart';
import 'org_type.dart';

extension OrgConfigExtension on BuildContext {
  OrgLabels get labels => OrgLabels.forType(orgType);
  /// 事件回调中使用（watch 只能在 build 里调用，事件里要用 read）
  OrgLabels get labelsRead => OrgLabels.forType(orgTypeRead);
  OrgType get orgType => watch<SettingsProvider>().orgType;
  OrgType get orgTypeRead => read<SettingsProvider>().orgType;
}
