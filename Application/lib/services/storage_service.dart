import 'dart:io';

import 'package:flutter/services.dart';
import 'package:hive/hive.dart';

/// 本地存储服务：Hive 持久化成员/活动/通知数据。
///
/// 存储目录优先通过原生 MethodChannel 获取（鸿蒙真机沙箱路径），
/// 原生不可用时回退到临时目录（桌面预览场景）。
class StorageService {
  StorageService._();

  static final StorageService instance = StorageService._();

  static const MethodChannel _pathChannel =
      MethodChannel('com.smartsociety/storage');

  static const String membersBoxName = 'members';
  static const String activitiesBoxName = 'activities';
  static const String noticesBoxName = 'notices';

  late final Box<dynamic> membersBox;
  late final Box<dynamic> activitiesBox;
  late final Box<dynamic> noticesBox;

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    final path = await _resolveStoragePath();
    Hive.init(path);
    membersBox = await Hive.openBox(membersBoxName);
    activitiesBox = await Hive.openBox(activitiesBoxName);
    noticesBox = await Hive.openBox(noticesBoxName);
    _initialized = true;
  }

  Future<String> _resolveStoragePath() async {
    try {
      final path =
          await _pathChannel.invokeMethod<String>('getStoragePath');
      if (path != null && path.isNotEmpty) return path;
    } on PlatformException catch (_) {
      // 原生通道不可用，回退临时目录
    } on MissingPluginException catch (_) {
      // 测试环境无原生实现，回退临时目录
    }
    final dir = await Directory.systemTemp.createTemp('smart_society');
    return dir.path;
  }
}
