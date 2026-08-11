import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import '../config/org_type.dart';
import '../config/theme_config.dart';
import '../services/cloud_function_service.dart';

/// 应用设置：本地 Hive 缓存 + 云端（OrgSettings / UserSettings）读写。
/// 钉钉配置与角色名按组织存 OrgSettings；主题与昵称按用户存 UserSettings。
class SettingsProvider extends ChangeNotifier {
  static const _boxName = 'settings';
  static const _orgTypeKey = 'orgType';
  static const _themeIndexKey = 'themeIndex';
  static const _themeVersionKey = 'themeVersion';
  static const _themeVersion = 2;
  static const _darkModeKey = 'darkMode';
  static const _initializedKey = 'initialized';
  static const _currentOrgIdKey = 'currentOrgId';
  static const _nicknameKey = 'nickname';

  static String _credsKey(String orgId, String suffix) =>
      'dingtalk_${suffix}_$orgId';
  static String _configuredKey(String orgId) => 'dingtalk_configured_$orgId';
  static String _deptsKey(String orgId) => 'dingtalk_selected_depts_$orgId';
  static String _bindKey(String orgId, String suffix) =>
      'memberBind_${suffix}_$orgId';

  final CloudFunctionService _cloud = CloudFunctionService.instance;

  OrgType _orgType = OrgType.schoolClub;
  ThemeConfig _theme = ThemeConfig.campus;
  bool _darkMode = false;
  bool _isInitialized = false;
  String? _currentOrgId;
  String _nickname = '';
  String? _userId;

  OrgType get orgType => _orgType;
  ThemeConfig get theme => _theme;
  ThemeConfig get effectiveTheme => _darkMode
      ? _theme.copyWithBrightness(Brightness.dark)
      : _theme;
  bool get darkMode => _darkMode;
  bool get isInitialized => _isInitialized;
  String? get currentOrgId => _currentOrgId;
  String get nickname => _nickname;

  Future<void> init() async {
    final box = await Hive.openBox(_boxName);
    final orgTypeIndex = box.get(_orgTypeKey);
    if (orgTypeIndex != null) {
      _orgType = OrgType.values[orgTypeIndex as int];
    }
    final themeIndex = box.get(_themeIndexKey);
    if (themeIndex != null) {
      final idx = themeIndex as int;
      final version = box.get(_themeVersionKey);
      if (version == _themeVersion) {
        _theme = idx >= 0 && idx < ThemeConfig.all.length
            ? ThemeConfig.all[idx]
            : ThemeConfig.campus;
      } else {
        // 旧版 4 主题迁移：0 校园、1 志愿→公益红、2 青年、3 政务→公益红
        _theme = switch (idx) {
          1 || 3 => ThemeConfig.welfare,
          2 => ThemeConfig.youth,
          _ => ThemeConfig.campus,
        };
        await box.put(_themeIndexKey, ThemeConfig.all.indexOf(_theme));
        await box.put(_themeVersionKey, _themeVersion);
      }
    }
    _darkMode = box.get(_darkModeKey, defaultValue: false) as bool;
    _isInitialized = box.get(_initializedKey, defaultValue: false) as bool;
    _currentOrgId = box.get(_currentOrgIdKey) as String?;
    _nickname = box.get(_nicknameKey, defaultValue: '') as String;
    notifyListeners();
  }

