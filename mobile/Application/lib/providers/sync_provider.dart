import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../services/cloud_function_service.dart';
import '../services/storage_service.dart';

/// 同步操作类型
enum SyncOp { upsert, delete }

/// 待同步的操作记录
class SyncEntry {
  final String id;
  final String type; // 'member' / 'project' / 'notice'
  final SyncOp op;
  final Map<String, dynamic> data; // 完整数据（用于 upsert）
  final DateTime createdAt;

  const SyncEntry({
    required this.id,
    required this.type,
    required this.op,
    required this.data,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'op': op.name,
        'data': data,
        'createdAt': createdAt.millisecondsSinceEpoch,
      };

  factory SyncEntry.fromJson(Map<String, dynamic> json) => SyncEntry(
        id: json['id'] as String,
        type: json['type'] as String,
        op: SyncOp.values.byName(json['op'] as String),
        data: Map<String, dynamic>.from(json['data'] as Map),
        createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt'] as int),
      );
}

/// 自动同步管理：本地操作立即更新 Hive，后台队列自动推送到云端，
/// 启动/切换组织时自动拉取云端最新数据并落库刷新。
class SyncProvider extends ChangeNotifier {
  static const _boxName = 'sync_queue';

  /// 合法队列类型白名单（云函数 upsert-{type}/delete-{type} 必须存在）
  static const _allowedTypes = {'member', 'project', 'notice'};

  SyncProvider._();
  static final SyncProvider instance = SyncProvider._();

  final CloudFunctionService _cloud = CloudFunctionService.instance;

  List<SyncEntry> _queue = [];
  Timer? _timer;
  bool _syncing = false;
  bool _initialized = false;

  final List<VoidCallback> _refreshListeners = [];

  List<SyncEntry> get queue => _queue;
  int get pendingCount => _queue.length;
  bool get isSyncing => _syncing;

  Future<void> init() async {
    if (_initialized) return;
    final box = await Hive.openBox(_boxName);
    final raw = box.get('queue');
    if (raw != null) {
      final rawList = raw as List;
      _queue = rawList
          .map((e) => SyncEntry.fromJson(Map<String, dynamic>.from(e as Map)))
          // 清理遗留/未知类型（如已下线云函数的 activity），避免死循环重试
          .where((e) => _allowedTypes.contains(e.type))
          .toList();
      if (_queue.length != rawList.length) {
        await box.put('queue', _queue.map((e) => e.toJson()).toList());
      }
    }
    _initialized = true;
    notifyListeners();
    // 启动后台定时同步（30秒）
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => flush());
    // 首次启动时尝试同步
    flush();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// 数据拉取落库后，刷新本地数据（各业务 Provider 通过 load() 重读 Hive）。
  void registerRefreshListener(VoidCallback listener) {
    if (!_refreshListeners.contains(listener)) {
      _refreshListeners.add(listener);
    }
  }

  /// 将操作加入同步队列
  Future<void> enqueue(String type, String id, SyncOp op, Map<String, dynamic> data) async {
    _queue.removeWhere((e) => e.id == id && e.type == type);
    _queue.add(SyncEntry(
      id: id,
      type: type,
      op: op,
      data: data,
      createdAt: DateTime.now(),
    ));
    await _persist();
    notifyListeners();
    // 立即尝试推送
    flush();
  }

  /// 推送待同步项；orgId 非空时同步拉取云端最新数据
  Future<void> flush({String? orgId}) async {
    if (_syncing) return;
    _syncing = true;
    notifyListeners();
    try {
      await _processQueue();
      // 队列清空后才拉取，避免云端旧数据覆盖本地未推送的新操作
      if (_queue.isEmpty && orgId != null && orgId.isNotEmpty) {
        await _pullLatest(orgId);
      }
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }

  /// 推送全部待同步项并拉取指定组织数据落库（启动/切换组织时调用）
  Future<void> pullAndRefresh(String orgId) async {
    if (_syncing) return;
    _syncing = true;
    notifyListeners();
    try {
      await _processQueue();
      if (_queue.isEmpty) {
        await _pullLatest(orgId);
      }
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }

  Future<void> _processQueue() async {
    if (_queue.isEmpty) return;
    final batch = [..._queue];
    for (final entry in batch) {
      try {
        final fnName = '${entry.op.name}-${entry.type}';
        await _cloud.callWithRetry(fnName, params: entry.data);
        _queue.remove(entry);
      } catch (e) {
        debugPrint('SYNC_FAIL: $e');
        // 保留在队列，下次重试
      }
    }
    await _persist();
  }

  /// 拉取云端数据并覆盖本地对应组织的缓存，随后通知各 Provider 刷新。
  Future<void> _pullLatest(String orgId) async {
    try {
      final data = await _cloud
          .callWithRetry('get-all-data', params: {'orgId': orgId});
      if (data is! Map<String, dynamic>) return;

      final storage = StorageService.instance;
      final boxes = [storage.membersBox, storage.projectsBox, storage.noticesBox];

      // 先移除本地该组织的旧记录，再写入云端最新数据（多组织混存按 orgId 隔离）
      for (final box in boxes) {
        for (final key in box.keys.toList()) {
          final v = box.get(key);
          if (v is Map && v['orgId'] == orgId) {
            await box.delete(key);
          }
        }
      }
      final members = data['Member'];
      final projects = data['Project'];
      final notices = data['Notice'];
      if (members is List) {
        for (final m in members) {
          final map = Map<String, dynamic>.from(m as Map);
          await storage.membersBox.put(map['id'] as String, map);
        }
      }
      if (projects is List) {
        for (final p in projects) {
          final map = Map<String, dynamic>.from(p as Map);
          await storage.projectsBox.put(map['id'] as String, map);
        }
      }
      if (notices is List) {
        for (final n in notices) {
          final map = Map<String, dynamic>.from(n as Map);
          await storage.noticesBox.put(map['id'] as String, map);
        }
      }
      for (final cb in _refreshListeners) {
        cb();
      }
    } catch (e) {
      debugPrint('PULL_FAIL: $e');
    }
  }

  Future<void> _persist() async {
    final box = await Hive.openBox(_boxName);
    await box.put('queue', _queue.map((e) => e.toJson()).toList());
  }

  /// 移除指定组织的全部待同步项（组织注销后云端已无对应数据，避免死循环重试）
  Future<void> removeQueueForOrg(String orgId) async {
    final before = _queue.length;
    _queue.removeWhere((e) => e.data['orgId'] == orgId);
    if (_queue.length != before) {
      await _persist();
      notifyListeners();
    }
  }

  /// 清空全部待同步项（用户注销时）
  Future<void> clearAll() async {
    if (_queue.isEmpty) return;
    _queue.clear();
    await _persist();
    notifyListeners();
  }
}
