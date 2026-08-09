/// 成员角色
enum MemberRole {
  president('社长'),
  director('部长'),
  officer('干事'),
  member('成员');

  const MemberRole(this.label);

  final String label;

  static MemberRole fromName(String? name) {
    return MemberRole.values.firstWhere(
      (r) => r.name == name,
      orElse: () => MemberRole.member,
    );
  }
}

/// 社团成员
class Member {
  Member({
    required this.id,
    required this.name,
    required this.studentNo,
    required this.department,
    required this.role,
    this.phone = '',
    this.email = '',
    required this.joinedAt,
  });

  final String id;
  final String name;
  final String studentNo;
  final String department;
  MemberRole role;
  String phone;
  String email;
  final DateTime joinedAt;

  /// 头像底色（由姓名哈希决定，保证同一个人颜色稳定）
  int get avatarColorIndex => name.hashCode.abs() % 8;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'studentNo': studentNo,
        'department': department,
        'role': role.name,
        'phone': phone,
        'email': email,
        'joinedAt': joinedAt.millisecondsSinceEpoch,
      };

  factory Member.fromJson(Map<String, dynamic> json) => Member(
        id: json['id'] as String,
        name: json['name'] as String,
        studentNo: json['studentNo'] as String,
        department: json['department'] as String,
        role: MemberRole.fromName(json['role'] as String?),
        phone: (json['phone'] as String?) ?? '',
        email: (json['email'] as String?) ?? '',
        joinedAt: DateTime.fromMillisecondsSinceEpoch(
          (json['joinedAt'] as int?) ??
              DateTime.now().millisecondsSinceEpoch,
        ),
      );
}
