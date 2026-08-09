import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/society_activity.dart';
import '../../providers/activity_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';

/// 活动列表页：状态筛选
class ActivityListPage extends StatefulWidget {
  const ActivityListPage({super.key});

  @override
  State<ActivityListPage> createState() => _ActivityListPageState();
}

class _ActivityListPageState extends State<ActivityListPage> {
  int? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<ActivityProvider>();
    final activities = provider.sortedActivities.where((a) {
      return _statusFilter == null || a.status == _statusFilter;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: Text(labels.activityMgmtTitle)),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                _StatusChip(
                  label: labels.statusAll,
                  selected: _statusFilter == null,
                  onTap: () => setState(() => _statusFilter = null),
                ),
                for (final (value, label) in [
                  (0, labels.statusNotStarted),
                  (1, labels.statusInProgress),
                  (2, labels.statusEnded),
                ])
                  _StatusChip(
                    label: label,
                    selected: _statusFilter == value,
                    onTap: () => setState(() => _statusFilter = value),
                  ),
              ],
            ),
          ),
          Expanded(
            child: activities.isEmpty
                ? AppEmptyState(
                    icon: Icons.event_busy,
                    title: labels.emptyActivities,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 88),
                    itemCount: activities.length,
                    itemBuilder: (context, index) {
                      final activity = activities[index];
                      return _ActivityCard(
                        activity: activity,
                        labels: labels,
                        onTap: () =>
                            context.push('/activities/${activity.id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/activities/new'),
        icon: const Icon(Icons.add),
        label: Text(labels.createButton),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.activity,
    required this.labels,
    required this.onTap,
  });

  final SocietyActivity activity;
  final OrgLabels labels;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final statusColor = switch (activity.status) {
      0 => colorScheme.primary,
      1 => colorScheme.tertiary,
      _ => colorScheme.outline,
    };

    final statusLabel = switch (activity.status) {
      0 => labels.statusNotStarted,
      1 => labels.statusInProgress,
      _ => labels.statusEnded,
    };

    final badgeVariant = switch (activity.status) {
      0 => BadgeVariant.info,
      1 => BadgeVariant.success,
      _ => BadgeVariant.neutral,
    };

    return AppCard(
      accentColor: statusColor,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  activity.title,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              StatusBadge(label: statusLabel, variant: badgeVariant),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.schedule, size: 16, color: colorScheme.outline),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${formatDateTime(activity.startTime)} ~ ${formatTime(activity.endTime)}',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.place_outlined, size: 16, color: colorScheme.outline),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  activity.location,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.group_outlined, size: 16, color: colorScheme.outline),
              const SizedBox(width: 4),
              Text(
                '${activity.participantCount}/${activity.capacity} 人',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
