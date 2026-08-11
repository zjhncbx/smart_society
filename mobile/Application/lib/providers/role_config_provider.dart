import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/role_config.dart';
import '../services/cloud_function_service.dart';

/// 角色自定义名称：本地按组织缓存，写入时同步云端（OrgSettings.roleLabels）。
class RoleConfigProvider extends ChangeNotifier {
  final Map<String, CustomRoleConfig> _configs = {};
  final CloudFunctionService _cloud = CloudFunctionService.instance;

  /// 当前登录用户（云端保存时用于管理员校验）
  String? userId;

  Future<void> init() async {
    final box = await Hive.openBox('roleConfig');
    for (final key in box.keys) {
      final data = box.get(key);
      if (key is String && data != null) {
        _configs[key] = CustomRoleConfig.fromJson(
          Map<String, dynamic>.from(data as Map),
        );
      }
    }
  }

  String getLabel(String orgId, String roleId, String defaultLabel) =>
      _configs[orgId]?.getLabel(roleId, defaultLabel) ?? defaultLabel;

  /// 保存角色名：先推云端（管理员校验），成功后才更新本地缓存。
  Future<void> setLabel(String orgId, String roleId, String newLabel) async {
    final config = _configs[orgId] ?? const CustomRoleConfig(customLabels: {});
    // const CustomRoleConfig(customLabels: {}) 的 {} 是不可变 map，用 copy-on-write
    final labels = Map<String, String>.from(config.customLabels);
    labels[roleId] = newLabel;
    if (orgId.isNotEmpty) {
      await _cloud.callChecked(
        'save-org-settings',
        params: {
          'orgId': orgId,
          'userId': userId ?? '',
          'roleLabels': labels,
        },
      );
    }
    _configs[orgId] = CustomRoleConfig(customLabels: labels);
    final box = await Hive.openBox('roleConfig');
    await box.put(orgId, _configs[orgId]!.toJson());
    notifyListeners();
  }

  /// 恢复默认：清空该组织全部自定义角色名（云端 + 本地）。
  Future<void> resetToDefaults(String orgId) async {
    if (orgId.isNotEmpty) {
      await _cloud.callChecked(
        'save-org-settings',
        params: {'orgId': orgId, 'userId': userId ?? '', 'roleLabels': {}},
      );
    }
    _configs.remove(orgId);
    final box = await Hive.openBox('roleConfig');
    await box.delete(orgId);
    notifyListeners();
  }

  /// 用云端数据覆盖本地缓存（组织切换/刷新时调用）。
  void loadFromCloud(String orgId, Map<String, dynamic> roleLabels) {
    if (roleLabels.isEmpty) {
      _configs.remove(orgId);
    } else {
      _configs[orgId] = CustomRoleConfig(
        customLabels: roleLabels.map((k, v) => MapEntry(k, '$v')),
      );
    }
    notifyListeners();
  }
}
