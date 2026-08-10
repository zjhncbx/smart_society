class Organization {
  final String orgId;
  final String name;
  final String orgType;
  final String creditCode;
  final String description;
  final String? parentOrgId;
  final String creatorUserId;
  final DateTime createdAt;
  final String status;

  const Organization({
    required this.orgId,
    required this.name,
    required this.orgType,
    this.creditCode = '',
    this.description = '',
    this.parentOrgId,
    required this.creatorUserId,
    required this.createdAt,
    this.status = 'active',
  });

  bool get isSchoolClub => orgType == 'schoolClub';
  bool get isVolunteerTeam => orgType == 'volunteerTeam';
  bool get isSocialOrg => orgType == 'socialOrg';

  Map<String, dynamic> toJson() => {
        'orgId': orgId,
        'name': name,
        'orgType': orgType,
        'creditCode': creditCode,
        'description': description,
        if (parentOrgId != null) 'parentOrgId': parentOrgId,
        'creatorUserId': creatorUserId,
        'createdAt': createdAt.toIso8601String(),
        'status': status,
      };

  factory Organization.fromJson(Map<String, dynamic> json) => Organization(
        orgId: json['orgId'] as String,
        name: json['name'] as String,
        orgType: (json['orgType'] as String?) ?? 'schoolClub',
        creditCode: (json['creditCode'] as String?) ?? '',
        description: (json['description'] as String?) ?? '',
        parentOrgId: json['parentOrgId'] as String?,
        creatorUserId: (json['creatorUserId'] as String?) ?? '',
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
            : DateTime.now(),
        status: (json['status'] as String?) ?? 'active',
      );
}
