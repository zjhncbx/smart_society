/// 当前用户在当前组织的权限包（P0-C 第一版 RBAC）。
class PermissionBundle {
  const PermissionBundle({
    this.roleId = '',
    this.roleName = '',
    this.permissions = const {},
    this.dataScope = 'org',
    this.isAdmin = false,
    this.catalog = const {},
  });

  final String roleId;
  final String roleName;
  final Set<String> permissions;
  final String dataScope;
  final bool isAdmin;
  final Map<String, dynamic> catalog;

  bool has(String code) => isAdmin || permissions.contains(code);

  bool get canManageOrg => has('org:admin') || has('org:edit');
  bool get canDeleteOrg => has('org:delete');
  bool get canViewFinance => has('finance:view');
  bool get canViewAudit => has('audit:view');
  bool get canRunAutomation => has('automation:run');

  factory PermissionBundle.fromJson(Map<String, dynamic> json) {
    final rawPerms = json['permissions'];
    final perms = <String>{};
    if (rawPerms is List) {
      for (final p in rawPerms) {
        perms.add('$p');
      }
    }
    final rawCatalog = json['catalog'];
    return PermissionBundle(
      roleId: (json['roleId'] as String?) ?? '',
      roleName: (json['roleName'] as String?) ?? '',
      permissions: perms,
      dataScope: (json['dataScope'] as String?) ?? 'org',
      isAdmin: json['isAdmin'] == true,
      catalog: rawCatalog is Map
          ? Map<String, dynamic>.from(rawCatalog)
          : const {},
    );
  }
}
