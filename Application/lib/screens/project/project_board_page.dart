import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/project.dart';
import '../../providers/member_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';

/// 项目任务看板：待办 / 进行中 / 已完成三列
class ProjectBoardPage extends StatefulWidget {
  const ProjectBoardPage({super.key, required this.id});

  final String id;

  @override
  State<ProjectBoardPage> createState() => _ProjectBoardPageState();
}

class _ProjectBoardPageState extends State<ProjectBoardPage> {
  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<ProjectProvider>();
    final memberProvider = context.watch<MemberProvider>();
    final project = provider.findById(widget.id);

    if (project == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.labelTasks)),
        body: AppEmptyState(
          icon: Icons.folder_off,
          title: labels.labelProjectNotExist,
        ),
      );
    }

    final columns = [
      (kTaskTodo, labels.labelTaskTodo, _todoColor(context)),
      (kTaskDoing, labels.labelTaskDoing, _doingColor(context)),
      (kTaskDone, labels.labelTaskDone, _doneColor(context)),
    ];

    return Scaffold(
      appBar: AppBar(title: Text('${project.name} · 任务看板')),
      body: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.all(12),
        children: [
          for (final col in columns)
            _BoardColumn(
              title: col.$2,
              color: col.$3,
              tasks: project.tasks.where((t) => t.status == col.$1).toList(),
              memberProvider: memberProvider,
              onTapTask: (task) => _showTaskActions(context, labels, project, task),
            ),
        ],
      ),
    );
  }

  Color _todoColor(BuildContext context) => Theme.of(context).colorScheme.outline;
  Color _doingColor(BuildContext context) => Theme.of(context).colorScheme.primary;
  Color _doneColor(BuildContext context) => const Color(0xFF00B96B);

  Future<void> _showTaskActions(
    BuildContext context,
    OrgLabels labels,
    Project project,
    ProjectTask task,
  ) async {
    final nextStatus = (task.status + 1) % 3;
    final nextLabel = switch (nextStatus) {
      kTaskTodo => labels.labelTaskTodo,
      kTaskDoing => labels.labelTaskDoing,
      _ => labels.labelTaskDone,
    };
    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(task.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${labels.labelAssignee}: ${_assigneeName(ctx, task)}'),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.compare_arrows),
              title: Text('流转到：$nextLabel'),
              onTap: () => Navigator.of(ctx).pop('advance'),
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline),
              title: Text(labels.deleteTaskTitle),
              onTap: () => Navigator.of(ctx).pop('delete'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (action == null || !context.mounted) return;
    final provider = context.read<ProjectProvider>();
    if (action == 'advance') {
      task.status = nextStatus;
      await provider.saveProject(project);
    } else if (action == 'delete') {
      final ok = await showConfirmDialog(
        context,
        title: labels.deleteTaskTitle,
        message: labels.confirmDeleteMsg
            .replaceAll('{type}', labels.labelTasks)
            .replaceAll('{name}', task.title),
        confirmText: labels.confirmDelete,
        cancelText: labels.labelSwitchCancel,
      );
      if (ok && context.mounted) {
        project.tasks.removeWhere((t) => t.id == task.id);
        await provider.saveProject(project);
      }
    }
  }

  String _assigneeName(BuildContext context, ProjectTask task) {
    if (task.assigneeId.isEmpty) return context.labels.notFilled;
    return context
            .read<MemberProvider>()
            .findById(task.assigneeId)
            ?.name ??
        context.labels.notFilled;
  }
}

class _BoardColumn extends StatelessWidget {
  const _BoardColumn({
    required this.title,
    required this.color,
    required this.tasks,
    required this.memberProvider,
    required this.onTapTask,
  });

  final String title;
  final Color color;
  final List<ProjectTask> tasks;
  final MemberProvider memberProvider;
  final ValueChanged<ProjectTask> onTapTask;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 250,
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '$title (${tasks.length})',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.all(8),
                child: tasks.isEmpty
                    ? Center(
                        child: Text(
                          '暂无任务',
                          style: TextStyle(
                            fontSize: 12,
                            color: theme.colorScheme.outline,
                          ),
                        ),
                      )
                    : ListView(
                        children: [
                          for (final task in tasks)
                            _TaskCard(
                              task: task,
                              memberProvider: memberProvider,
                              onTap: () => onTapTask(task),
                            ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard({
    required this.task,
    required this.memberProvider,
    required this.onTap,
  });

  final ProjectTask task;
  final MemberProvider memberProvider;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final assignee = task.assigneeId.isEmpty
        ? null
        : memberProvider.findById(task.assigneeId)?.name;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                task.title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  StatusBadge(
                    label: switch (task.priority) {
                      kPriorityHigh => '高',
                      kPriorityLow => '低',
                      _ => '中',
                    },
                    variant: task.priority == kPriorityHigh
                        ? BadgeVariant.warning
                        : BadgeVariant.neutral,
                  ),
                  const Spacer(),
                  if (task.dueDate != null)
                    Text(
                      formatDate(task.dueDate!),
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.outline),
                    ),
                ],
              ),
              if (assignee != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '负责人：$assignee',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.outline),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
