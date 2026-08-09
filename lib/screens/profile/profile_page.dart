import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
    final memberProvider = context.watch<MemberProvider>();
    final activityProvider = context.watch<ActivityProvider>();
    final noticeProvider = context.watch<NoticeProvider>();
    final current = memberProvider.findById(CurrentUser.instance.memberId);

    final theme = Theme.of(context);
    final signedUpActivities = activityProvider.activities
        .where((a) => a.contains(CurrentUser.instance.memberId))
        .length;

    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
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
                            '${current.role.label} · ${current.department}',
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
                  label: '社团成员总数',
                  value: '${memberProvider.totalCount} 人',
                  icon: Icons.people_outline,
                ),
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: '进行中的活动',
                  value:
                      '${activityProvider.activities.where((a) => a.status == 1).length} 个',
                  icon: Icons.event_available_outlined,
                ),
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: '我的报名',
                  value: '$signedUpActivities 个',
                  icon: Icons.how_to_reg_outlined,
                ),
                const Divider(height: 1, indent: 56),
                _StatRow(
                  label: '未读公告',
                  value: '${noticeProvider.unreadCount} 条',
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
                  title: const Text('关于智联社团'),
                  subtitle: const Text('v1.0.0 · Flutter + HarmonyOS'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: '智联社团',
                    applicationVersion: '1.0.0',
                    applicationLegalese:
                        '基于 Flutter-OH 的社团管理应用\n开发周期：第1-12周',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            '今天是 ${formatDate(DateTime.now())}',
            textAlign: TextAlign.center,
            style:
                theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
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
