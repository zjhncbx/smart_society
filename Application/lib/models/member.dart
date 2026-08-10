/// 社团成员
class Member {
  Member({
    required this.id,
    required this.name,
    required this.studentNo,
    required this.department,
    required this.roleId,
    required this.roleLabel,
    this.phone = '',
    this.email = '',
    required this.joinedAt,
    this.dingTalkUserId = '',
    this.syncStatus = 'manual',
    this.lastSyncedAt,
    this.orgId = '',
    this.updatedAt,
  });

  final String id;
  final String name;
  final String studentNo;
  final String department;
  String roleId;
  String roleLabel;
  String phone;
  String email;
  final DateTime joinedAt;
  final String dingTalkUserId;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  String orgId;
  final DateTime? updatedAt;

  int get avatarColorIndex => name.hashCode.abs() % 8;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'studentNo': studentNo,
        'department': department,
        'roleId': roleId,
        'roleLabel': roleLabel,
        'phone': phone,
        'email': email,
        'joinedAt': joinedAt.millisecondsSinceEpoch,
        'dingTalkUserId': dingTalkUserId,
        'syncStatus': syncStatus,
        if (lastSyncedAt != null) 'lastSyncedAt': lastSyncedAt!.millisecondsSinceEpoch,
        'orgId': orgId,
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory Member.fromJson(Map<String, dynamic> json) => Member(
        id: json['id'] as String,
        name: json['name'] as String,
        studentNo: json['studentNo'] as String,
        department: json['department'] as String,
        roleId: (json['roleId'] as String?) ?? (json['role'] as String?) ?? 'member',
        roleLabel: (json['roleLabel'] as String?) ?? '成员',
        phone: (json['phone'] as String?) ?? '',
        email: (json['email'] as String?) ?? '',
        joinedAt: _toDate(json['joinedAt']) ?? DateTime.now(),
        dingTalkUserId: (json['dingTalkUserId'] as String?) ?? '',
        syncStatus: (json['syncStatus'] as String?) ?? 'manual',
        lastSyncedAt: _toDate(json['lastSyncedAt']),
        orgId: (json['orgId'] as String?) ?? '',
        updatedAt: _toDate(json['updatedAt']),
      );
}

/// 兼容 int（epoch 毫秒）/ String（ISO 或数字）两种云端日期形态。
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
