import 'dart:convert';

import 'package:flutter/services.dart';

/// 通过 EntryAbility 的 MethodChannel 桥接调用鸿蒙云函数（@kit.CloudFoundationKit）。
class CloudFunctionService {
  CloudFunctionService._();

  static final CloudFunctionService instance = CloudFunctionService._();

  static const _channel = MethodChannel('com.smartsociety/cloud');

  /// 通道连通性自检：原生侧返回 'pong'。通道未注册时抛 MissingPluginException。
  Future<String> ping() async {
    final res = await _channel
        .invokeMethod<String>('ping')
        .timeout(const Duration(seconds: 5));
    return res ?? '';
  }

  /// 调用云函数，返回解码后的 JSON（函数应返回 { code, data, message } 结构）。
  Future<dynamic> call(String name, {Map<String, dynamic>? params}) async {
    final raw = await _channel
        .invokeMethod<String>('callFunction', {
          'name': name,
          if (params != null && params.isNotEmpty) 'data': params,
        })
        .timeout(const Duration(seconds: 30));
    if (raw == null || raw.isEmpty) return null;
    return jsonDecode(raw);
  }

  /// 统一返回格式：{ code: 0, data: ... }；支持 { ret: { code, data } } 嵌套格式。
  /// 非 0 抛出异常。
  Future<dynamic> callChecked(String name, {Map<String, dynamic>? params}) async {
    final res = await call(name, params: params);
    if (res is! Map) {
      throw Exception('云函数 $name 返回格式异常: $res');
    }
    // 云函数 callback 可能包裹在 ret 中，先解包
    final body = (res['ret'] as Map<String, dynamic>?) ?? res;
    final code = body['code'] as int? ?? -1;
    if (code != 0) {
      throw Exception('云函数 $name 调用失败: ${body['message'] ?? res}');
    }
    return body['data'];
  }

  /// 带重试的 callChecked，最多尝试 3 次，指数退避。
  Future<dynamic> callWithRetry(String name, {Map<String, dynamic>? params, int maxRetries = 3}) async {
    Exception? lastError;
    for (int i = 0; i < maxRetries; i++) {
      try {
        return await callChecked(name, params: params);
      } catch (e) {
        lastError = e is Exception ? e : Exception('$e');
        if (i < maxRetries - 1) {
          await Future.delayed(Duration(milliseconds: 500 * (1 << i)));
        }
      }
    }
    throw lastError!;
  }
}
