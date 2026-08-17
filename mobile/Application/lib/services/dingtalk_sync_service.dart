import '../providers/sync_provider.dart';
import 'dingtalk_api.dart';

/// 钉钉同步编排：调用云函数同步通讯录 → 拉取云端最新成员落库。
class DingTalkSyncService {
  static final DingTalkSyncService instance = DingTalkSyncService._();
  DingTalkSyncService._();

  final _api = DingTalkApi.instance;

  Future<DingTalkSyncResult> performSync({
    required String orgId,
    required String clientId,
    required String clientSecret,
    required String userId,
    required String roleId,
    required String roleLabel,
    List<int>? deptIds,
    List<int>? excludeDeptIds,
  }) async {
    final result = await _api.syncContacts(
      orgId: orgId,
      clientId: clientId,
      clientSecret: clientSecret,
      userId: userId,
      roleId: roleId,
      roleLabel: roleLabel,
      deptIds: deptIds,
      excludeDeptIds: excludeDeptIds,
    );
    // 同步成员已写入云端，拉取最新数据落库刷新界面
    await SyncProvider.instance.pullAndRefresh(orgId);
    return result;
  }
}
