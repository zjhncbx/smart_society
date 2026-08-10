/// 全局登录状态门闩：供 GoRouter 重定向判断登录态，
/// 独立成文件避免 router 与 provider 之间的循环依赖。
bool isAuthenticated = false;
