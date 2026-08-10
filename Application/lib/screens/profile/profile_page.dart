import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../providers/activity_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/sync_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/member_avatar.dart';

/// 管理概览页：管理仪表盘
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final memberProvider = context.watch<MemberProvider>();
    final activityProvider = context.watch<ActivityProvider>();
    final noticeProvider = context.watch<NoticeProvider>();
    final auth = context.watch<AuthProvider>();
    final orgProvider = context.watch<OrganizationProvider>();
    final sync = context.watch<SyncProvider>();

    final user = auth.user;
    final org = orgProvider.currentOrg;
    final ongoingCount =
        activityProvider.activities.where((a) => a.status == 1).length;

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
                  icon: Icons.event_available_outlined,
                  iconColor: cs.tertiary,
                  value: '$ongoingCount',
                  label: labels.labelOngoingActs,
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
              Expanded(
                child: AppCard(
                  onTap: () => context.push('/activities/new'),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.event_outlined, color: cs.tertiary),
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
        ],
      ),
    );
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
