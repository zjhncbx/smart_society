import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/society_activity.dart';
import '../../providers/activity_provider.dart';
import '../../providers/member_provider.dart';
import '../../services/current_user.dart';
import '../../utils/date_format.dart';
import '../../widgets/common.dart';
import '../../widgets/member_avatar.dart';

/// 活动详情页：报名/取消报名、报名列表、名额状态
class ActivityDetailPage extends StatelessWidget {
  const ActivityDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final activityProvider = context.watch<ActivityProvider>();
    final memberProvider = context.watch<MemberProvider>();
    final activity = activityProvider.findById(id);

    if (activity == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('活动详情')),
        body: const EmptyView(icon: Icons.event_busy, message: '活动不存在'),
      );
    }

    final currentId = CurrentUser.instance.memberId;
    final signedUp = activity.contains(currentId);
    final canSignUp = !signedUp && !activity.isFull && activity.status == 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('活动详情'),
        actions: [
          IconButton(
            tooltip: '删除活动',
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _deleteActivity(context, activityProvider, activity),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(activity.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          _InfoTile(
            icon: Icons.schedule,
            child: Text(
              '${formatDateTime(activity.startTime)} ~ ${formatTime(activity.endTime)}',
            ),
          ),
          const SizedBox(height: 8),
          _InfoTile(
            icon: Icons.place_outlined,
            child: Text(activity.location),
          ),
          const SizedBox(height: 8),
          _InfoTile(
            icon: Icons.person_outline,
            child: Text('组织者：${activity.organizer}'),
          ),
          const SizedBox(height: 8),
          _InfoTile(
            icon: Icons.group_outlined,
            child: Text(
              '报名进度：${activity.participantCount}/${activity.capacity} 人'
              '${activity.isFull ? '（已满员）' : ''}',
            ),
          ),
          const SizedBox(height: 16),
          if (activity.description.isNotEmpty) ...[
            Text(
              '活动介绍',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              activity.description,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(height: 1.6),
            ),
            const SizedBox(height: 24),
          ],
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: canSignUp
                      ? () => _signUp(context, activityProvider, activity.id, currentId)
                      : (signedUp
                          ? () => _cancelSignUp(
                              context, activityProvider, activity.id, currentId)
                          : null),
                  icon: Icon(
                    signedUp ? Icons.check : Icons.how_to_reg_outlined,
                  ),
                  label: Text(
                    signedUp
                        ? '已报名，点击取消'
                        : (activity.isFull ? '名额已满' : '立即报名'),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '报名成员（${activity.participantCount}）',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          if (activity.participants.isEmpty)
            const EmptyView(icon: Icons.how_to_reg_outlined, message: '暂无成员报名')
          else
            ...activity.participants.map((p) {
              final member = memberProvider.findById(p.memberId);
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: MemberAvatar(
                  name: member?.name ?? '?',
                  colorIndex: member?.avatarColorIndex ?? 0,
                  radius: 18,
                ),
                title: Text(member?.name ?? '未知成员'),
                subtitle: Text('${member?.department ?? ''} · 报名于 ${formatDateTime(p.joinedAt)}'),
                trailing: member?.id == currentId
                    ? const Text('我', style: TextStyle(color: Color(0xFF3D6BD6)))
                    : null,
              );
            }),
        ],
      ),
    );
  }

  Future<void> _signUp(
    BuildContext context,
    ActivityProvider provider,
    String activityId,
    String memberId,
  ) async {
    final ok = await provider.signUp(activityId, memberId);
    if (context.mounted) {
      showToast(context, ok ? '报名成功' : '报名失败，请检查名额');
    }
  }

  Future<void> _cancelSignUp(
    BuildContext context,
    ActivityProvider provider,
    String activityId,
    String memberId,
  ) async {
    await provider.cancelSignUp(activityId, memberId);
    if (context.mounted) {
      showToast(context, '已取消报名');
    }
  }

  Future<void> _deleteActivity(
    BuildContext context,
    ActivityProvider provider,
    SocietyActivity activity,
  ) async {
    final ok = await showConfirmDialog(
      context,
      title: '删除活动',
      message: '确定删除活动「${activity.title}」吗？',
      confirmText: '删除',
    );
    if (!ok || !context.mounted) return;
    await provider.deleteActivity(activity.id);
    if (context.mounted) context.pop();
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.child});

  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.outline),
        const SizedBox(width: 8),
        Expanded(child: child),
      ],
    );
  }
}
