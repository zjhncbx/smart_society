import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../config/org_type.dart';
import '../models/organization.dart';
import '../services/cloud_function_service.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart';
import 'role_config_provider.dart';
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
  final RoleConfigProvider _roleConfig;

  OrganizationProvider({
    required AuthProvider auth,
    required SettingsProvider settings,
    required RoleConfigProvider roleConfig,
  }) : _auth = auth,
       _settings = settings,
       _roleConfig = roleConfig;

  List<Organization> _orgs = [];
  String? _currentOrgId;
  String? _userId;

  List<Organization> get orgs => _orgs;
  Organization? get currentOrg =>
      _orgs.where((o) => o.orgId == _currentOrgId).firstOrNull;
  String? get currentOrgId => _currentOrgId;
  bool get hasOrg => _orgs.isNotEmpty;

  /// 当前用户在当前组织的角色（云端 get-my-orgs 下发；null=尚未刷新）
  String? get currentOrgRole => currentOrg?.userRole;

  /// 将 SettingsProvider.orgType 与当前组织类型对齐（当前组织变化时调用）
  Future<void> _syncOrgType() async {
    final type = switch (currentOrg?.orgType) {
      'schoolClub' => OrgType.schoolClub,
      'volunteerTeam' => OrgType.volunteerTeam,
      'socialOrg' => OrgType.socialOrg,
      _ => null,
    };
    if (type != null && type != _settings.orgType) {
      await _settings.setOrgType(type);
    }
  }

  Future<void> init({required String userId}) async {
    _userId = userId;
    final box = await Hive.openBox(_boxName);
    final raw = box.get(_orgsKey);
    if (raw != null) {
      _orgs = (raw as List)
          .map(
            (e) => Organization.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList();
    }
    _currentOrgId = box.get(_currentKey) as String?;
    // 与 SettingsProvider 的 currentOrgId 对齐（设置页/钉钉配置按它取组织）
    await _settings.setCurrentOrgId(_currentOrgId);
    notifyListeners();
    // 本地缓存先对齐一次组织类型，云端刷新失败也能保持正确
    await _syncOrgType();
    // 拉取用户级设置（主题/昵称，会设置 SettingsProvider._userId）
    await _settings.loadUserSettings(userId);
    // 从云端刷新
    try {
      await loadMyOrgs();
    } catch (_) {}
    // 自动拉取当前组织的设置与最新数据（成员/项目/公告）
    final orgId = _currentOrgId;
    if (orgId != null && orgId.isNotEmpty) {
      final roleLabels = await _settings.loadOrgSettings(orgId);
      _roleConfig.loadFromCloud(orgId, roleLabels);
      SyncProvider.instance.pullAndRefresh(orgId);
    }
  }

  Future<void> loadMyOrgs() async {
    if (_userId == null) return;
    final data = await _cloud.callChecked(
      'get-my-orgs',
      params: {'userId': _userId},
    );
    if (data is List) {
      _orgs = data
          .map((e) => Organization.fromJson(e as Map<String, dynamic>))
          .toList();
      final box = await Hive.openBox(_boxName);
      await box.put(_orgsKey, _orgs.map((o) => o.toJson()).toList());
      // 如果当前 org 不在列表中则清除
      if (_currentOrgId != null &&
          !_orgs.any((o) => o.orgId == _currentOrgId)) {
        _currentOrgId = _orgs.isNotEmpty ? _orgs.first.orgId : null;
        await box.put(_currentKey, _currentOrgId);
      }
      await _settings.setCurrentOrgId(_currentOrgId);
      await _syncOrgType();
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
    final res = await _cloud.callChecked(
      'create-org',
      params: {
        'userId': _userId,
        'name': name,
        'orgType': orgType,
        'creditCode': creditCode,
        'description': description,
      },
    );
    final orgId = (res as Map<String, dynamic>)['orgId'] as String;
    // 创建成功后自动切换到新组织
    _currentOrgId = orgId;
    final box = await Hive.openBox(_boxName);
    await box.put(_currentKey, orgId);
    await _settings.setCurrentOrgId(orgId);
    await loadMyOrgs();
    // 拉取新组织设置（角色名/钉钉配置；新组织为空则清本地缓存）
    final roleLabels = await _settings.loadOrgSettings(orgId);
    _roleConfig.loadFromCloud(orgId, roleLabels);
    return orgId;
  }

  Future<void> switchOrg(String orgId) async {
    if (!_orgs.any((o) => o.orgId == orgId)) return;
    _currentOrgId = orgId;
    final box = await Hive.openBox(_boxName);
    await box.put(_currentKey, orgId);
    await _settings.setCurrentOrgId(orgId);
    notifyListeners();
    await _syncOrgType();
    final roleLabels = await _settings.loadOrgSettings(orgId);
    _roleConfig.loadFromCloud(orgId, roleLabels);
    // 切换组织后自动拉取该组织最新数据
    SyncProvider.instance.pullAndRefresh(orgId);
  }

  Future<void> joinOrg(String orgId) async {
    if (_userId == null) throw Exception('未登录');
    await _cloud.callChecked(
      'join-org',
      params: {'userId': _userId, 'orgId': orgId},
    );
    await loadMyOrgs();
  }

  /// 按手机号绑定当前组织的会员（云端存 UserOrganization.memberId，本地缓存展示用）。
  Future<Map<String, dynamic>> bindMember(String phone) async {
    final orgId = _currentOrgId;
    if (_userId == null || orgId == null) throw Exception('未登录或未加入组织');
    final res = await _cloud.callChecked(
      'bind-member',
      params: {'orgId': orgId, 'userId': _userId, 'phone': phone},
    );
    final map = res is Map<String, dynamic> ? res : <String, dynamic>{};
    final memberId = map['memberId'] as String? ?? '';
    final memberName = map['memberName'] as String? ?? '';
    if (memberId.isNotEmpty) {
      await _settings.setMemberBinding(orgId, memberId, memberName);
    }
    return map;
  }

  /// 变更管理员：目标账号（已绑定会员）升为管理员，操作者降为普通成员。
  Future<Map<String, dynamic>> transferAdmin(String memberId) async {
    final orgId = _currentOrgId;
    if (_userId == null || orgId == null) throw Exception('未登录或未加入组织');
    final res = await _cloud.callChecked(
      'set-org-admin',
      params: {'orgId': orgId, 'userId': _userId, 'memberId': memberId},
    );
    // 操作者已不再是管理员，刷新本地角色；刷新失败不影响云端结果
    try {
      await loadMyOrgs();
    } catch (_) {}
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  /// 注销组织：删除云端该组织全部数据；若这是用户唯一组织，用户数据一并注销。
  /// 返回 true 表示用户已被注销（调用方应跳转登录页）。
  Future<bool> deleteOrg(String orgId) async {
    if (_userId == null) throw Exception('未登录');
    final res = await _cloud.callChecked(
      'delete-org',
      params: {'orgId': orgId, 'userId': _userId},
    );
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
    await _syncOrgType();
    notifyListeners();
    if (nextOrgId != null) {
      final roleLabels = await _settings.loadOrgSettings(nextOrgId);
      _roleConfig.loadFromCloud(nextOrgId, roleLabels);
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
