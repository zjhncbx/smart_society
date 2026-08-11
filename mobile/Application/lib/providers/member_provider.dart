import 'package:flutter/foundation.dart';

import '../models/member.dart';
import '../services/storage_service.dart';
import 'sync_provider.dart';

class MemberProvider extends ChangeNotifier {
  MemberProvider({String Function()? orgIdGetter, bool Function()? isDingTalkManaged})
      : _orgIdGetter = orgIdGetter,
        _isDingTalkManaged = isDingTalkManaged;

  final StorageService _storage = StorageService.instance;
  final String Function()? _orgIdGetter;
  final bool Function()? _isDingTalkManaged;

  /// 钉钉管理组织（已配置钉钉）禁止手动增删改成员
  bool get isDingTalkManaged => _isDingTalkManaged?.call() ?? false;

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
    final currentOrgId = _orgIdGetter?.call() ?? '';
    _members = box.values
        .map((e) => Member.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((m) => currentOrgId.isEmpty || m.orgId == currentOrgId)
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
    if (isDingTalkManaged) return;
    if (member.orgId.isEmpty) {
      member.orgId = _orgIdGetter?.call() ?? '';
    }
    final index = _members.indexWhere((m) => m.id == member.id);
    if (index >= 0) {
      _members[index] = member;
    } else {
      _members.add(member);
    }
    await _storage.membersBox.put(member.id, member.toJson());
    notifyListeners();
    SyncProvider.instance.enqueue('member', member.id, SyncOp.upsert, member.toJson());
  }

  /// 变更成员角色：钉钉同步组织同样允许（仅改角色，不涉及增删成员）。
  Future<void> changeRole(String id, String roleId, String roleLabel) async {
    final index = _members.indexWhere((m) => m.id == id);
    if (index < 0) return;
    final old = _members[index];
    final updated = Member(
      id: old.id,
      name: old.name,
      studentNo: old.studentNo,
      department: old.department,
      roleId: roleId,
      roleLabel: roleLabel,
      phone: old.phone,
      email: old.email,
      joinedAt: old.joinedAt,
      dingTalkUserId: old.dingTalkUserId,
      syncStatus: old.syncStatus,
      lastSyncedAt: old.lastSyncedAt,
      orgId: old.orgId,
      updatedAt: old.updatedAt,
    );
    _members[index] = updated;
    await _storage.membersBox.put(updated.id, updated.toJson());
    notifyListeners();
    SyncProvider.instance.enqueue(
      'member',
      updated.id,
      SyncOp.upsert,
      updated.toJson(),
    );
  }

  /// 变更成员归属部门：钉钉同步组织同样允许（仅改部门，不涉及增删成员）
  Future<void> changeDepartment(String id, String department) async {
    final index = _members.indexWhere((m) => m.id == id);
    if (index < 0) return;
    final old = _members[index];
    final updated = Member(
      id: old.id,
      name: old.name,
      studentNo: old.studentNo,
      department: department,
      roleId: old.roleId,
      roleLabel: old.roleLabel,
      phone: old.phone,
      email: old.email,
      joinedAt: old.joinedAt,
      dingTalkUserId: old.dingTalkUserId,
      syncStatus: old.syncStatus,
      lastSyncedAt: old.lastSyncedAt,
      orgId: old.orgId,
      updatedAt: old.updatedAt,
    );
    _members[index] = updated;
    await _storage.membersBox.put(updated.id, updated.toJson());
    notifyListeners();
    SyncProvider.instance.enqueue(
      'member',
      updated.id,
      SyncOp.upsert,
      updated.toJson(),
    );
  }

  Future<void> deleteMember(String id) async {
    if (isDingTalkManaged) return;
    _members.removeWhere((m) => m.id == id);
    await _storage.membersBox.delete(id);
    notifyListeners();
    SyncProvider.instance.enqueue('member', id, SyncOp.delete, {'id': id, 'orgId': _orgId()});
  }

  String _orgId() => _members.isNotEmpty ? _members.first.orgId : '';

  static String nextId(List<Member> members) {
    var max = 0;
    for (final m in members) {
      final n = int.tryParse(m.id.replaceFirst('m', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'm${(max + 1).toString().padLeft(3, '0')}';
  }
}
