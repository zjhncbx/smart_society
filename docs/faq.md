# 常见问题

---

## 通用问题

| 问题 | 解决方案 |
|---|---|
| `flutter doctor` 报 OpenHarmony toolchain 缺失 | 检查 `DEVECO_SDK_HOME` / `HOS_SDK_HOME` |
| 真机签名失效 | DevEco → Project Structure → Signing Configs 重新生成 |
| DevEco 不显示 CloudProgram | 用 DevEco 打开 `mobile/` 目录，确保其下仅有 `Application/` + `CloudProgram/` |
| 华为账号登录失败 | 确认 AGC 已开通 Account Kit、OAuth 回调已配置 |
| 同步队列堆积 | 检查网络连接，恢复后 30s 周期内自动推送 |
| 设置保存报"保存失败" / 报缺参 | 设置保存必须先云端成功后本地生效；检查网络与 get/save-org-settings、get/save-user-settings 是否已部署 |
| `flutter test` 挂起无输出 | 测试内真实 IO（如 `Hive.openBox`）必须包在 `tester.runAsync()` 中执行 |

## 部署与联调

| 问题 | 解决方案 |
|---|---|
| 调用报 `160404: Trigger not exist` | 函数未部署或 HTTP 触发器未创建，重新部署 |
| 云函数报 `2047: the input class is invalid` | 函数目录内模型类未一并上传（模型类需实现 CloudDB SDK 要求的 5 个方法） |
| 控制台同步 OrgSettings 失败 / 部署云数据库报 `Failed to decode response body` | 多为云数据库服务未开通/登录态失效/网络代理拦截；确认服务开通后 DevEco 重新登录再试 |
| `set-rule-enabled` 一直返回「操作正在处理中」 | 前一次请求异常中断且未置 failed；等待 120s 认领超时后重试，或换用新幂等键 |
| `get-rule-config` 全部返回 enabled=true 但控制台已配置禁用 | 检查 `ruleConfig` 是否为合法 JSON 字符串（损坏时云函数按全部启用兜底） |
| Web 请求全部 401/403 | 确认 HTTP 触发器认证类型为 `apigw-client`、证书指纹已在 AGC 登记；Web 侧确认 `VITE_API_MODE=agc` 且 body 已合并 `orgId/userId` |
| 想用命令行部署云函数 | 当前工具链不可行，需 DevEco Studio Deploy 或 AGC 在线编辑器，见 [docs/deployment.md](deployment.md) |

## 移动端

| 问题 | 解决方案 |
|---|---|
| 设置页点击"保存"无反应 | 事件回调中应使用 `context.labelsRead`（`read` 版本），不能在事件回调中 `context.watch` |
| 应用闪退或白屏 | 检查 `agconnect-services.json` 是否正确放置于 `entry/src/main/resources/rawfile/` |
| 云端数据与本地不一致 | 手动触发同步：同步中心 → 立即同步；检查网络与队列状态 |

## Web 端

| 问题 | 解决方案 |
|---|---|
| Web 开发态接口如何 Mock | 默认 `VITE_API_MODE=mock`，`pnpm smoke` 校验 68 项断言；契约见 `web/src/mock/` |
| Web 如何对接真实 AGC 网关 | `VITE_API_MODE=agc` + `VITE_API_BASE_URL`，见 [docs/deployment.md](deployment.md) |
| `pnpm build` 以非零码退出 | 需 Node >= 20.19（Vite 7 硬性要求），当前 Node 18 下构建产物存在但退出码非 0 |
