import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/auth_user.dart';
import '../services/auth_service.dart';

/// 认证状态管理：登录、登出、会话持久化。
class AuthProvider extends ChangeNotifier {
  static const _boxName = 'auth';
  static const _userKey = 'user';

  final AuthService _authService = AuthService.instance;

  AuthUser? _user;
  bool _loading = false;

  AuthUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;

  Future<void> init() async {
    final box = await Hive.openBox(_boxName);
    final raw = box.get(_userKey);
    if (raw != null) {
      _user = AuthUser.fromJson(Map<String, dynamic>.from(raw as Map));
    }
    notifyListeners();
  }

  Future<void> signIn() async {
    if (_loading) return;
    _loading = true;
    notifyListeners();
    try {
      _user = await _authService.signIn();
      final box = await Hive.openBox(_boxName);
      await box.put(_userKey, _user!.toJson());
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      await _authService.signOut();
    } catch (_) {
      // 即使原生登出失败也清除本地状态
    }
    _user = null;
    final box = await Hive.openBox(_boxName);
    await box.delete(_userKey);
    notifyListeners();
  }
}
