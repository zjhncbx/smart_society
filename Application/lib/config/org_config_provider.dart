import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import 'org_labels.dart';
import 'org_type.dart';

extension OrgConfigExtension on BuildContext {
  OrgLabels get labels => OrgLabels.forType(orgType);
  OrgType get orgType => watch<SettingsProvider>().orgType;
  OrgType get orgTypeRead => read<SettingsProvider>().orgType;
}
