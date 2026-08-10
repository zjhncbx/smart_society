import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';

/// 华为账号登录页。
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  /// 将错误信息转换为用户可读提示。
  String _friendlyError(String error) {
    if (error.contains('MissingPluginException')) {
      return '登录组件未注册，请重新安装应用';
    }
    if (error.contains('1001500001')) {
      return '应用签名指纹校验失败，请检查AGC配置';
    }
    if (error.contains('1001502001')) {
      return '设备未登录华为账号，请先在系统设置中登录';
    }
    if (error.contains('1001502002')) {
      return '应用未获得华为账号授权';
    }
    if (error.contains('1001502005')) {
      return '网络错误，请检查网络后重试';
    }
    if (error.contains('1001502012')) {
      return '您已取消登录';
    }
    if (error.contains('12300001')) {
      return '华为账号服务异常，请稍后重试';
    }
    return '登录失败：$error';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.account_circle_outlined, size: 80, color: cs.primary),
                const SizedBox(height: 24),
                Text(
                  '社易管',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '社团管理 · 高效协作',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: cs.outline,
                  ),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: auth.loading ? null : () => auth.signIn(),
                    icon: auth.loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.login),
                    label: Text(auth.loading ? '登录中...' : '华为账号登录'),
                    style: FilledButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '使用华为账号安全登录，无需额外注册',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.outline,
                  ),
                ),
                if (auth.error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: cs.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _friendlyError(auth.error!),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onErrorContainer,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
