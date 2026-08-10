import 'cloud_function_service.dart';

/// 钉钉服务端接口封装（凭证由客户端传入，云函数代调钉钉 API）。
class DingTalkApi {
  static final DingTalkApi instance = DingTalkApi._();
  DingTalkApi._();

  /// 单向同步钉钉通讯录到本应用成员（云函数批量 upsert 到 CloudDB）。
  Future<DingTalkSyncResult> syncContacts({
    required String orgId,
    required String clientId,
    required String clientSecret,
    required String roleId,
    required String roleLabel,
  }) async {
    final data = await CloudFunctionService.instance.callWithRetry(
      'dingtalk-sync-contacts',
      params: {
        'orgId': orgId,
        'clientId': clientId,
        'clientSecret': clientSecret,
        'roleId': roleId,
        'roleLabel': roleLabel,
      },
      timeout: const Duration(seconds: 55),
      maxRetries: 1,
    );
    final map = (data as Map?) ?? const {};
    return DingTalkSyncResult(
      contactsAdded: (map['added'] as int?) ?? 0,
      contactsUpdated: (map['updated'] as int?) ?? 0,
      contactsRemoved: (map['removed'] as int?) ?? 0,
      syncedAt: DateTime.tryParse((map['syncedAt'] as String?) ?? '') ??
          DateTime.now(),
    );
  }

  Future<String> createGroup({
    required String name,
    required List<String> userIds,
  }) async {
    throw UnimplementedError('DingTalk group creation not yet implemented');
  }

  Future<void> sendGroupMessage({
    required String groupId,
    required String content,
  }) async {
    throw UnimplementedError('DingTalk messaging not yet implemented');
  }

  Future<String> createApproval({
    required String title,
    required String formContent,
    required List<String> approverIds,
  }) async {
    throw UnimplementedError('DingTalk approval not yet implemented');
  }
}

class DingTalkSyncResult {
  final int contactsAdded;
  final int contactsUpdated;
  final int contactsRemoved;
  final DateTime syncedAt;

  const DingTalkSyncResult({
    required this.contactsAdded,
    required this.contactsUpdated,
    required this.contactsRemoved,
    required this.syncedAt,
  });
}
