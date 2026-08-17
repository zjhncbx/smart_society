import 'package:flutter/foundation.dart';

import '../models/permission.dart';
import '../services/cloud_function_service.dart';

/// 权限框架（P0-C）：云端计算角色/权限/数据范围，客户端只做 UI 判断。
class PermissionProvider extends ChangeNotifier {
  PermissionProvider({
    required String Function() orgIdGetter,
    required String Function() userIdGetter,
  })  : _orgIdGetter = orgIdGetter,
        _userIdGetter = userIdGetter;

  final CloudFunctionService _cloud = CloudFunctionService.instance;
  final String Function() _orgIdGetter;
  final String Function() _userIdGetter;

  PermissionBundle _bundle = const PermissionBundle();
  bool _loading = false;

  PermissionBundle get bundle => _bundle;
  bool get loading => _loading;
  bool get isAdmin => _bundle.isAdmin;
  String get roleName => _bundle.roleName;

  bool has(String code) => _bundle.has(code);
  bool get canManageOrg => _bundle.canManageOrg;
  bool get canDeleteOrg => _bundle.canDeleteOrg;
  bool get canViewFinance => _bundle.canViewFinance;
  bool get canViewAudit => _bundle.canViewAudit;
  bool get canRunAutomation => _bundle.canRunAutomation;

  Future<void> load() async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    if (_loading) return;
    _loading = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'get-my-permissions',
        params: {'orgId': orgId, 'userId': userId},
        timeout: const Duration(seconds: 30),
      );
      if (data is Map<String, dynamic>) {
        _bundle = PermissionBundle.fromJson(data);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('PermissionProvider.load failed: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
