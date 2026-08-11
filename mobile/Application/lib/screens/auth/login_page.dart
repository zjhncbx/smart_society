import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';

/// 登录页：华为账号一键登录 + 手机号/邮箱密码注册登录
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _accountController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _register = false;
  bool _obscure = true;

  @override
  void dispose() {
    _accountController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  String _friendlyError(String error) {
    if (error.contains('MissingPluginException')) {
      return '登录组件未注册，请重新安装应用';
    }
    if (error.contains('204126') ||
        error.contains('204220') ||
        error.contains('204218')) {
      return '登录异常，请检查 AGC 认证服务配置后重试';
    }
    if (error.contains('204221') || error.contains('204222')) {
      return '华为账号登录权限未开通或应用未通过审核';
    }
    if (error.contains('1001500001')) {
      return '应用签名指纹校验失败，请检查 AGC 配置';
    }
    if (error.contains('1001502001')) {
      return '设备未登录华为账号，请先在系统设置中登录';
    }
    if (error.contains('1001502012') || error.contains('204240')) {
      return '您已取消登录';
    }
    return '登录失败：$error';
  }

  Future<void> _submitAccount() async {
    final account = _accountController.text.trim();
    final password = _passwordController.text;
    if (account.isEmpty || password.isEmpty) {
      _showError('请输入手机号/邮箱与密码');
      return;
    }
    await context.read<AuthProvider>().signInWithAccount(
          account: account,
          password: password,
          register: _register,
          displayName: _nameController.text.trim(),
        );
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(Icons.account_circle_outlined,
                    size: 80, color: cs.primary),
                const SizedBox(height: 24),
                Text(
                  '社易管',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '社团管理 · 高效协作',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: cs.outline,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
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
                    label: Text(auth.loading ? '登录中…' : '华为账号一键登录'),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '或使用手机号 / 邮箱',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: cs.outline),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _accountController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: '手机号 / 邮箱',
                    prefixIcon: Icon(Icons.alternate_email),
                  ),
                ),
                const SizedBox(height: 12),
                if (_register) ...[
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: '昵称（可选）',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: _passwordController,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: '密码（至少 6 位）',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  onSubmitted: (_) => _submitAccount(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 48,
                  child: FilledButton(
                    onPressed: auth.loading ? null : _submitAccount,
                    child: Text(_register ? '注册并登录' : '登录'),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: auth.loading
                      ? null
                      : () => setState(() => _register = !_register),
                  child: Text(
                    _register ? '已有账号？直接登录' : '没有账号？注册一个',
                  ),
                ),
                Text(
                  '手机号/邮箱账号密码登录，密码以加盐哈希加密存储',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
                ),
                if (auth.error != null) ...[
                  const SizedBox(height: 16),
                  Container(
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
