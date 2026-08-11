class UserOrgMembership {
  final String id;
  final String userId;
  final String orgId;
  final String role;
  final DateTime joinedAt;

  const UserOrgMembership({
    required this.id,
    required this.userId,
    required this.orgId,
    required this.role,
    required this.joinedAt,
  });

  bool get isAdmin => role == 'admin';

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'orgId': orgId,
        'role': role,
        'joinedAt': joinedAt.toIso8601String(),
      };

  factory UserOrgMembership.fromJson(Map<String, dynamic> json) =>
      UserOrgMembership(
        id: json['id'] as String,
        userId: json['userId'] as String,
        orgId: json['orgId'] as String,
        role: (json['role'] as String?) ?? 'member',
        joinedAt: json['joinedAt'] != null
            ? DateTime.tryParse(json['joinedAt'] as String) ?? DateTime.now()
            : DateTime.now(),
      );
}
