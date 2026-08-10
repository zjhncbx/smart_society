import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../config/org_type.dart';
import '../models/role_config.dart';

class RoleConfigProvider extends ChangeNotifier {
  final Map<int, CustomRoleConfig> _configs = {};

  Future<void> init() async {
    final box = await Hive.openBox('roleConfig');
    for (final type in OrgType.values) {
      final data = box.get(type.index);
      if (data != null) {
        _configs[type.index] = CustomRoleConfig.fromJson(
          Map<String, dynamic>.from(data as Map),
        );
      }
    }
  }

  String getLabel(OrgType type, String roleId, String defaultLabel) =>
      _configs[type.index]?.getLabel(roleId, defaultLabel) ?? defaultLabel;

  Future<void> setLabel(OrgType type, String roleId, String newLabel) async {
    // const CustomRoleConfig(customLabels: {}) 的 {} 是不可变 map，
    // 直接赋值会抛 UnsupportedError，这里用 copy-on-write
    final config =
        _configs[type.index] ?? const CustomRoleConfig(customLabels: {});
    final labels = Map<String, String>.from(config.customLabels);
    labels[roleId] = newLabel;
    _configs[type.index] = CustomRoleConfig(customLabels: labels);
    final box = await Hive.openBox('roleConfig');
    await box.put(type.index, _configs[type.index]!.toJson());
    notifyListeners();
  }

  Future<void> resetToDefaults(OrgType type) async {
    _configs.remove(type.index);
    final box = await Hive.openBox('roleConfig');
    await box.delete(type.index);
    notifyListeners();
  }
}
