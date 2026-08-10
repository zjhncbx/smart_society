import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../services/cloud_function_service.dart';

/// 同步操作类型
enum SyncOp { upsert, delete }

/// 待同步的操作记录
class SyncEntry {
  final String id;
  final String type; // 'member' / 'activity' / 'notice'
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

/// 自动同步管理：本地操作立即更新 Hive，后台队列推送到云端。
class SyncProvider extends ChangeNotifier {
  static const _boxName = 'sync_queue';
  static const _lastPullKey = 'lastPull';

  SyncProvider._();
  static final SyncProvider instance = SyncProvider._();

  final CloudFunctionService _cloud = CloudFunctionService.instance;

  List<SyncEntry> _queue = [];
  Timer? _timer;
  bool _syncing = false;
  bool _initialized = false;

  List<SyncEntry> get queue => _queue;
  int get pendingCount => _queue.length;
  bool get isSyncing => _syncing;

  Future<void> init() async {
    if (_initialized) return;
    final box = await Hive.openBox(_boxName);
    final raw = box.get('queue');
    if (raw != null) {
      _queue = (raw as List)
          .map((e) => SyncEntry.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    _initialized = true;
    notifyListeners();
    // 启动后台定时同步（30秒）
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => flush());
    // 首次启动时尝试同步
    flush();
  }

  void dispose() {
    _timer?.cancel();
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

  /// 强制推送所有待同步项 + 拉取最新数据
  Future<void> flush({String? orgId}) async {
    if (_syncing) return;
    _syncing = true;
    notifyListeners();
    try {
      // 先推送队列
      await _processQueue();
      // 再拉取云端最新
      if (orgId != null && orgId.isNotEmpty) {
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

  Future<Map<String, dynamic>?> _pullLatest(String orgId) async {
    try {
      final data = await _cloud.callWithRetry('get-all-data', params: {'orgId': orgId});
      final box = await Hive.openBox(_boxName);
      await box.put(_lastPullKey, DateTime.now().millisecondsSinceEpoch);
      return data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('PULL_FAIL: $e');
      return null;
    }
  }

  Future<void> _persist() async {
    final box = await Hive.openBox(_boxName);
    await box.put('queue', _queue.map((e) => e.toJson()).toList());
  }
}
