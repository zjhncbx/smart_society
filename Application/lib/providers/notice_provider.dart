import 'package:flutter/foundation.dart';

import '../models/notice.dart';
import '../services/storage_service.dart';
import 'sync_provider.dart';

/// 通知公告状态：列表、发布、已读标记。
class NoticeProvider extends ChangeNotifier {
  NoticeProvider({String Function()? orgIdGetter}) : _orgIdGetter = orgIdGetter;

  final StorageService _storage = StorageService.instance;
  final String Function()? _orgIdGetter;

  List<Notice> _notices = [];

  List<Notice> get notices => _notices;

  /// 按发布时间倒序
  List<Notice> get sortedNotices {
    final list = [..._notices];
    list.sort((a, b) => b.publishTime.compareTo(a.publishTime));
    return list;
  }

  int get unreadCount => _notices.where((n) => !n.isRead).length;

  Notice? findById(String id) {
    for (final n in _notices) {
      if (n.id == id) return n;
    }
    return null;
  }

  Future<void> load() async {
    final box = _storage.noticesBox;
    final currentOrgId = _orgIdGetter?.call() ?? '';
    _notices = box.values
        .map((e) => Notice.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((n) => currentOrgId.isEmpty || n.orgId == currentOrgId)
        .toList();
    notifyListeners();
  }

  Future<void> publish(Notice notice) async {
    if (notice.orgId.isEmpty) {
      notice.orgId = _orgIdGetter?.call() ?? '';
    }
    _notices.add(notice);
    await _storage.noticesBox.put(notice.id, notice.toJson());
    notifyListeners();
    SyncProvider.instance.enqueue('notice', notice.id, SyncOp.upsert, notice.toJson());
  }

  Future<void> markRead(String id) async {
    final index = _notices.indexWhere((n) => n.id == id);
    if (index < 0) return;
    final notice = _notices[index];
    if (notice.isRead) return;

    final updated = Notice(
      id: notice.id,
      title: notice.title,
      content: notice.content,
      publisher: notice.publisher,
      publishTime: notice.publishTime,
      isRead: true,
      isImportant: notice.isImportant,
      orgId: notice.orgId,
      updatedAt: notice.updatedAt,
    );
    _notices[index] = updated;
    await _storage.noticesBox.put(updated.id, updated.toJson());
    notifyListeners();
  }

  Future<void> delete(String id) async {
    _notices.removeWhere((n) => n.id == id);
    await _storage.noticesBox.delete(id);
    notifyListeners();
    SyncProvider.instance.enqueue('notice', id, SyncOp.delete, {'id': id, 'orgId': _orgId()});
  }

  String _orgId() => _notices.isNotEmpty ? _notices.first.orgId : '';

  /// 生成不重复的通知 id
  static String nextId(List<Notice> notices) {
    var max = 0;
    for (final n in notices) {
      final v = int.tryParse(n.id.replaceFirst('n', '')) ?? 0;
      if (v > max) max = v;
    }
    return 'n${(max + 1).toString().padLeft(3, '0')}';
  }
}
