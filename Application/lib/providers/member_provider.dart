import 'package:flutter/foundation.dart';

import '../models/member.dart';
import '../services/storage_service.dart';

class MemberProvider extends ChangeNotifier {
  final StorageService _storage = StorageService.instance;

  List<Member> _members = [];
  String? _roleFilterId;
  String _keyword = '';

  List<Member> get members => _members;
  String? get roleFilterId => _roleFilterId;

  List<Member> get filteredMembers {
    var list = _members.where((m) {
      if (_roleFilterId != null && m.roleId != _roleFilterId) return false;
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

  void setRoleFilter(String? roleId) {
    _roleFilterId = roleId;
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

  static String nextId(List<Member> members) {
    var max = 0;
    for (final m in members) {
      final n = int.tryParse(m.id.replaceFirst('m', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'm${(max + 1).toString().padLeft(3, '0')}';
  }
}
