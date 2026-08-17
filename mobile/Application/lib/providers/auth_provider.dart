import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/auth_user.dart';
import '../services/auth_gate.dart' as gate;
import '../services/auth_service.dart';

/// 认证状态管理：登录、登出、会话持久化。
class AuthProvider extends ChangeNotifier {
  static const _boxName = 'auth';
  static const _userKey = 'user';

  final AuthService _authService = AuthService.instance;

  AuthUser? _user;
  bool _loading = false;
  String? _error;

  AuthUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String? get error => _error;

  /// 跨端统一内部 userId（华为登录经 ensure-user-identity 映射；密码账号即 AppUser.id）
  String get userId => _user?.id ?? _user?.openId ?? '';

  Future<void> init() async {
    final box = await Hive.openBox(_boxName);
    final raw = box.get(_userKey);
    if (raw != null) {
      _user = AuthUser.fromJson(Map<String, dynamic>.from(raw as Map));
    }
    gate.isAuthenticated = _user != null;
    notifyListeners();
  }

  Future<void> signIn() async {
    if (_loading) return;
    // 本地会话已存在（如 router 尚未跳转的窗口期），避免重复唤起原生登录
    if (_user != null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    debugPrint('[AuthProvider] signIn: 开始登录');
    try {
      _user = await _authService.signIn();
      gate.isAuthenticated = true;
      final box = await Hive.openBox(_boxName);
      await box.put(_userKey, _user!.toJson());
      debugPrint('[AuthProvider] signIn: 登录成功，用户=${_user!.displayName}');
    } catch (e) {
      _error = e.toString();
      debugPrint('[AuthProvider] signIn: 登录失败 -> $_error');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// 手机号/邮箱 + 密码注册或登录（个人账号，与华为账号等价）
  Future<void> signInWithAccount({
    required String account,
    required String password,
    required bool register,
    String? displayName,
  }) async {
    if (_loading) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _user = await _authService.signInWithAccount(
        account: account,
        password: password,
        register: register,
        displayName: displayName,
      );
      gate.isAuthenticated = true;
      final box = await Hive.openBox(_boxName);
      await box.put(_userKey, _user!.toJson());
      debugPrint('[AuthProvider] account signIn success: ${_user!.displayName}');
    } catch (e) {
      _error = e.toString();
      debugPrint('[AuthProvider] account signIn failed -> $_error');
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
    gate.isAuthenticated = false;
    final box = await Hive.openBox(_boxName);
    await box.delete(_userKey);
    notifyListeners();
  }
}
