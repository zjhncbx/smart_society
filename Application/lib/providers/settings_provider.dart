import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import '../config/org_type.dart';
import '../config/theme_config.dart';

class SettingsProvider extends ChangeNotifier {
  static const _boxName = 'settings';
  static const _orgTypeKey = 'orgType';
  static const _themeIndexKey = 'themeIndex';
  static const _initializedKey = 'initialized';
  static const _currentOrgIdKey = 'currentOrgId';

  static String _credsKey(String orgId, String suffix) => 'dingtalk_${suffix}_$orgId';

  OrgType _orgType = OrgType.schoolClub;
  ThemeConfig _theme = ThemeConfig.campus;
  bool _isInitialized = false;
  String? _currentOrgId;

  OrgType get orgType => _orgType;
  ThemeConfig get theme => _theme;
  bool get isInitialized => _isInitialized;
  String? get currentOrgId => _currentOrgId;

  Future<void> init() async {
    final box = await Hive.openBox(_boxName);
    final orgTypeIndex = box.get(_orgTypeKey);
    if (orgTypeIndex != null) {
      _orgType = OrgType.values[orgTypeIndex as int];
    }
    final themeIndex = box.get(_themeIndexKey);
    if (themeIndex != null) {
      _theme = ThemeConfig.all[themeIndex as int];
    }
    _isInitialized = box.get(_initializedKey, defaultValue: false) as bool;
    _currentOrgId = box.get(_currentOrgIdKey) as String?;
    notifyListeners();
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

  Future<void> setTheme(ThemeConfig config) async {
    if (_theme == config) return;
    _theme = config;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_themeIndexKey, ThemeConfig.all.indexOf(config));
  }

  Future<void> completeSetup() async {
    _isInitialized = true;
    notifyListeners();
    final box = await Hive.openBox(_boxName);
    await box.put(_initializedKey, true);
  }

  // ── 钉钉配置（按组织）──

  String? dingTalkClientId(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'clientId')) as String?;
  }

  String? dingTalkClientSecret(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'clientSecret')) as String?;
  }

  /// 该组织是否已配置钉钉（决定成员是否只读）
  bool isDingTalkConfigured(String orgId) {
    if (orgId.isEmpty) return false;
    final id = dingTalkClientId(orgId);
    final secret = dingTalkClientSecret(orgId);
    return id != null && id.isNotEmpty && secret != null && secret.isNotEmpty;
  }

  Future<void> setDingTalkConfig(
      String orgId, String clientId, String clientSecret) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    await box.put(_credsKey(orgId, 'clientId'), clientId);
    await box.put(_credsKey(orgId, 'clientSecret'), clientSecret);
    notifyListeners();
  }

  DateTime? dingTalkLastSyncAt(String orgId) {
    if (orgId.isEmpty) return null;
    final v = Hive.box(_boxName).get(_credsKey(orgId, 'lastSyncAt'));
    return v is int ? DateTime.fromMillisecondsSinceEpoch(v) : null;
  }

  String? dingTalkLastResult(String orgId) {
    if (orgId.isEmpty) return null;
    return Hive.box(_boxName).get(_credsKey(orgId, 'lastResult')) as String?;
  }

  Future<void> setDingTalkLastSync(
      String orgId, DateTime at, String result) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    await box.put(_credsKey(orgId, 'lastSyncAt'), at.millisecondsSinceEpoch);
    await box.put(_credsKey(orgId, 'lastResult'), result);
    notifyListeners();
  }

  /// 清除某组织的全部本地配置（钉钉凭证与上次同步记录，组织注销时调用）
  Future<void> clearOrgData(String orgId) async {
    if (orgId.isEmpty) return;
    final box = await Hive.openBox(_boxName);
    for (final suffix in ['clientId', 'clientSecret', 'lastSyncAt', 'lastResult']) {
      await box.delete(_credsKey(orgId, suffix));
    }
  }

  /// 清空全部设置（用户注销时调用）
  Future<void> clearAll() async {
    _orgType = OrgType.schoolClub;
    _theme = ThemeConfig.campus;
    _isInitialized = false;
    _currentOrgId = null;
    final box = await Hive.openBox(_boxName);
    await box.clear();
    notifyListeners();
  }
}
