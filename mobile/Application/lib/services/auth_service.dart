import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/auth_user.dart';
import 'cloud_function_service.dart';

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
      final external = AuthUser.fromJson(json);
      // 跨端统一身份：外部 OpenID 映射为内部稳定 userId（幂等）
      final identity = await CloudFunctionService.instance.callChecked(
        'ensure-user-identity',
        params: {
          'provider': 'huawei',
          'providerSubject': openId,
          'displayName': external.displayName ?? '',
        },
        timeout: const Duration(seconds: 30),
      );
      final identityMap = identity is Map<String, dynamic> ? identity : <String, dynamic>{};
      final userId = (identityMap['userId'] as String?) ?? external.openId;
      _log('signIn: 内部 userId=$userId');
      return AuthUser(
        id: userId,
        openId: external.openId,
        unionId: external.unionId,
        displayName: external.displayName,
        avatarUri: external.avatarUri,
        loginType: 'huawei',
      );
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

  /// 手机号/邮箱 + 密码注册或登录（云函数，scrypt 加盐哈希）
  Future<AuthUser> signInWithAccount({
    required String account,
    required String password,
    required bool register,
    String? displayName,
  }) async {
    _log('signInWithAccount: register=$register account=$account');
    final data = await CloudFunctionService.instance.callChecked(
      register ? 'register-user' : 'login-user',
      params: {
        'account': account,
        'password': password,
        if (displayName != null && displayName.isNotEmpty)
          'displayName': displayName,
      },
      timeout: const Duration(seconds: 30),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    final userId = map['userId'] as String?;
    if (userId == null || userId.isEmpty) {
      throw Exception('登录失败：未获取到用户标识');
    }
    _log('signInWithAccount: success userId=$userId');
    return AuthUser(
      id: userId,
      openId: userId,
      displayName: (map['displayName'] as String?) ?? '用户',
      loginType: 'account',
    );
  }

  /// 查询原生 AGC Auth 会话；未登录返回 null，通道不可用时返回 null（不阻断启动）。
  Future<AuthUser?> getCurrentUser() async {
    try {
      final raw = await _channel
          .invokeMethod<String>('getUserInfo')
          .timeout(const Duration(seconds: 10));
      if (raw == null || raw.isEmpty) return null;
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final openId = json['openId'] as String?;
      if (openId == null || openId.isEmpty) return null;
      return AuthUser(
        id: openId,
        openId: openId,
        displayName: json['displayName'] as String?,
        avatarUri: json['avatarUri'] as String?,
        loginType: 'huawei',
      );
    } on PlatformException catch (e) {
      if (e.code == 'NOT_LOGGED_IN') {
        _log('getCurrentUser: 未登录');
        return null;
      }
      _log('getCurrentUser: 通道异常 code=${e.code} msg=${e.message}');
      return null;
    } catch (e) {
      _log('getCurrentUser: 异常 $e');
      return null;
    }
  }
}
