import 'dart:convert';

/// 统一业务事件（WF-01 事件中心）。
///
/// 覆盖创建/提交/审批/驳回/通过/变更/完成/逾期/撤回/归档/删除/状态变化等标准事件，
/// 是“实体 + 事件 + 条件 + 动作”自动化模型的输入源头。
class BusinessEvent {
  const BusinessEvent({
    required this.id,
    required this.orgId,
    required this.eventType,
    required this.entityType,
    this.entityId = '',
    this.entityName = '',
    this.actorId = '',
    this.actorName = '',
    this.level = 'info',
    this.metadata = const {},
    this.sourceType = 'manual',
    this.sourceId = '',
    required this.occurredAt,
    this.createdAt,
  });

  final String id;
  final String orgId;
  final String eventType;
  final String entityType;
  final String entityId;
  final String entityName;
  final String actorId;
  final String actorName;
  final String level;
  final Map<String, dynamic> metadata;
  final String sourceType;
  final String sourceId;
  final DateTime occurredAt;
  final DateTime? createdAt;

  bool get isSystem => sourceType == 'system';

  factory BusinessEvent.fromJson(Map<String, dynamic> json) => BusinessEvent(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        eventType: (json['eventType'] as String?) ?? 'updated',
        entityType: (json['entityType'] as String?) ?? '',
        entityId: (json['entityId'] as String?) ?? '',
        entityName: (json['entityName'] as String?) ?? '',
        actorId: (json['actorId'] as String?) ?? '',
        actorName: (json['actorName'] as String?) ?? '',
        level: (json['level'] as String?) ?? 'info',
        metadata: _parseMetadata(json['metadata']),
        sourceType: (json['sourceType'] as String?) ?? 'manual',
        sourceId: (json['sourceId'] as String?) ?? '',
        occurredAt: _toDate(json['occurredAt']) ?? DateTime.now(),
        createdAt: _toDate(json['createdAt']),
      );
}

Map<String, dynamic> _parseMetadata(dynamic v) {
  if (v == null) return const {};
  if (v is Map) return Map<String, dynamic>.from(v);
  if (v is String) {
    if (v.isEmpty || v == '{}') return const {};
    try {
      final decoded = jsonDecode(v);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
  }
  return const {};
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

/// 事件类型展示文案
const Map<String, String> kEventTypeLabels = {
  'created': '创建',
  'submitted': '提交',
  'approved': '审批通过',
  'rejected': '已驳回',
  'completed': '完成',
  'updated': '更新',
  'overdue': '已逾期',
  'withdrawn': '已撤回',
  'archived': '已归档',
  'deleted': '已删除',
  'status_changed': '状态变更',
  'notified': '提醒',
  'resolved': '已解决',
};

/// 业务对象类型展示文案
const Map<String, String> kEntityTypeLabels = {
  'member': '成员',
  'project': '项目',
  'task': '任务',
  'notice': '通知',
  'finance': '财务',
  'approval': '审批',
  'organization': '组织',
  'license': '证照',
  'compliance': '合规',
};

String eventTypeLabel(String type) => kEventTypeLabels[type] ?? type;

String entityTypeLabel(String type) => kEntityTypeLabels[type] ?? type;

/// 事件级别文案
String eventLevelLabel(String level) {
  switch (level) {
    case 'risk':
      return '风险';
    case 'warning':
      return '预警';
    default:
      return '动态';
  }
}
