import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_type.dart';
import '../../providers/activity_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../services/current_user.dart';
import '../../utils/date_format.dart';
import '../../widgets/member_avatar.dart';

/// 我的页：当前用户信息与数据概览
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final memberProvider = context.watch<MemberProvider>();
    final activityProvider = context.watch<ActivityProvider>();
    final noticeProvider = context.watch<NoticeProvider>();
    final current = memberProvider.findById(CurrentUser.instance.memberId);

    final theme = Theme.of(context);
    final signedUpActivities = activityProvider.activities
        .where((a) => a.contains(CurrentUser.instance.memberId));
    final signedUpCount = signedUpActivities.length;
    final totalVolunteerHours = signedUpActivities.fold<int>(
        0, (sum, a) => sum + (a.volunteerHours ?? 0));

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.profileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: '设置',
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (current != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    MemberAvatar(
                      name: current.name,
                      colorIndex: current.avatarColorIndex,
                      radius: 30,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            current.name,
                            style: theme.textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${current.roleLabel} · ${current.department}',
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(color: theme.colorScheme.outline),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                _StatRow(
                  label: labels.labelTotalMembers,
                  value:
                      '${memberProvider.totalCount} ${labels.tabMembers}',
                  icon: Icons.people_outline,
                ),
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: labels.labelOngoingActs,
                  value:
                      '${activityProvider.activities.where((a) => a.status == 1).length} ${labels.tabActivities}',
                  icon: Icons.event_available_outlined,
                ),
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: labels.labelMySignUps,
                  value: '$signedUpCount ${labels.tabActivities}',
                  icon: Icons.how_to_reg_outlined,
                ),
                if (context.orgType == OrgType.volunteerTeam) ...[
                  const Divider(height: 1, indent: 56),
                  _StatRow(
                    label: labels.volunteerHoursLabel,
                    value: '$totalVolunteerHours ${labels.tabMembers}',
                    icon: Icons.access_time,
                  ),
                ],
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: labels.labelUnreadNotices,
                  value:
                      '${noticeProvider.unreadCount} ${labels.tabNotices}',
                  icon: Icons.campaign_outlined,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(labels.aboutTitle),
                  subtitle: Text(labels.aboutSubtitle),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: labels.aboutDialogTitle,
                    applicationVersion: '1.0.0',
                    applicationLegalese: labels.aboutContent,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            '${labels.todayLabel} ${formatDate(DateTime.now())}',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall
                ?.copyWith(color: theme.colorScheme.outline),
          ),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(label),
      trailing: Text(
        value,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
