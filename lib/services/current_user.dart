/// 当前登录用户（MVP 阶段固定为种子数据中的社长张伟，
/// 后续接入账号体系后替换为真实登录用户）。
class CurrentUser {
  CurrentUser._();

  static final CurrentUser instance = CurrentUser._();

  String memberId = 'm001';
}
