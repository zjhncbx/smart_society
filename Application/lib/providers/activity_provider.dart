import 'package:flutter/foundation.dart';

import '../models/society_activity.dart';
import '../services/storage_service.dart';
import 'sync_provider.dart';

/// 活动管理状态：列表、创建、报名/取消报名、删除。
class ActivityProvider extends ChangeNotifier {
  final StorageService _storage = StorageService.instance;

  List<SocietyActivity> _activities = [];

  List<SocietyActivity> get activities => _activities;

  /// 按开始时间倒序（最近的在前）
  List<SocietyActivity> get sortedActivities {
    final list = [..._activities];
    list.sort((a, b) => b.startTime.compareTo(a.startTime));
    return list;
  }

  Future<void> load() async {
    final box = _storage.activitiesBox;
    _activities = box.values
        .map((e) => SocietyActivity.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    notifyListeners();
  }

  SocietyActivity? findById(String id) {
    for (final a in _activities) {
      if (a.id == id) return a;
    }
    return null;
  }

  Future<void> saveActivity(SocietyActivity activity) async {
    final index = _activities.indexWhere((a) => a.id == activity.id);
    if (index >= 0) {
      _activities[index] = activity;
    } else {
      _activities.add(activity);
    }
    await _storage.activitiesBox.put(activity.id, activity.toJson());
    notifyListeners();
    SyncProvider.instance.enqueue('activity', activity.id, SyncOp.upsert, activity.toJson());
  }

  Future<void> deleteActivity(String id) async {
    _activities.removeWhere((a) => a.id == id);
    await _storage.activitiesBox.delete(id);
    notifyListeners();
    SyncProvider.instance.enqueue('activity', id, SyncOp.delete, {'id': id, 'orgId': _orgId()});
  }

  String _orgId() => _activities.isNotEmpty ? _activities.first.orgId : '';

  /// 报名活动；满员时返回 false。
  Future<bool> signUp(String activityId, String memberId) async {
    final index = _activities.indexWhere((a) => a.id == activityId);
    if (index < 0) return false;
    final activity = _activities[index];
    if (activity.isFull || activity.contains(memberId)) return false;

    final updated = SocietyActivity(
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: activity.startTime,
      endTime: activity.endTime,
      capacity: activity.capacity,
      organizer: activity.organizer,
      participants: [
        ...activity.participants,
        ActivityParticipant(memberId: memberId, joinedAt: DateTime.now()),
      ],
      volunteerHours: activity.volunteerHours,
      createdAt: activity.createdAt,
    );
    _activities[index] = updated;
    await _storage.activitiesBox.put(updated.id, updated.toJson());
    notifyListeners();
    return true;
  }

  Future<void> cancelSignUp(String activityId, String memberId) async {
    final index = _activities.indexWhere((a) => a.id == activityId);
    if (index < 0) return;
    final activity = _activities[index];

    final updated = SocietyActivity(
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: activity.startTime,
      endTime: activity.endTime,
      capacity: activity.capacity,
      organizer: activity.organizer,
      participants: activity.participants
          .where((p) => p.memberId != memberId)
          .toList(),
      volunteerHours: activity.volunteerHours,
      createdAt: activity.createdAt,
    );
    _activities[index] = updated;
    await _storage.activitiesBox.put(updated.id, updated.toJson());
    notifyListeners();
  }

  /// 生成不重复的活动 id
  static String nextId(List<SocietyActivity> activities) {
    var max = 0;
    for (final a in activities) {
      final n = int.tryParse(a.id.replaceFirst('a', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'a${(max + 1).toString().padLeft(3, '0')}';
  }
}
