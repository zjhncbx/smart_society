import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/organization.dart';
import '../services/cloud_function_service.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart';
import 'settings_provider.dart';
import 'sync_provider.dart';

/// 组织管理状态：创建、加载、切换组织、注销。
class OrganizationProvider extends ChangeNotifier {
  static const _boxName = 'organizations';
  static const _orgsKey = 'myOrgs';
  static const _currentKey = 'currentOrgId';

  final CloudFunctionService _cloud = CloudFunctionService.instance;
  final AuthProvider _auth;
  final SettingsProvider _settings;

  OrganizationProvider({required AuthProvider auth, required SettingsProvider settings})
      : _auth = auth,
        _settings = settings;

  List<Organization> _orgs = [];
  String? _currentOrgId;
  String? _userId;

  List<Organization> get orgs => _orgs;
  Organization? get currentOrg => _orgs.where((o) => o.orgId == _currentOrgId).firstOrNull;
  String? get currentOrgId => _currentOrgId;
  bool get hasOrg => _orgs.isNotEmpty;

  /// 当前用户在当前组织的角色（云端 get-my-orgs 下发；null=尚未刷新）
  String? get currentOrgRole => currentOrg?.userRole;

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
    // 自动拉取当前组织的最新数据（成员/项目/公告）
    final orgId = _currentOrgId;
    if (orgId != null && orgId.isNotEmpty) {
      SyncProvider.instance.pullAndRefresh(orgId);
    }
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
    // 切换组织后自动拉取该组织最新数据
    SyncProvider.instance.pullAndRefresh(orgId);
  }

  Future<void> joinOrg(String orgId) async {
    if (_userId == null) throw Exception('未登录');
    await _cloud.callChecked('join-org', params: {
      'userId': _userId,
      'orgId': orgId,
    });
    await loadMyOrgs();
  }

  /// 注销组织：删除云端该组织全部数据；若这是用户唯一组织，用户数据一并注销。
  /// 返回 true 表示用户已被注销（调用方应跳转登录页）。
  Future<bool> deleteOrg(String orgId) async {
    if (_userId == null) throw Exception('未登录');
    final res = await _cloud.callChecked('delete-org', params: {
      'orgId': orgId,
      'userId': _userId,
    });
    final map = res is Map<String, dynamic> ? res : <String, dynamic>{};
    final userDeregistered = map['userDeregistered'] == true;

    if (userDeregistered) {
      await _wipeAllLocal();
      return true;
    }

    // 仅注销该组织：清理本地缓存并切到剩余组织
    final box = await Hive.openBox(_boxName);
    _orgs = _orgs.where((o) => o.orgId != orgId).toList();
    await box.put(_orgsKey, _orgs.map((o) => o.toJson()).toList());
    final nextOrgId = _orgs.isNotEmpty ? _orgs.first.orgId : null;
    _currentOrgId = nextOrgId;
    await box.put(_currentKey, nextOrgId);

    await _settings.setCurrentOrgId(nextOrgId);
    await StorageService.instance.removeOrgData(orgId);
    await _settings.clearOrgData(orgId);
    final sync = SyncProvider.instance;
    await sync.removeQueueForOrg(orgId);
    notifyListeners();
    if (nextOrgId != null) {
      await sync.pullAndRefresh(nextOrgId);
    }
    return false;
  }

  /// 注销用户：删除云端本用户全部数据；仅有一个账号的组织跟随注销。
  Future<void> deleteUser() async {
    if (_userId == null) throw Exception('未登录');
    await _cloud.callChecked('delete-user', params: {'userId': _userId});
    await _wipeAllLocal();
  }

  /// 本地全量清理（auth/organizations/settings/sync_queue/业务数据）
  Future<void> _wipeAllLocal() async {
    _resetLocal();
    await _auth.signOut();
    await StorageService.instance.clearAllData();
    await _settings.clearAll();
    await SyncProvider.instance.clearAll();
    notifyListeners();
  }

  void _resetLocal() {
    _orgs = [];
    _currentOrgId = null;
  }
}
