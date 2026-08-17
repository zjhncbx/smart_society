import 'dart:convert';

/// 流程节点类型
const String kNodeApprove = 'approve';
const String kNodeHandle = 'handle';
const String kNodeCc = 'cc';

class FlowNode {
  FlowNode({
    required this.id,
    required this.type,
    required this.name,
    List<String>? roleIds,
    List<String>? userIds,
  })  : roleIds = roleIds ?? [],
        userIds = userIds ?? [];

  final String id;
  String type;
  String name;
  List<String> roleIds;
  List<String> userIds;

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'name': name,
        'roleIds': roleIds,
        'userIds': userIds,
      };

  factory FlowNode.fromJson(Map<String, dynamic> json) => FlowNode(
        id: (json['id'] as String?) ?? '',
        type: (json['type'] as String?) ?? kNodeApprove,
        name: (json['name'] as String?) ?? '',
        roleIds: (json['roleIds'] as List?)?.cast<String>() ?? [],
        userIds: (json['userIds'] as List?)?.cast<String>() ?? [],
      );
}

class ApprovalFlow {
  ApprovalFlow({
    required this.id,
    required this.orgId,
    required this.name,
    this.bizType = 'finance',
    List<FlowNode>? nodes,
    this.enabled = true,
    this.isDefault = false,
    required this.createdAt,
    this.code = '',
    this.status = 'active',
    this.createdBy = '',
    this.updatedBy = '',
    this.version = 1,
    this.sourceType = 'manual',
    this.sourceId = '',
    this.updatedAt,
  }) : nodes = nodes ?? [];

  final String id;
  final String orgId;
  String name;
  final String bizType;
  List<FlowNode> nodes;
  bool enabled;
  bool isDefault;
  final DateTime createdAt;
  final String code;
  final String status;
  final String createdBy;
  final String updatedBy;
  final int version;
  final String sourceType;
  final String sourceId;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'orgId': orgId,
        'name': name,
        'bizType': bizType,
        'nodes': jsonEncode(nodes.map((n) => n.toJson()).toList()),
        'enabled': enabled,
        'isDefault': isDefault,
        'createdAt': createdAt.millisecondsSinceEpoch,
        'code': code,
        'status': status,
        'createdBy': createdBy,
        'updatedBy': updatedBy,
        'version': version,
        'sourceType': sourceType,
        'sourceId': sourceId,
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory ApprovalFlow.fromJson(Map<String, dynamic> json) => ApprovalFlow(
        id: json['id'] as String,
        orgId: (json['orgId'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        bizType: (json['bizType'] as String?) ?? 'finance',
        nodes: _parseNodes(json['nodes']),
        enabled: (json['enabled'] as bool?) ?? true,
        isDefault: (json['isDefault'] as bool?) ?? false,
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        code: (json['code'] as String?) ?? '',
        status: (json['status'] as String?) ?? 'active',
        createdBy: (json['createdBy'] as String?) ?? '',
        updatedBy: (json['updatedBy'] as String?) ?? '',
        version: (json['version'] as num?)?.toInt() ?? 1,
        sourceType: (json['sourceType'] as String?) ?? 'manual',
        sourceId: (json['sourceId'] as String?) ?? '',
        updatedAt: _toDate(json['updatedAt']),
      );
}

List<FlowNode> _parseNodes(dynamic v) {
  if (v == null) return [];
  if (v is List) {
    return v
        .map((e) => FlowNode.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
  if (v is String) {
    if (v.isEmpty) return [];
    try {
      final decoded = jsonDecode(v);
      if (decoded is List) {
        return decoded
            .map((e) => FlowNode.fromJson(Map<String, dynamic>.from(e as Map)))
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
