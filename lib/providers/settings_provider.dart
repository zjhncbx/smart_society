import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import '../config/org_type.dart';
import '../config/theme_config.dart';

class SettingsProvider extends ChangeNotifier {
  static const _boxName = 'settings';
  static const _orgTypeKey = 'orgType';
  static const _themeIndexKey = 'themeIndex';
  static const _initializedKey = 'initialized';

  OrgType _orgType = OrgType.schoolClub;
  ThemeConfig _theme = ThemeConfig.campus;
  bool _isInitialized = false;

  OrgType get orgType => _orgType;
  ThemeConfig get theme => _theme;
  bool get isInitialized => _isInitialized;

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
    notifyListeners();
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
}
