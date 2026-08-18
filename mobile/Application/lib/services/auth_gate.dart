/// 全局登录状态门闩：供 GoRouter 重定向判断登录态，
/// 独立成文件避免 router 与 provider 之间的循环依赖。
bool isAuthenticated = false;

/// 登录成功标记：下次路由重定向时强制回到首页，
/// 避免 go_router 单例在“注销 → 重新登录”后恢复上次会话的旧位置。
bool _pendingHomeAfterLogin = false;

void markPendingHomeAfterLogin() {
  _pendingHomeAfterLogin = true;
}

bool consumePendingHomeAfterLogin() {
  if (!_pendingHomeAfterLogin) return false;
  _pendingHomeAfterLogin = false;
  return true;
}
