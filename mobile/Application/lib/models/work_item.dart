/// 统一工作项（P0-A）：审批/自动任务/项目任务/风险/数据治理统一抽象。
class WorkItem {
  const WorkItem({
    required this.id,
    required this.orgId,
    this.code = '',
    this.workItemType = '',
    this.originType = '',
    this.originId = '',
    this.originName = '',
    this.title = '',
    this.description = '',
    this.ownerId = '',
    this.ownerName = '',
    this.priority = 'medium',
    this.status = 'open',
    this.deadline,
    this.slaDeadline,
    this.escalationLevel = 0,
    this.completionCondition = '',
    this.sourceRuleId = '',
    this.sourceRuleName = '',
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orgId;
  final String code;
  final String workItemType;
  final String originType;
  final String originId;
  final String originName;
  final String title;
  final String description;
  final String ownerId;
  final String ownerName;
  final String priority;
  final String status;
  final DateTime? deadline;
  final DateTime? slaDeadline;
  final int escalationLevel;
  final String completionCondition;
  final String sourceRuleId;
  final String sourceRuleName;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isOpen => status == 'open';
  bool get isDone => status == 'done';
  bool get isOverdue =>
      isOpen && slaDeadline != null && slaDeadline!.isBefore(DateTime.now());

  factory WorkItem.fromJson(Map<String, dynamic> json) => WorkItem(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        code: (json['code'] as String?) ?? '',
        workItemType: (json['workItemType'] as String?) ?? '',
        originType: (json['originType'] as String?) ?? '',
        originId: (json['originId'] as String?) ?? '',
        originName: (json['originName'] as String?) ?? '',
        title: (json['title'] as String?) ?? '',
        description: (json['description'] as String?) ?? '',
        ownerId: (json['ownerId'] as String?) ?? '',
        ownerName: (json['ownerName'] as String?) ?? '',
        priority: (json['priority'] as String?) ?? 'medium',
        status: (json['status'] as String?) ?? 'open',
        deadline: _toDate(json['deadline']),
        slaDeadline: _toDate(json['slaDeadline']),
        escalationLevel: (json['escalationLevel'] as num?)?.toInt() ?? 0,
        completionCondition: (json['completionCondition'] as String?) ?? '',
        sourceRuleId: (json['sourceRuleId'] as String?) ?? '',
        sourceRuleName: (json['sourceRuleName'] as String?) ?? '',
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: _toDate(json['updatedAt']),
      );
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

const Map<String, String> kWorkItemTypeLabels = {
  'approval': '审批',
  'auto_task': '自动任务',
  'project_task': '项目任务',
  'risk': '风险整改',
  'data_quality': '数据治理',
  'compliance': '合规事项',
  'resolution': '决议执行',
};

String workItemTypeLabel(String type) => kWorkItemTypeLabels[type] ?? type;
