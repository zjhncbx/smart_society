import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
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
    final labels = context.labels;
    final activityProvider = context.watch<ActivityProvider>();
    final memberProvider = context.watch<MemberProvider>();
    final activity = activityProvider.findById(id);

    if (activity == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.activityDetailTitle)),
        body: const EmptyView(icon: Icons.event_busy, message: '活动不存在'),
      );
    }

    final currentId = CurrentUser.instance.memberId;
    final signedUp = activity.contains(currentId);
    final canSignUp = !signedUp && !activity.isFull && activity.status == 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.activityDetailTitle),
        actions: [
          IconButton(
            tooltip: labels.deleteTooltip,
            icon: const Icon(Icons.delete_outline),
            onPressed: () =>
                _deleteActivity(context, activityProvider, activity, labels),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(activity.title,
              style: Theme.of(context).textTheme.headlineSmall),
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
            child: Text('${labels.labelOrganizer}：${activity.organizer}'),
          ),
          const SizedBox(height: 8),
          _InfoTile(
            icon: Icons.group_outlined,
            child: Text(
              '${labels.signUpProgress}：${activity.participantCount}/${activity.capacity} 人'
              '${activity.isFull ? '（${labels.labelFull}）' : ''}',
            ),
          ),
          if (context.orgType == OrgType.volunteerTeam) ...[
            const SizedBox(height: 8),
            _InfoTile(
              icon: Icons.access_time,
              child: Text('${labels.volunteerHoursLabel}：-'),
            ),
          ],
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
                      ? () => _signUp(context, activityProvider, activity.id,
                          currentId, labels)
                      : (signedUp
                          ? () => _cancelSignUp(context, activityProvider,
                              activity.id, currentId, labels)
                          : null),
                  icon: Icon(
                    signedUp ? Icons.check : Icons.how_to_reg_outlined,
                  ),
                  label: Text(
                    signedUp
                        ? labels.labelSignedUp
                        : (activity.isFull ? labels.labelFull : labels.labelSignUp),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '${labels.labelSignUp.substring(2)}${labels.tabMembers}（${activity.participantCount}）',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          if (activity.participants.isEmpty)
            EmptyView(
                icon: Icons.how_to_reg_outlined,
                message: labels.emptyParticipants)
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
                title: Text(member?.name ?? labels.unknownMember),
                subtitle: Text(
                    '${member?.department ?? ''} · ${labels.labelSignUp.substring(2)}于 ${formatDateTime(p.joinedAt)}'),
                trailing: member?.id == currentId
                    ? Text(labels.meLabel,
                        style:
                            const TextStyle(color: Color(0xFF3D6BD6)))
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
    OrgLabels labels,
  ) async {
    final ok = await provider.signUp(activityId, memberId);
    if (context.mounted) {
      showToast(context, ok ? labels.signUpSuccess : labels.signUpFail);
    }
  }

  Future<void> _cancelSignUp(
    BuildContext context,
    ActivityProvider provider,
    String activityId,
    String memberId,
    OrgLabels labels,
  ) async {
    await provider.cancelSignUp(activityId, memberId);
    if (context.mounted) {
      showToast(context, labels.cancelSignUp);
    }
  }

  Future<void> _deleteActivity(
    BuildContext context,
    ActivityProvider provider,
    SocietyActivity activity,
    OrgLabels labels,
  ) async {
    final activityType =
        labels.deleteActivityTitle.replaceAll(labels.deleteTooltip, '').trim();
    final ok = await showConfirmDialog(
      context,
      title: labels.deleteActivityTitle,
      message: labels.confirmDeleteMsg
          .replaceAll('{type}', activityType)
          .replaceAll('{name}', activity.title),
      confirmText: labels.deleteTooltip,
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
