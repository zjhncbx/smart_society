import 'dart:convert';

import 'package:flutter/services.dart';

/// 通过 EntryAbility 的 MethodChannel 桥接调用鸿蒙云函数（@kit.CloudFoundationKit）。
class CloudFunctionService {
  CloudFunctionService._();

  static final CloudFunctionService instance = CloudFunctionService._();

  static const _channel = MethodChannel('com.smartsociety/cloud');

  /// 调用云函数，返回解码后的 JSON（函数应返回 { code, data, message } 结构）。
  Future<dynamic> call(String name, {Map<String, dynamic>? params}) async {
    final raw = await _channel.invokeMethod<String>('callFunction', {
      'name': name,
      if (params != null && params.isNotEmpty) 'data': params,
    });
    if (raw == null || raw.isEmpty) return null;
    return jsonDecode(raw);
  }

  /// 统一返回格式：{ code: 0, data: ... }；非 0 抛出异常。
  Future<dynamic> callChecked(String name, {Map<String, dynamic>? params}) async {
    final res = await call(name, params: params);
    final code = res is Map ? res['code'] : -1;
    if (code != 0) {
      throw Exception('云函数 $name 调用失败: ${res is Map ? res['message'] : res}');
    }
    return res is Map ? res['data'] : null;
  }
}
