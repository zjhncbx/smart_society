/// 当前认证用户信息
class AuthUser {
  final String openId;
  final String? unionId;
  final String? displayName;
  final String? avatarUri;

  const AuthUser({
    required this.openId,
    this.unionId,
    this.displayName,
    this.avatarUri,
  });

  String get displayNameOrId => displayName ?? '用户$openIdSuffix';

  String get openIdSuffix => openId.length > 6 ? openId.substring(openId.length - 6) : openId;

  Map<String, dynamic> toJson() => {
        'openId': openId,
        if (unionId != null) 'unionId': unionId,
        if (displayName != null) 'displayName': displayName,
        if (avatarUri != null) 'avatarUri': avatarUri,
      };

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        openId: json['openId'] as String,
        unionId: json['unionId'] as String?,
        displayName: json['displayName'] as String?,
        avatarUri: json['avatarUri'] as String?,
      );
}
