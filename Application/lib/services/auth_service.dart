import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/auth_user.dart';

/// 通过 EntryAbility 的 MethodChannel 桥接华为账号认证。
class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  static const _channel = MethodChannel('com.smartsociety/auth');

  /// 唤起华为账号登录，成功返回 AuthUser。
  Future<AuthUser> signIn() async {
    final raw = await _channel.invokeMethod<String>('signIn').timeout(
      const Duration(seconds: 120),
    );
    if (raw == null || raw.isEmpty) {
      throw Exception('登录返回为空');
    }
    final json = jsonDecode(raw) as Map<String, dynamic>;
    final openId = json['openId'] as String?;
    if (openId == null || openId.isEmpty) {
      throw Exception('登录失败：未获取到用户标识');
    }
    return AuthUser.fromJson(json);
  }

  /// 登出当前华为账号。
  Future<void> signOut() async {
    await _channel.invokeMethod('signOut').timeout(
      const Duration(seconds: 10),
    );
  }
}
