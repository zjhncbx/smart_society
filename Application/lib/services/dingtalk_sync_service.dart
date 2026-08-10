import '../models/member.dart';
import 'dingtalk_api.dart';
import 'storage_service.dart';

class DingTalkSyncService {
  static final DingTalkSyncService instance = DingTalkSyncService._();
  DingTalkSyncService._();

  final _storage = StorageService.instance;
  final _api = DingTalkApi.instance;

  Future<DingTalkSyncResult> performSync(String orgType) async {
    final result = await _api.syncContacts(orgType: orgType);
    return result;
  }

  Future<void> markMemberSynced(String memberId, String dingTalkUserId) async {
    final member = _storage.membersBox.get(memberId);
    if (member != null) {
      final m = Member.fromJson(Map<String, dynamic>.from(member as Map));
      final updated = Member(
        id: m.id,
        name: m.name,
        studentNo: m.studentNo,
        department: m.department,
        roleId: m.roleId,
        roleLabel: m.roleLabel,
        phone: m.phone,
        email: m.email,
        joinedAt: m.joinedAt,
        dingTalkUserId: dingTalkUserId,
        syncStatus: 'synced',
        lastSyncedAt: DateTime.now(),
      );
      await _storage.membersBox.put(memberId, updated.toJson());
    }
  }

  Future<int> getSyncedMemberCount() async {
    return _storage.membersBox.values
        .where((v) {
          final m =
              Member.fromJson(Map<String, dynamic>.from(v as Map));
          return m.syncStatus == 'synced';
        })
        .length;
  }
}
