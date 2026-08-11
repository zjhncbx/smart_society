import 'dart:convert';

const String kInstanceRunning = 'running';
const String kInstanceApproved = 'approved';
const String kInstanceRejected = 'rejected';

class ApprovalHistoryEntry {
  ApprovalHistoryEntry({
    this.nodeId = '',
    this.nodeName = '',
    this.nodeType = '',
    this.actorId = '',
    this.actorName = '',
    this.action = '',
    this.comment = '',
    required this.time,
  });

  final String nodeId;
  final String nodeName;
  final String nodeType;
  final String actorId;
  final String actorName;
  final String action;
  final String comment;
  final DateTime time;

  factory ApprovalHistoryEntry.fromJson(Map<String, dynamic> json) =>
      ApprovalHistoryEntry(
        nodeId: (json['nodeId'] as String?) ?? '',
        nodeName: (json['nodeName'] as String?) ?? '',
        nodeType: (json['nodeType'] as String?) ?? '',
        actorId: (json['actorId'] as String?) ?? '',
        actorName: (json['actorName'] as String?) ?? '',
        action: (json['action'] as String?) ?? '',
        comment: (json['comment'] as String?) ?? '',
        time: _toDate(json['time']) ?? DateTime.now(),
      );
}

class ApprovalNodeSnapshot {
  const ApprovalNodeSnapshot({
    this.nodeId = '',
    this.nodeName = '',
    this.nodeType = '',
    this.actorMemberIds = const [],
    this.actorUserIds = const [],
  });

  final String nodeId;
  final String nodeName;
  final String nodeType;
  final List<String> actorMemberIds;
  final List<String> actorUserIds;

  bool get isEmpty => nodeId.isEmpty;

  factory ApprovalNodeSnapshot.fromJson(Map<String, dynamic> json) =>
      ApprovalNodeSnapshot(
        nodeId: (json['nodeId'] as String?) ?? '',
        nodeName: (json['nodeName'] as String?) ?? '',
        nodeType: (json['nodeType'] as String?) ?? '',
        actorMemberIds: (json['actorMemberIds'] as List?)?.cast<String>() ?? [],
        actorUserIds: (json['actorUserIds'] as List?)?.cast<String>() ?? [],
      );
}

class ApprovalInstance {
  ApprovalInstance({
    required this.id,
    required this.orgId,
    this.flowId = '',
    this.flowName = '',
    this.bizType = 'finance',
    this.bizId = '',
    this.title = '',
    required this.status,
    this.currentIndex = 0,
    this.nodeSnapshot = const ApprovalNodeSnapshot(),
    List<ApprovalHistoryEntry>? history,
    this.createdBy = '',
    this.createdByName = '',
    required this.createdAt,
    this.updatedAt,
  }) : history = history ?? [];

  final String id;
  final String orgId;
  final String flowId;
  final String flowName;
  final String bizType;
  final String bizId;
  final String title;
  final String status;
  final int currentIndex;
  final ApprovalNodeSnapshot nodeSnapshot;
  final List<ApprovalHistoryEntry> history;
  final String createdBy;
  final String createdByName;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isRunning => status == kInstanceRunning;
  bool get isApproved => status == kInstanceApproved;
  bool get isRejected => status == kInstanceRejected;

  factory ApprovalInstance.fromJson(Map<String, dynamic> json) {
    ApprovalNodeSnapshot snapshot = const ApprovalNodeSnapshot();
    try {
      final raw = json['nodeSnapshot'];
      if (raw is Map) {
        snapshot = ApprovalNodeSnapshot.fromJson(
            Map<String, dynamic>.from(raw));
      } else if (raw is String && raw.isNotEmpty && raw != '{}') {
        snapshot = ApprovalNodeSnapshot.fromJson(
            Map<String, dynamic>.from(jsonDecode(raw) as Map));
      }
    } catch (_) {}
    return ApprovalInstance(
      id: json['id'] as String,
      orgId: (json['orgId'] as String?) ?? '',
      flowId: (json['flowId'] as String?) ?? '',
      flowName: (json['flowName'] as String?) ?? '',
      bizType: (json['bizType'] as String?) ?? 'finance',
      bizId: (json['bizId'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      status: (json['status'] as String?) ?? kInstanceRunning,
      currentIndex: (json['currentIndex'] as num?)?.toInt() ?? 0,
      nodeSnapshot: snapshot,
      history: _parseHistory(json['history']),
      createdBy: (json['createdBy'] as String?) ?? '',
      createdByName: (json['createdByName'] as String?) ?? '',
      createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _toDate(json['updatedAt']),
    );
  }
}

List<ApprovalHistoryEntry> _parseHistory(dynamic v) {
  if (v == null) return [];
  if (v is List) {
    return v
        .map((e) =>
            ApprovalHistoryEntry.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
  if (v is String) {
    if (v.isEmpty) return [];
    try {
      final decoded = jsonDecode(v);
      if (decoded is List) {
        return decoded
            .map((e) =>
                ApprovalHistoryEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } catch (_) {}
  }
  return [];
}

DateTime? _toDate(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
  if (v is String) {
    final n = int.tryParse(v);
    if (n != null) return DateTime.fromMillisecondsSinceEpoch(n);
    return DateTime.tryParse(v);
  }
  return null;
}
