class DingTalkApi {
  static final DingTalkApi instance = DingTalkApi._();
  DingTalkApi._();

  String corpId = '';
  String appKey = '';
  String appSecret = '';
  bool isConfigured = false;

  Future<DingTalkSyncResult> syncContacts({
    required String orgType,
    DateTime? since,
  }) async {
    throw UnimplementedError('DingTalk sync not yet implemented');
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

  Future<DingTalkSyncStatus> getSyncStatus() async {
    return DingTalkSyncStatus(
      isConfigured: isConfigured,
      lastSyncAt: null,
      syncedMemberCount: 0,
    );
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

class DingTalkSyncStatus {
  final bool isConfigured;
  final DateTime? lastSyncAt;
  final int syncedMemberCount;

  const DingTalkSyncStatus({
    required this.isConfigured,
    required this.lastSyncAt,
    required this.syncedMemberCount,
  });
}
