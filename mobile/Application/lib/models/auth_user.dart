/// 当前认证用户信息
class AuthUser {
  /// 内部稳定 userId（跨端统一身份，规范见 docs/跨端统一用户身份与唯一标识规范.md）
  final String id;

  /// 外部身份标识（华为 OpenID），仅作兼容与展示
  final String openId;
  final String? unionId;
  final String? displayName;
  final String? avatarUri;

  const AuthUser({
    required this.id,
    required this.openId,
    this.unionId,
    this.displayName,
    this.avatarUri,
  });

  String get displayNameOrId => displayName ?? '用户$openIdSuffix';

  String get openIdSuffix => openId.length > 6 ? openId.substring(openId.length - 6) : openId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'openId': openId,
        if (unionId != null) 'unionId': unionId,
        if (displayName != null) 'displayName': displayName,
        if (avatarUri != null) 'avatarUri': avatarUri,
      };

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final openId = (json['openId'] as String?) ?? '';
    // 兼容旧会话：无内部 id 时回退到 openId
    final id = (json['id'] as String?) ?? openId;
    return AuthUser(
      id: id,
      openId: openId,
      unionId: json['unionId'] as String?,
      displayName: json['displayName'] as String?,
      avatarUri: json['avatarUri'] as String?,
    );
  }
}
