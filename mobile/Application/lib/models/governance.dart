import 'dart:convert';

/// 自动任务（WF-03）：系统根据规则自动生成，与人工任务统一管理。
class AutoTask {
  const AutoTask({
    required this.id,
    required this.orgId,
    this.title = '',
    this.description = '',
    this.sourceType = 'auto',
    this.sourceRuleId = '',
    this.sourceRuleName = '',
    this.sourceEntityType = '',
    this.sourceEntityId = '',
    this.sourceEntityName = '',
    this.correlationId = '',
    this.triggerEventId = '',
    this.assigneeId = '',
    this.assigneeName = '',
    this.priority = 'medium',
    this.status = 'open',
    this.slaDeadline,
    this.escalationLevel = 0,
    this.escalatedAt,
    this.completedAt,
    this.completedBy = '',
    this.completedByName = '',
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orgId;
  final String title;
  final String description;
  final String sourceType;
  final String sourceRuleId;
  final String sourceRuleName;
  final String sourceEntityType;
  final String sourceEntityId;
  final String sourceEntityName;
  final String correlationId;
  final String triggerEventId;
  final String assigneeId;
  final String assigneeName;
  final String priority;
  final String status;
  final DateTime? slaDeadline;
  final int escalationLevel;
  final DateTime? escalatedAt;
  final DateTime? completedAt;
  final String completedBy;
  final String completedByName;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isOpen => status == 'open';
  bool get isDone => status == 'done';
  bool get isOverdue => status == 'open' && slaDeadline != null && slaDeadline!.isBefore(DateTime.now());

  factory AutoTask.fromJson(Map<String, dynamic> json) => AutoTask(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        title: (json['title'] as String?) ?? '',
        description: (json['description'] as String?) ?? '',
        sourceType: (json['sourceType'] as String?) ?? 'auto',
        sourceRuleId: (json['sourceRuleId'] as String?) ?? '',
        sourceRuleName: (json['sourceRuleName'] as String?) ?? '',
        sourceEntityType: (json['sourceEntityType'] as String?) ?? '',
        sourceEntityId: (json['sourceEntityId'] as String?) ?? '',
        sourceEntityName: (json['sourceEntityName'] as String?) ?? '',
        correlationId: (json['correlationId'] as String?) ?? '',
        triggerEventId: (json['triggerEventId'] as String?) ?? '',
        assigneeId: (json['assigneeId'] as String?) ?? '',
        assigneeName: (json['assigneeName'] as String?) ?? '',
        priority: (json['priority'] as String?) ?? 'medium',
        status: (json['status'] as String?) ?? 'open',
        slaDeadline: _toDate(json['slaDeadline']),
        escalationLevel: (json['escalationLevel'] as num?)?.toInt() ?? 0,
        escalatedAt: _toDate(json['escalatedAt']),
        completedAt: _toDate(json['completedAt']),
        completedBy: (json['completedBy'] as String?) ?? '',
        completedByName: (json['completedByName'] as String?) ?? '',
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: _toDate(json['updatedAt']),
      );
}

/// 风险/预警（SA-02/03）：kind=risk 风险 / warning 预警。
class RiskAlert {
  const RiskAlert({
    required this.id,
    required this.orgId,
    this.kind = 'warning',
    this.title = '',
    this.description = '',
    this.sourceRuleId = '',
    this.sourceRuleName = '',
    this.sourceEntityType = '',
    this.sourceEntityId = '',
    this.sourceEntityName = '',
    this.triggerEventId = '',
    this.severity = 'medium',
    this.status = 'open',
    this.ownerId = '',
    this.ownerName = '',
    this.deadline,
    this.resolvedAt,
    this.resolvedBy = '',
    this.resolvedByName = '',
    this.metadata = const {},
    this.correlationId = '',
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orgId;
  final String kind;
  final String title;
  final String description;
  final String sourceRuleId;
  final String sourceRuleName;
  final String sourceEntityType;
  final String sourceEntityId;
  final String sourceEntityName;
  final String triggerEventId;
  final String severity;
  final String status;
  final String ownerId;
  final String ownerName;
  final DateTime? deadline;
  final DateTime? resolvedAt;
  final String resolvedBy;
  final String resolvedByName;
  final Map<String, dynamic> metadata;
  final String correlationId;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isRisk => kind == 'risk';
  bool get isWarning => kind == 'warning';
  bool get isOpen => status == 'open';
  bool get isMonitoring => status == 'monitoring';
  bool get isResolved => status == 'resolved';

  factory RiskAlert.fromJson(Map<String, dynamic> json) => RiskAlert(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        kind: (json['kind'] as String?) ?? 'warning',
        title: (json['title'] as String?) ?? '',
        description: (json['description'] as String?) ?? '',
        sourceRuleId: (json['sourceRuleId'] as String?) ?? '',
        sourceRuleName: (json['sourceRuleName'] as String?) ?? '',
        sourceEntityType: (json['sourceEntityType'] as String?) ?? '',
        sourceEntityId: (json['sourceEntityId'] as String?) ?? '',
        sourceEntityName: (json['sourceEntityName'] as String?) ?? '',
        triggerEventId: (json['triggerEventId'] as String?) ?? '',
        severity: (json['severity'] as String?) ?? 'medium',
        status: (json['status'] as String?) ?? 'open',
        ownerId: (json['ownerId'] as String?) ?? '',
        ownerName: (json['ownerName'] as String?) ?? '',
        deadline: _toDate(json['deadline']),
        resolvedAt: _toDate(json['resolvedAt']),
        resolvedBy: (json['resolvedBy'] as String?) ?? '',
        resolvedByName: (json['resolvedByName'] as String?) ?? '',
        metadata: _parseMap(json['metadata']),
        correlationId: (json['correlationId'] as String?) ?? '',
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: _toDate(json['updatedAt']),
      );
}

/// 自动化运行记录（SEC-01）
class AutomationRunLog {
  const AutomationRunLog({
    required this.id,
    required this.orgId,
    this.ruleId = '',
    this.ruleName = '',
    this.triggerEventType = '',
    this.status = 'success',
    this.actions = const {},
    this.runBy = 'system',
    this.runAt,
    this.durationMs = 0,
    this.errorMessage = '',
  });

  final String id;
  final String orgId;
  final String ruleId;
  final String ruleName;
  final String triggerEventType;
  final String status;
  final Map<String, dynamic> actions;
  final String runBy;
  final DateTime? runAt;
  final int durationMs;
  final String errorMessage;

  factory AutomationRunLog.fromJson(Map<String, dynamic> json) =>
      AutomationRunLog(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        ruleId: (json['ruleId'] as String?) ?? '',
        ruleName: (json['ruleName'] as String?) ?? '',
        triggerEventType: (json['triggerEventType'] as String?) ?? '',
        status: (json['status'] as String?) ?? 'success',
        actions: _parseMap(json['actions']),
        runBy: (json['runBy'] as String?) ?? 'system',
        runAt: _toDate(json['runAt']),
        durationMs: (json['durationMs'] as num?)?.toInt() ?? 0,
        errorMessage: (json['errorMessage'] as String?) ?? '',
      );
}

Map<String, dynamic> _parseMap(dynamic v) {
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

String autoTaskPriorityLabel(String priority) {
  switch (priority) {
    case 'high':
      return '高优先级';
    case 'low':
      return '低优先级';
    default:
      return '中优先级';
  }
}

String autoTaskStatusLabel(String status) {
  switch (status) {
    case 'done':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return '待处理';
  }
}

String riskSeverityLabel(String severity) {
  switch (severity) {
    case 'high':
      return '严重';
    case 'low':
      return '一般';
    default:
      return '中等';
  }
}
