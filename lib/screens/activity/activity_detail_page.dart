import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../models/society_activity.dart';
import '../../providers/activity_provider.dart';
import '../../providers/member_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';
import '../../widgets/member_avatar.dart';

/// 活动详情页：管理员管理参与人
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
        body: AppEmptyState(
          icon: Icons.event_busy,
          title: labels.labelActivityNotExist,
        ),
      );
    }

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
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Column(
              children: [
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
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (activity.description.isNotEmpty) ...[
            Text(
              labels.labelActivityIntro,
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
                child: OutlinedButton.icon(
                  onPressed: () => _manageParticipants(
                    context, activityProvider, memberProvider, activity, labels,
                  ),
                  icon: const Icon(Icons.people_outline),
                  label: Text(labels.labelManageParticipants),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: activity.isFull
                      ? null
                      : () => _addParticipant(
                          context, activityProvider, memberProvider, activity, labels,
                        ),
                  icon: const Icon(Icons.person_add),
                  label: Text(labels.labelAddParticipant),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '${labels.labelManageParticipants}（${activity.participantCount}）',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          if (activity.participants.isEmpty)
            AppEmptyState(
              icon: Icons.how_to_reg_outlined,
              title: labels.emptyParticipants,
            )
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
                    '${member?.department ?? ''} · ${labels.labelSignedUp} ${formatDateTime(p.joinedAt)}'),
              );
            }),
        ],
      ),
    );
  }

  void _manageParticipants(
    BuildContext context,
    ActivityProvider activityProvider,
    MemberProvider memberProvider,
    SocietyActivity activity,
    OrgLabels labels,
  ) {
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            final fresh =
                activityProvider.findById(activity.id) ?? activity;
            return AlertDialog(
              title: Text(labels.labelManageParticipants),
              content: SizedBox(
                width: double.maxFinite,
                child: fresh.participants.isEmpty
                    ? AppEmptyState(
                        icon: Icons.how_to_reg_outlined,
                        title: labels.emptyParticipants,
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: fresh.participants.length,
                        itemBuilder: (ctx, index) {
                          final p = fresh.participants[index];
                          final member = memberProvider.findById(p.memberId);
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: MemberAvatar(
                              name: member?.name ?? '?',
                              colorIndex: member?.avatarColorIndex ?? 0,
                              radius: 16,
                            ),
                            title:
                                Text(member?.name ?? labels.unknownMember),
                            subtitle: Text(
                              member?.department ?? '',
                            ),
                            trailing: IconButton(
                              tooltip: labels.labelRemoveParticipant,
                              icon: const Icon(Icons.remove_circle_outline,
                                  color: Colors.red),
                              onPressed: () async {
                                await activityProvider.cancelSignUp(
                                    activity.id, p.memberId);
                                if (ctx.mounted) {
                                  showToast(
                                      context, labels.labelRemoveParticipant);
                                  setDialogState(() {});
                                }
                              },
                            ),
                          );
                        },
                      ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: Text(labels.labelSwitchCancel),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _addParticipant(
    BuildContext context,
    ActivityProvider activityProvider,
    MemberProvider memberProvider,
    SocietyActivity activity,
    OrgLabels labels,
  ) {
    final participantIds = activity.participants.map((p) => p.memberId).toSet();
    final availableMembers =
        memberProvider.members.where((m) => !participantIds.contains(m.id)).toList();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(labels.labelAddParticipant),
        content: SizedBox(
          width: double.maxFinite,
          child: availableMembers.isEmpty
              ? AppEmptyState(
                  icon: Icons.person_off,
                  title: labels.emptyMembers,
                )
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: availableMembers.length,
                  itemBuilder: (ctx, index) {
                    final member = availableMembers[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: MemberAvatar(
                        name: member.name,
                        colorIndex: member.avatarColorIndex,
                        radius: 16,
                      ),
                      title: Text(member.name),
                      subtitle: Text(
                        '${member.department} · ${labels.roleLabel(member.roleId)}',
                      ),
                      onTap: () async {
                        final ok = await activityProvider.signUp(
                            activity.id, member.id);
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        showToast(
                          ctx,
                          ok ? labels.addSuccess : labels.signUpFail,
                        );
                      },
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(labels.labelSwitchCancel),
          ),
        ],
      ),
    );
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
