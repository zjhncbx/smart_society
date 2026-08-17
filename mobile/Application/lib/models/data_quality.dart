import 'dart:convert';

/// 数据质量问题（DQ-02）
class DataQualityIssue {
  const DataQualityIssue({
    required this.id,
    required this.orgId,
    required this.ruleId,
    this.ruleName = '',
    this.category = '',
    this.entityType = '',
    this.entityId = '',
    this.entityName = '',
    this.severity = 'medium',
    this.description = '',
    this.detail = const {},
    this.status = 'open',
    this.assignedTo = '',
    this.assignedToName = '',
    this.checkCount = 1,
    this.lastCheckedAt,
    this.resolvedAt,
    this.resolvedBy = '',
    this.resolvedByName = '',
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orgId;
  final String ruleId;
  final String ruleName;
  final String category;
  final String entityType;
  final String entityId;
  final String entityName;
  final String severity;
  final String description;
  final Map<String, dynamic> detail;
  final String status;
  final String assignedTo;
  final String assignedToName;
  final int checkCount;
  final DateTime? lastCheckedAt;
  final DateTime? resolvedAt;
  final String resolvedBy;
  final String resolvedByName;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isOpen => status == 'open';
  bool get isResolved => status == 'resolved';
  bool get isIgnored => status == 'ignored';

  factory DataQualityIssue.fromJson(Map<String, dynamic> json) =>
      DataQualityIssue(
        id: (json['id'] as String?) ?? '',
        orgId: (json['orgId'] as String?) ?? '',
        ruleId: (json['ruleId'] as String?) ?? '',
        ruleName: (json['ruleName'] as String?) ?? '',
        category: (json['category'] as String?) ?? '',
        entityType: (json['entityType'] as String?) ?? '',
        entityId: (json['entityId'] as String?) ?? '',
        entityName: (json['entityName'] as String?) ?? '',
        severity: (json['severity'] as String?) ?? 'medium',
        description: (json['description'] as String?) ?? '',
        detail: _parseDetail(json['detail']),
        status: (json['status'] as String?) ?? 'open',
        assignedTo: (json['assignedTo'] as String?) ?? '',
        assignedToName: (json['assignedToName'] as String?) ?? '',
        checkCount: (json['checkCount'] as num?)?.toInt() ?? 1,
        lastCheckedAt: _toDate(json['lastCheckedAt']),
        resolvedAt: _toDate(json['resolvedAt']),
        resolvedBy: (json['resolvedBy'] as String?) ?? '',
        resolvedByName: (json['resolvedByName'] as String?) ?? '',
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: _toDate(json['updatedAt']),
      );
}

/// 数据治理健康度快照
class DataQualitySnapshot {
  const DataQualitySnapshot({
    this.score = 100,
    this.dimensions = const {},
    this.counts = const {},
    this.checkedAt,
    this.ruleCount = 0,
    this.issueCount = 0,
  });

  final int score;
  final Map<String, int> dimensions;
  final Map<String, dynamic> counts;
  final DateTime? checkedAt;
  final int ruleCount;
  final int issueCount;

  int get openCount => (counts['open'] as num?)?.toInt() ?? issueCount;
  int get resolvedCount => (counts['resolved'] as num?)?.toInt() ?? 0;

  factory DataQualitySnapshot.fromJson(Map<String, dynamic> json) {
    final dims = _parseIntMap(json['dimensions']);
    final counts = _parseDetail(json['counts']);
    return DataQualitySnapshot(
      score: (json['score'] as num?)?.toInt() ?? 100,
      dimensions: dims,
      counts: counts,
      checkedAt: _toDate(json['checkedAt']),
      ruleCount: (json['ruleCount'] as num?)?.toInt() ?? 0,
      issueCount: (json['issueCount'] as num?)?.toInt() ?? 0,
    );
  }
}

Map<String, dynamic> _parseDetail(dynamic v) {
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

Map<String, int> _parseIntMap(dynamic v) {
  final raw = _parseDetail(v);
  return raw.map((k, value) => MapEntry(
        k,
        value is num ? value.toInt() : int.tryParse('$value') ?? 100,
      ));
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

/// 数据质量分类展示文案
const Map<String, String> kQualityCategoryLabels = {
  'member': '会员档案',
  'project': '项目数据',
  'finance': '财务关联',
  'org': '组织资料',
  'governance': '治理数据',
  'document': '文档档案',
};

String qualityCategoryLabel(String category) =>
    kQualityCategoryLabels[category] ?? category;

/// 严重程度文案
String qualitySeverityLabel(String severity) {
  switch (severity) {
    case 'high':
      return '严重';
    case 'low':
      return '一般';
    default:
      return '中等';
  }
}