  /// 用户名（本地昵称，登出后保留；已上云 UserSettings.nickname）
  Future<void> setNickname(String nickname) async {
    if (_nickname == nickname) return;
    _nickname = nickname.trim();
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_nicknameKey, _nickname);
    _pushUserSettings();
  }

  Future<void> setCurrentOrgId(String? orgId) async {
    _currentOrgId = orgId;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_currentOrgIdKey, orgId);
  }

  Future<void> setOrgType(OrgType type) async {
    if (_orgType == type) return;
    _orgType = type;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_orgTypeKey, type.index);
  }

  /// 主题本地立即生效，并异步推送云端（失败静默，下次保存重推）
  Future<void> setTheme(ThemeConfig config, {bool pushCloud = true}) async {
    if (_theme == config) return;
    _theme = config;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_themeIndexKey, ThemeConfig.all.indexOf(config));
    await box.put(_themeVersionKey, _themeVersion);
    if (pushCloud) _pushOrgTheme();
  }

  /// 主题色按组织保存（OrgSettings.themeIndex，仅管理员可改，成员共用）
  void _pushOrgTheme() {
    final orgId = _currentOrgId;
    final userId = _userId;
    if (orgId == null || orgId.isEmpty || userId == null || userId.isEmpty) {
      return;
    }
    _cloud.callChecked(
      'save-org-settings',
      params: {
        'orgId': orgId,
        'userId': userId,
        'themeIndex': ThemeConfig.all.indexOf(_theme),
      },
    ).catchError((Object e) {
      debugPrint('save-org-settings theme failed: $e');
    });
  }

  /// 深色模式（黑色画布）：本地立即生效并异步推送云端
  Future<void> setDarkMode(bool enabled, {bool pushCloud = true}) async {
    if (_darkMode == enabled) return;
    _darkMode = enabled;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_darkModeKey, enabled);
    if (pushCloud) _pushUserSettings();
  }

  Future<void> completeSetup() async {
    _isInitialized = true;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_initializedKey, true);
  }

  // ── 云端同步 ──

  /// 拉取用户级设置（主题/昵称）并应用，覆盖本地值；失败静默（本地兜底）。
  Future<void> loadUserSettings(String userId) async {
    _userId = userId;
    try {
      final data = await _cloud.callChecked(
        'get-user-settings',
        params: {'userId': userId},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final darkMode = map['darkMode'];
      if (darkMode is bool && darkMode != _darkMode) {
        await setDarkMode(darkMode, pushCloud: false);
      }
      final nickname = map['nickname'];
      if (nickname is String && nickname.isNotEmpty && nickname != _nickname) {
        _nickname = nickname;
        notifyListeners();
        final box = await Hive.openBox(_boxName);
        await box.put(_nicknameKey, _nickname);
      }
    } catch (e) {
      debugPrint('loadUserSettings failed: $e');
    }
  }

  /// 拉取组织级设置（钉钉配置/角色名）写入本地缓存；
  /// 返回 roleLabels（调用方转交 RoleConfigProvider）。
  Future<Map<String, dynamic>> loadOrgSettings(String orgId) async {
    if (orgId.isEmpty) return {};
    final userId = _userId;
    if (userId == null || userId.isEmpty) return {};
    try {
      final data = await _cloud.callChecked(
        'get-org-settings',
        params: {'orgId': orgId, 'userId': userId},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final dingtalk = map['dingtalk'];
      final themeIndex = map['themeIndex'];
      if (themeIndex is int &&
          themeIndex >= 0 &&
          themeIndex < ThemeConfig.all.length) {
        await setTheme(ThemeConfig.all[themeIndex], pushCloud: false);
      }
      final box = await Hive.openBox(_boxName);
      if (dingtalk is Map) {
        final configured = dingtalk['configured'] == true;
        await box.put(_configuredKey(orgId), configured);
        if (configured) {
          // 凭证仅管理员可见；成员设备只收到 configured 布尔
          final clientId = dingtalk['clientId'];
          final clientSecret = dingtalk['clientSecret'];
          if (clientId is String && clientId.isNotEmpty) {
            await box.put(_credsKey(orgId, 'clientId'), clientId);
          }
          if (clientSecret is String && clientSecret.isNotEmpty) {
            await box.put(_credsKey(orgId, 'clientSecret'), clientSecret);
          }
        }
        final lastSyncAt = dingtalk['lastSyncAt'];
        if (lastSyncAt is int && lastSyncAt > 0) {
          await box.put(_credsKey(orgId, 'lastSyncAt'), lastSyncAt);
        }
        final lastResult = dingtalk['lastResult'];
        if (lastResult is String && lastResult.isNotEmpty) {
          await box.put(_credsKey(orgId, 'lastResult'), lastResult);
        }
      }
      final roleLabels = map['roleLabels'];
      notifyListeners();
      return roleLabels is Map
          ? Map<String, dynamic>.from(roleLabels)
          : <String, dynamic>{};
    } catch (e) {
      debugPrint('loadOrgSettings failed: $e');
      return {};
    }
  }

  /// 异步推送用户级设置到云端（fire-and-forget，失败静默）
  void _pushUserSettings() {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;
    final nickname = _nickname;
    final darkMode = _darkMode;
    _cloud.callChecked(
      'save-user-settings',
      params: {
        'userId': userId,
        'nickname': nickname,
        'darkMode': darkMode,
      },
    ).catchError((Object e) {
      debugPrint('save-user-settings failed: $e');
    });
  }

  // ── 钉钉配置（按组织，云端 OrgSettings）──

  String? dingTalkClientId(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'clientId')) as String?;
  }

  String? dingTalkClientSecret(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'clientSecret')) as String?;
  }

  /// 该组织是否已配置钉钉（决定成员是否只读）。云端下发 configured 布尔优先。
  bool isDingTalkConfigured(String orgId) {
    if (orgId.isEmpty) return false;
    final box = Hive.box(_boxName);
    final cfg = box.get(_configuredKey(orgId));
    if (cfg is bool) return cfg;
    // 兼容旧数据：本地有完整凭证也视为已配置
    final id = box.get(_credsKey(orgId, 'clientId'));
    final secret = box.get(_credsKey(orgId, 'clientSecret'));
    return id != null && id.isNotEmpty && secret != null && secret.isNotEmpty;
  }

  /// 保存钉钉凭证：先写云端（管理员校验），成功后才更新本地。
  Future<void> setDingTalkConfig(
    String orgId,
    String clientId,
    String clientSecret,
  ) async {
    if (orgId.isEmpty) return;
    final userId = _userId;
    if (userId == null || userId.isEmpty) throw Exception('未登录');
    await _cloud.callChecked(
      'save-org-settings',
      params: {
        'orgId': orgId,
        'userId': userId,
        'dingtalkClientId': clientId,
        'dingtalkClientSecret': clientSecret,
      },
    );
    final box = await Hive.openBox(_boxName);
    await box.put(_credsKey(orgId, 'clientId'), clientId);
    await box.put(_credsKey(orgId, 'clientSecret'), clientSecret);
    await box.put(_configuredKey(orgId), true);
    notifyListeners();
  }

  DateTime? dingTalkLastSyncAt(String orgId) {
    if (orgId.isEmpty) return null;
    final v = Hive.box(_boxName).get(_credsKey(orgId, 'lastSyncAt'));
    return v is int ? DateTime.fromMillisecondsSinceEpoch(v) : null;
  }

  /// 上次同步选择的钉钉组织（部门）ID 列表；空表示未选择过（默认全部）。
  List<int> dingTalkSelectedDeptIds(String orgId) {
    if (orgId.isEmpty) return const [];
    final v = Hive.box(_boxName).get(_deptsKey(orgId));
    return v is List ? v.whereType<int>().toList() : const [];
  }

  Future<void> setDingTalkSelectedDeptIds(
    String orgId,
    List<int> deptIds,
  ) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    await box.put(_deptsKey(orgId), deptIds);
  }

  String? dingTalkLastResult(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'lastResult')) as String?;
  }

  /// 保存同步结果：先写云端，成功后才更新本地。
  Future<void> setDingTalkLastSync(
    String orgId,
    DateTime at,
    String result,
  ) async {
    if (orgId.isEmpty) return;
    final userId = _userId;
    if (userId == null || userId.isEmpty) throw Exception('未登录');
    await _cloud.callChecked(
      'save-org-settings',
      params: {
        'orgId': orgId,
        'userId': userId,
        'dingtalkLastSyncAt': at.millisecondsSinceEpoch,
        'dingtalkLastResult': result,
      },
    );
    final box = await Hive.openBox(_boxName);
    await box.put(_credsKey(orgId, 'lastSyncAt'), at.millisecondsSinceEpoch);
    await box.put(_credsKey(orgId, 'lastResult'), result);
    notifyListeners();
  }

  // ── 会员绑定（本地缓存，云端以 UserOrganization.memberId 为准）──

  ({String memberId, String memberName})? memberBinding(String orgId) {
    if (orgId.isEmpty) return null;
    final box = Hive.box(_boxName);
    final id = box.get(_bindKey(orgId, 'id')) as String?;
    if (id == null || id.isEmpty) return null;
    return (
      memberId: id,
      memberName: (box.get(_bindKey(orgId, 'name')) as String?) ?? '',
    );
  }

  Future<void> setMemberBinding(
    String orgId,
    String memberId,
    String memberName,
  ) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    await box.put(_bindKey(orgId, 'id'), memberId);
    await box.put(_bindKey(orgId, 'name'), memberName);
    notifyListeners();
  }

  /// 清除某组织的全部本地配置（钉钉凭证、同步记录、绑定与 configured 标记）
  Future<void> clearOrgData(String orgId) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    for (final suffix in [
      'clientId',
      'clientSecret',
      'lastSyncAt',
      'lastResult',
    ]) {
      await box.delete(_credsKey(orgId, suffix));
    }
    await box.delete(_configuredKey(orgId));
    await box.delete(_deptsKey(orgId));
    await box.delete(_bindKey(orgId, 'id'));
    await box.delete(_bindKey(orgId, 'name'));
  }

  /// 清空全部设置（用户注销时调用）
  Future<void> clearAll() async {
    _orgType = OrgType.schoolClub;
    _theme = ThemeConfig.campus;
    _darkMode = false;
    _isInitialized = false;
    _currentOrgId = null;
    _nickname = '';
    _userId = null;
    final box = await Hive.openBox(_boxName);
    await box.clear();
    notifyListeners();
  }
}
