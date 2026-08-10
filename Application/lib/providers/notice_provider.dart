import 'package:flutter/foundation.dart';

import '../models/notice.dart';
import '../services/storage_service.dart';

/// 通知公告状态：列表、发布、已读标记。
class NoticeProvider extends ChangeNotifier {
  final StorageService _storage = StorageService.instance;

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
    _notices = box.values
        .map((e) => Notice.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    notifyListeners();
  }

  Future<void> publish(Notice notice) async {
    _notices.add(notice);
    await _storage.noticesBox.put(notice.id, notice.toJson());
    notifyListeners();
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
    );
    _notices[index] = updated;
    await _storage.noticesBox.put(updated.id, updated.toJson());
    notifyListeners();
  }

  Future<void> delete(String id) async {
    _notices.removeWhere((n) => n.id == id);
    await _storage.noticesBox.delete(id);
    notifyListeners();
  }

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
