import 'package:flutter/foundation.dart';

import '../models/member.dart';
import '../services/storage_service.dart';

/// 成员管理状态：列表加载、角色筛选、增删改。
class MemberProvider extends ChangeNotifier {
  final StorageService _storage = StorageService.instance;

  List<Member> _members = [];
  MemberRole? _roleFilter;
  String _keyword = '';

  List<Member> get members => _members;

  /// 当前筛选（null 表示全部）
  MemberRole? get roleFilter => _roleFilter;

  /// 筛选后的成员列表
  List<Member> get filteredMembers {
    var list = _members.where((m) {
      if (_roleFilter != null && m.role != _roleFilter) return false;
      if (_keyword.isNotEmpty) {
        final kw = _keyword.toLowerCase();
        if (!m.name.toLowerCase().contains(kw) &&
            !m.studentNo.toLowerCase().contains(kw) &&
            !m.department.toLowerCase().contains(kw)) {
          return false;
        }
      }
      return true;
    }).toList();
    list.sort((a, b) => a.joinedAt.compareTo(b.joinedAt));
    return list;
  }

  int get totalCount => _members.length;

  Future<void> load() async {
    final box = _storage.membersBox;
    _members = box.values
        .map((e) => Member.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    notifyListeners();
  }

  Member? findById(String id) {
    for (final m in _members) {
      if (m.id == id) return m;
    }
    return null;
  }

  void setRoleFilter(MemberRole? role) {
    _roleFilter = role;
    notifyListeners();
  }

  void setKeyword(String keyword) {
    _keyword = keyword.trim();
    notifyListeners();
  }

  Future<void> saveMember(Member member) async {
    final index = _members.indexWhere((m) => m.id == member.id);
    if (index >= 0) {
      _members[index] = member;
    } else {
      _members.add(member);
    }
    await _storage.membersBox.put(member.id, member.toJson());
    notifyListeners();
  }

  Future<void> deleteMember(String id) async {
    _members.removeWhere((m) => m.id == id);
    await _storage.membersBox.delete(id);
    notifyListeners();
  }

  /// 生成不重复的成员 id
  static String nextId(List<Member> members) {
    var max = 0;
    for (final m in members) {
      final n = int.tryParse(m.id.replaceFirst('m', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'm${(max + 1).toString().padLeft(3, '0')}';
  }
}
