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
        joinedAt: DateTime.fromMillisecondsSinceEpoch(
          (json['joinedAt'] as int?) ??
              DateTime.now().millisecondsSinceEpoch,
        ),
        dingTalkUserId: (json['dingTalkUserId'] as String?) ?? '',
        syncStatus: (json['syncStatus'] as String?) ?? 'manual',
        lastSyncedAt: (json['lastSyncedAt'] as int?) != null
            ? DateTime.fromMillisecondsSinceEpoch(json['lastSyncedAt'] as int)
            : null,
      );
}
