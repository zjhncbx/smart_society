import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/sync_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/member_avatar.dart';

/// 管理概览页：管理仪表盘
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final memberProvider = context.watch<MemberProvider>();
    final projectProvider = context.watch<ProjectProvider>();
    final noticeProvider = context.watch<NoticeProvider>();
    final auth = context.watch<AuthProvider>();
    final orgProvider = context.watch<OrganizationProvider>();
    final settings = context.watch<SettingsProvider>();
    final sync = context.watch<SyncProvider>();

    final user = auth.user;
    final org = orgProvider.currentOrg;
    final displayName = settings.nickname.isNotEmpty
        ? settings.nickname
        : (user?.displayNameOrId ?? '管理员');
    final binding = settings.memberBinding(orgProvider.currentOrgId ?? '');
    final bindingText = binding == null
        ? '未绑定（按手机号绑定）'
        : '已绑定：${binding.memberName}（${binding.memberId}）';
    final ongoingCount = projectProvider.projects
        .where((p) => p.status == 1)
        .length;

    return Scaffold(
      appBar: AppBar(title: Text(labels.profileTitle)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // User profile card
          AppCard(
            child: Row(
              children: [
                MemberAvatar(name: displayName, colorIndex: 0, radius: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        org?.name ?? labels.appTitle,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  tooltip: labels.labelSettingsTitle,
                  onPressed: () => context.push('/settings'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Section: Account
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Text(
              '账号',
              style: theme.textTheme.titleSmall?.copyWith(
                color: cs.outline,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          AppCard(
            onTap: _busy ? null : () => _editNickname(context),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Icon(Icons.badge_outlined, color: cs.primary, size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '用户名',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        displayName,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: cs.outline),
              ],
            ),
          ),
          AppCard(
            onTap: _busy ? null : () => _bindMember(context),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Icon(Icons.link, color: cs.tertiary, size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '绑定会员',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        bindingText,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: cs.outline),
              ],
            ),
          ),
          if (orgProvider.currentOrgRole == 'admin')
            AppCard(
              onTap: _busy ? null : () => _transferAdmin(context),
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Icon(
                    Icons.admin_panel_settings_outlined,
                    color: cs.primary,
                    size: 28,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '变更管理员',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '输入会员ID，转让给该会员绑定的账号',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: cs.outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: cs.outline),
                ],
              ),
            ),
          const SizedBox(height: 8),
          // Org switcher row
          Row(
            children: [
              Expanded(
                child: AppCard(
                  onTap: () => context.push('/orgs/select'),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.swap_horiz, size: 18, color: cs.primary),
                      const SizedBox(width: 6),
                      Text('切换组织', style: theme.textTheme.labelMedium),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppCard(
                  onTap: () async {
                    await auth.signOut();
                    // 登出后由 app 层自动切换到登录页
                  },
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.logout, size: 18, color: cs.error),
                      const SizedBox(width: 6),
                      Text(
                        '退出登录',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: cs.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Section: Dashboard
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Text(
              labels.labelDashboard,
              style: theme.textTheme.titleSmall?.copyWith(
                color: cs.outline,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          // Stats grid 2x2
          Row(
            children: [
              Expanded(
                child: _StatTile(
                  icon: Icons.people_outline,
                  iconColor: cs.primary,
                  value: '${memberProvider.totalCount}',
                  label: labels.labelTotalMembers,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatTile(
                  icon: Icons.task_alt_outlined,
                  iconColor: cs.tertiary,
                  value: '$ongoingCount',
                  label: labels.labelOngoingProjects,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatTile(
                  icon: Icons.notifications_outlined,
                  iconColor: cs.error,
                  value: '${noticeProvider.unreadCount}',
                  label: labels.labelUnreadNotices,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatTile(
                  icon: Icons.sync,
                  iconColor: sync.pendingCount > 0 ? cs.error : cs.outline,
                  value: sync.pendingCount > 0 ? '${sync.pendingCount}' : '--',
                  label: '待同步',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Quick actions row
          Row(
            children: [
              if (!memberProvider.isDingTalkManaged) ...[
                Expanded(
                  child: AppCard(
                    onTap: () => context.push('/members/new'),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.person_add_outlined, color: cs.primary),
                        const SizedBox(height: 6),
                        Text(
                          labels.addButton,
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 4),
              ],
              Expanded(
                child: AppCard(
                  onTap: () => context.push('/projects/new'),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.task_alt_outlined, color: cs.tertiary),
                      const SizedBox(height: 6),
                      Text(
                        labels.createButton,
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: AppCard(
                  onTap: () => context.push('/notices/new'),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.campaign_outlined, color: cs.error),
                      const SizedBox(height: 6),
                      Text(
                        labels.publishButton,
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Web Admin card
          AppCard(
            onTap: () {
              // Placeholder for web admin action
            },
            child: Row(
              children: [
                Icon(Icons.open_in_browser, color: cs.primary, size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        labels.labelWebAdmin,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        labels.labelWebAdminHint,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: cs.outline),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Danger zone
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Text(
              '危险操作',
              style: theme.textTheme.titleSmall?.copyWith(
                color: cs.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (orgProvider.currentOrgRole == 'admin')
            AppCard(
              onTap: _busy ? null : () => _confirmDeleteOrg(context),
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Icon(
                    Icons.delete_forever_outlined,
                    color: cs.error,
                    size: 28,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '注销当前组织',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          org?.name ?? '',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: cs.outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: cs.outline),
                ],
              ),
            ),
          AppCard(
            onTap: _busy ? null : () => _confirmDeleteUser(context),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Icon(Icons.person_off_outlined, color: cs.error, size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '注销账号',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '删除云端本账号所有数据，不可恢复',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: cs.outline),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteOrg(BuildContext context) async {
    final orgProvider = context.read<OrganizationProvider>();
    final org = orgProvider.currentOrg;
    final isOnlyOrg = orgProvider.orgs.length == 1;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('注销组织'),
        content: Text(
          isOnlyOrg
              ? '确定注销组织「${org?.name ?? ''}」？将永久删除该组织的全部成员、项目、公告及关联数据，不可恢复。这是您唯一的组织，注销后您的账号数据也将一并删除。'
              : '确定注销组织「${org?.name ?? ''}」？将永久删除该组织的全部成员、项目、公告及关联数据，不可恢复。',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认注销'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      final userDeregistered = await orgProvider.deleteOrg(
        orgProvider.currentOrgId ?? '',
      );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(userDeregistered ? '组织已注销，账号数据已清除' : '组织已注销')),
      );
      if (!userDeregistered) {
        // 等本帧重建完成后跳转；注销账号场景由 app 层自动切换到登录页
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) context.go('/members');
        });
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('注销失败: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmDeleteUser(BuildContext context) async {
    final orgProvider = context.read<OrganizationProvider>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('注销账号'),
        content: const Text(
          '确定注销账号？将永久删除云端本账号所有数据；若某组织仅您一个账号，该组织将一并注销。数据不可恢复，账号本身可重新登录。',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认注销'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await orgProvider.deleteUser();
      // 注销会触发登出，app 层自动切换到登录页，无需手动跳转
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('注销失败: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editNickname(BuildContext context) async {
    final settings = context.read<SettingsProvider>();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => _InputDialog(
        title: '修改用户名',
        label: '用户名',
        hint: '请输入用户名',
        initialValue: settings.nickname,
        maxLength: 20,
        confirmLabel: '保存',
      ),
    );
    if (name == null || name.isEmpty || !context.mounted) return;
    await settings.setNickname(name);
    if (!context.mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('用户名已更新')));
  }

  Future<void> _bindMember(BuildContext context) async {
    final orgProvider = context.read<OrganizationProvider>();
    final phone = await showDialog<String>(
      context: context,
      builder: (ctx) => const _InputDialog(
        title: '绑定会员',
        label: '手机号',
        hint: '请输入您的手机号',
        keyboardType: TextInputType.phone,
        confirmLabel: '绑定',
      ),
    );
    if (phone == null || phone.isEmpty || !context.mounted) return;
    setState(() => _busy = true);
    try {
      final map = await orgProvider.bindMember(phone);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('已绑定会员「${map['memberName'] ?? ''}」')),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('绑定失败: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _transferAdmin(BuildContext context) async {
    final orgProvider = context.read<OrganizationProvider>();
    final memberId = await showDialog<String>(
      context: context,
      builder: (ctx) => const _InputDialog(
        title: '变更管理员',
        label: '会员ID',
        hint: '例如 m001（该会员需已被对方账号绑定）',
        confirmLabel: '下一步',
      ),
    );
    if (memberId == null || memberId.isEmpty || !context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认转让管理员'),
        content: Text('将管理员转让给会员 $memberId 绑定的账号，转让后您将变为普通成员。确定继续？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认转让'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await orgProvider.transferAdmin(memberId);
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('管理员已转让')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('转让失败: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 10),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.outline,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// 自持 controller 的输入对话框：State.dispose 晚于子树销毁，
/// 避免对话框退场动画期间 controller 被提前释放导致崩溃。
class _InputDialog extends StatefulWidget {
  const _InputDialog({
    required this.title,
    required this.confirmLabel,
    this.label,
    this.hint,
    this.initialValue = '',
    this.keyboardType,
    this.maxLength,
  });

  final String title;
  final String confirmLabel;
  final String? label;
  final String? hint;
  final String initialValue;
  final TextInputType? keyboardType;
  final int? maxLength;

  @override
  State<_InputDialog> createState() => _InputDialogState();
}

class _InputDialogState extends State<_InputDialog> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(
        controller: _controller,
        autofocus: true,
        keyboardType: widget.keyboardType,
        maxLength: widget.maxLength,
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, _controller.text.trim()),
          child: Text(widget.confirmLabel),
        ),
      ],
    );
  }
}
