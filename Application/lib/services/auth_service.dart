import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/auth_user.dart';

/// 通过 EntryAbility 的 MethodChannel 桥接华为账号认证。
class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  static const _channel = MethodChannel('com.smartsociety/auth');

  /// 调试日志输出到控制台，IDE 调试模式下可见。
  static void _log(String message) {
    debugPrint('[AuthService] $message');
  }

  /// 唤起华为账号登录，成功返回 AuthUser。
  Future<AuthUser> signIn() async {
    _log('signIn: 开始调用原生登录通道');
    try {
      final raw = await _channel.invokeMethod<String>('signIn').timeout(
        const Duration(seconds: 120),
      );
      _log('signIn: 原生返回 raw=${raw ?? 'null'}');
      if (raw == null || raw.isEmpty) {
        throw Exception('登录返回为空');
      }
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final openId = json['openId'] as String?;
      if (openId == null || openId.isEmpty) {
        throw Exception('登录失败：未获取到用户标识');
      }
      _log('signIn: 成功 openId=$openId displayName=${json['displayName']}');
      return AuthUser.fromJson(json);
    } on PlatformException catch (e) {
      _log('signIn: PlatformException code=${e.code} message=${e.message} details=${e.details}');
      rethrow;
    } on TimeoutException {
      _log('signIn: 调用超时(120s)');
      rethrow;
    } catch (e) {
      _log('signIn: 异常 $e');
      rethrow;
    }
  }

  /// 登出当前华为账号。
  Future<void> signOut() async {
    _log('signOut: 开始调用原生登出通道');
    try {
      await _channel.invokeMethod('signOut').timeout(
        const Duration(seconds: 10),
      );
      _log('signOut: 成功');
    } catch (e) {
      _log('signOut: 失败 $e');
      rethrow;
    }
  }
}
