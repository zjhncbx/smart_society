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
  static const String projectsBoxName = 'projects';
  static const String noticesBoxName = 'notices';

  late final Box<dynamic> membersBox;
  late final Box<dynamic> projectsBox;
  late final Box<dynamic> noticesBox;

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    final path = await _resolveStoragePath();
    Hive.init(path);
    // 旧版活动数据已被项目管理取代，直接弃用旧 box
    if (await Hive.boxExists('activities')) {
      await Hive.deleteBoxFromDisk('activities');
    }
    membersBox = await Hive.openBox(membersBoxName);
    projectsBox = await Hive.openBox(projectsBoxName);
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

  /// 移除某组织的全部本地数据（多组织混存，只能按 orgId 扫描删除，不能清空 box）
  Future<void> removeOrgData(String orgId) async {
    for (final box in [membersBox, projectsBox, noticesBox]) {
      for (final key in box.keys.toList()) {
        final v = box.get(key);
        if (v is Map && v['orgId'] == orgId) {
          await box.delete(key);
        }
      }
    }
  }

  /// 清空全部业务数据（用户注销时调用；auth/organizations/settings/sync_queue 由对应 Provider 清理）
  Future<void> clearAllData() async {
    await membersBox.clear();
    await projectsBox.clear();
    await noticesBox.clear();
  }
}
