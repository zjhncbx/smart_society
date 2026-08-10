import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
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
  bool _deleting = false;

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
    final sync = context.watch<SyncProvider>();

    final user = auth.user;
    final org = orgProvider.currentOrg;
    final ongoingCount = projectProvider.projects.where((p) => p.status == 1).length;

    return Scaffold(
      appBar: AppBar(title: Text(labels.profileTitle)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // User profile card
          AppCard(
            child: Row(
              children: [
                MemberAvatar(
                  name: user?.displayNameOrId ?? '管理员',
                  colorIndex: 0,
                  radius: 28,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.displayNameOrId ?? '管理员',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        org?.name ?? labels.appTitle,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: cs.outline),
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
          const SizedBox(height: 8),
          // Org switcher row
          Row(
            children: [
              Expanded(
                child: AppCard(
                  onTap: () => context.push('/orgs/select'),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                  onTap: () {
                    auth.signOut();
                    context.go('/login');
                  },
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.logout, size: 18, color: cs.error),
                      const SizedBox(width: 6),
                      Text('退出登录', style: theme.textTheme.labelMedium?.copyWith(color: cs.error)),
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
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: cs.outline, fontWeight: FontWeight.w600),
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
                          style: theme.textTheme.labelMedium
                              ?.copyWith(fontWeight: FontWeight.w500),
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
                        style: theme.textTheme.labelMedium
                            ?.copyWith(fontWeight: FontWeight.w500),
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
                        style: theme.textTheme.labelMedium
                            ?.copyWith(fontWeight: FontWeight.w500),
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
                        style: theme.textTheme.bodyLarge
                            ?.copyWith(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        labels.labelWebAdminHint,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: cs.outline),
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
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: cs.error, fontWeight: FontWeight.w600),
            ),
          ),
          if (orgProvider.currentOrgRole == 'admin')
            AppCard(
              onTap: _deleting ? null : () => _confirmDeleteOrg(context),
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Icon(Icons.delete_forever_outlined, color: cs.error, size: 28),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '注销当前组织',
                          style: theme.textTheme.bodyLarge
                              ?.copyWith(fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          org?.name ?? '',
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: cs.outline),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: cs.outline),
                ],
              ),
            ),
          AppCard(
            onTap: _deleting ? null : () => _confirmDeleteUser(context),
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
                        style: theme.textTheme.bodyLarge
                            ?.copyWith(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '删除云端本账号所有数据，不可恢复',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: cs.outline),
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
        content: Text(isOnlyOrg
            ? '确定注销组织「${org?.name ?? ''}」？将永久删除该组织的全部成员、项目、公告及关联数据，不可恢复。这是您唯一的组织，注销后您的账号数据也将一并删除。'
            : '确定注销组织「${org?.name ?? ''}」？将永久删除该组织的全部成员、项目、公告及关联数据，不可恢复。'),
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
    setState(() => _deleting = true);
    try {
      final userDeregistered = await orgProvider.deleteOrg(orgProvider.currentOrgId ?? '');
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(userDeregistered ? '组织已注销，账号数据已清除' : '组织已注销'),
      ));
      context.go(userDeregistered ? '/login' : '/members');
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('注销失败: $e')));
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _confirmDeleteUser(BuildContext context) async {
    final orgProvider = context.read<OrganizationProvider>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('注销账号'),
        content: const Text(
            '确定注销账号？将永久删除云端本账号所有数据；若某组织仅您一个账号，该组织将一并注销。数据不可恢复，账号本身可重新登录。'),
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
    setState(() => _deleting = true);
    try {
      await orgProvider.deleteUser();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('账号已注销')));
      context.go('/login');
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('注销失败: $e')));
    } finally {
      if (mounted) setState(() => _deleting = false);
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
            style: theme.textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.bodySmall
                ?.copyWith(color: theme.colorScheme.outline),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
