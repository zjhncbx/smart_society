import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/organization.dart';
import '../services/cloud_function_service.dart';

/// 组织管理状态：创建、加载、切换组织。
class OrganizationProvider extends ChangeNotifier {
  static const _boxName = 'organizations';
  static const _orgsKey = 'myOrgs';
  static const _currentKey = 'currentOrgId';

  final CloudFunctionService _cloud = CloudFunctionService.instance;

  List<Organization> _orgs = [];
  String? _currentOrgId;
  String? _userId;

  List<Organization> get orgs => _orgs;
  Organization? get currentOrg => _orgs.where((o) => o.orgId == _currentOrgId).firstOrNull;
  String? get currentOrgId => _currentOrgId;
  bool get hasOrg => _orgs.isNotEmpty;

  Future<void> init({required String userId}) async {
    _userId = userId;
    final box = await Hive.openBox(_boxName);
    final raw = box.get(_orgsKey);
    if (raw != null) {
      _orgs = (raw as List)
          .map((e) => Organization.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    _currentOrgId = box.get(_currentKey) as String?;
    notifyListeners();
    // 从云端刷新
    try {
      await loadMyOrgs();
    } catch (_) {}
  }

  Future<void> loadMyOrgs() async {
    if (_userId == null) return;
    final data = await _cloud.callChecked('get-my-orgs', params: {'userId': _userId});
    if (data is List) {
      _orgs = data.map((e) => Organization.fromJson(e as Map<String, dynamic>)).toList();
      final box = await Hive.openBox(_boxName);
      await box.put(_orgsKey, _orgs.map((o) => o.toJson()).toList());
      // 如果当前 org 不在列表中则清除
      if (_currentOrgId != null && !_orgs.any((o) => o.orgId == _currentOrgId)) {
        _currentOrgId = _orgs.isNotEmpty ? _orgs.first.orgId : null;
        await box.put(_currentKey, _currentOrgId);
      }
      notifyListeners();
    }
  }

  Future<String> createOrg({
    required String name,
    required String orgType,
    String creditCode = '',
    String description = '',
  }) async {
    if (_userId == null) throw Exception('未登录');
    final res = await _cloud.callChecked('create-org', params: {
      'userId': _userId,
      'name': name,
      'orgType': orgType,
      'creditCode': creditCode,
      'description': description,
    });
    final orgId = (res as Map<String, dynamic>)['orgId'] as String;
    await loadMyOrgs();
    return orgId;
  }

  Future<void> switchOrg(String orgId) async {
    if (!_orgs.any((o) => o.orgId == orgId)) return;
    _currentOrgId = orgId;
    final box = await Hive.openBox(_boxName);
    await box.put(_currentKey, orgId);
    notifyListeners();
  }

  Future<void> joinOrg(String orgId) async {
    if (_userId == null) throw Exception('未登录');
    await _cloud.callChecked('join-org', params: {
      'userId': _userId,
      'orgId': orgId,
    });
    await loadMyOrgs();
  }
}
