import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/finance_config.dart';
import '../../models/member.dart';
import '../../models/project.dart';
import '../../models/finance_record.dart';
import '../../providers/finance_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/date_format.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';

/// 项目详情页：进度、状态流转、任务与里程碑管理
class ProjectDetailPage extends StatelessWidget {
  const ProjectDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final provider = context.watch<ProjectProvider>();
    final memberProvider = context.watch<MemberProvider>();
    final project = provider.findById(id);

    if (project == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.projectDetailTitle)),
        body: AppEmptyState(icon: Icons.folder_off, title: labels.labelProjectNotExist),
      );
    }

    final managerName = memberProvider.findById(project.managerId)?.name ?? labels.notFilled;

    return Scaffold(
      appBar: AppBar(
        title: Text(project.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: labels.editTooltip,
            onPressed: () => context.push('/projects/${project.id}/edit'),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: labels.deleteTooltip,
            onPressed: () => _confirmDelete(context, labels, project),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        project.name,
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    StatusBadge(
                      label: _statusLabel(labels, project.status),
                      variant: _statusVariant(project.status),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text('${labels.labelManager}: $managerName',
                    style: theme.textTheme.bodySmall?.copyWith(color: cs.outline)),
                const SizedBox(height: 4),
                Text(
                  '${labels.labelStartDate}: ${formatDate(project.startDate)}    ${labels.labelEndDate}: ${formatDate(project.endDate)}',
                  style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: project.progress / 100,
                          minHeight: 8,
                          backgroundColor: cs.surfaceContainerHighest,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '${labels.labelProgress}: ${project.progress}%',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: cs.primary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => _showTransitionDialog(context, labels, project),
                  icon: const Icon(Icons.compare_arrows, size: 18),
                  label: Text(labels.labelStatusTransition),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // ── 项目财务 ──
          _ProjectFinanceSection(
            projectId: project.id,
            budget: project.budget,
          ),
          const SizedBox(height: 8),
          // ── 里程碑 ──
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${labels.labelMilestones} (${project.doneMilestoneCount}/${project.milestoneCount})',
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add),
                      tooltip: labels.labelAddMilestone,
                      onPressed: () => _showAddMilestoneDialog(context, labels, project),
                    ),
                  ],
                ),
                if (project.milestones.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(labels.emptyMilestones,
                        style: theme.textTheme.bodySmall?.copyWith(color: cs.outline)),
                  )
                else
                  ...project.milestones.map((m) => _MilestoneTile(
                        milestone: m,
                        onToggle: () {
                          m.status = m.status == 1 ? 0 : 1;
                          provider.saveProject(project);
                        },
                        onDelete: () => _confirmSubDelete(
                          context,
                          labels,
                          labels.deleteMilestoneTitle,
                          m.title,
                          () {
                            project.milestones.removeWhere((x) => x.id == m.id);
                            provider.saveProject(project);
                          },
                        ),
                      )),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // ── 任务 ──
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${labels.labelTasks} (${project.doneTaskCount}/${project.taskCount})',
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add),
                      tooltip: labels.labelAddTask,
                      onPressed: () => _showAddTaskDialog(context, labels, project, memberProvider),
                    ),
                  ],
                ),
                if (project.tasks.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(labels.emptyTasks,
                        style: theme.textTheme.bodySmall?.copyWith(color: cs.outline)),
                  )
                else
                  ...project.tasks.map((t) => _TaskTile(
                        task: t,
                        assigneeName: memberProvider.findById(t.assigneeId)?.name,
                        labels: labels,
                        onCycleStatus: () {
                          t.status = (t.status + 1) % 3;
                          provider.saveProject(project);
                        },
                        onDelete: () => _confirmSubDelete(
                          context,
                          labels,
                          labels.deleteTaskTitle,
                          t.title,
                          () {
                            project.tasks.removeWhere((x) => x.id == t.id);
                            provider.saveProject(project);
                          },
                        ),
                      )),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(
      BuildContext context, OrgLabels labels, Project project) async {
    final ok = await showConfirmDialog(
      context,
      title: labels.deleteProjectTitle,
      message: labels.confirmDeleteMsg
          .replaceAll('{type}', labels.labelProjectName)
          .replaceAll('{name}', project.name),
      confirmText: labels.confirmDelete,
      cancelText: labels.labelSwitchCancel,
    );
    if (!ok || !context.mounted) return;
    await context.read<ProjectProvider>().deleteProject(project.id);
    if (context.mounted) context.pop();
  }

  Future<void> _confirmSubDelete(
    BuildContext context,
    OrgLabels labels,
    String title,
    String name,
    VoidCallback onConfirm,
  ) async {
    final ok = await showConfirmDialog(
      context,
      title: title,
      message: labels.confirmDeleteMsg
          .replaceAll('{type}', labels.labelTasks)
          .replaceAll('{name}', name),
      confirmText: labels.confirmDelete,
      cancelText: labels.labelSwitchCancel,
    );
    if (ok) onConfirm();
  }

  void _showTransitionDialog(
      BuildContext context, OrgLabels labels, Project project) {
    final targets = _nextStatuses(project.status);
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(labels.labelStatusTransition),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                StatusBadge(
                  label: _statusLabel(labels, project.status),
                  variant: _statusVariant(project.status),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(Icons.arrow_forward, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final s in targets)
              ListTile(
                title: Text(_statusLabel(labels, s)),
                trailing: const Icon(Icons.chevron_right, size: 20),
                onTap: () {
                  Navigator.pop(dialogContext);
                  _confirmTransition(context, labels, project, s);
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmTransition(
      BuildContext context, OrgLabels labels, Project project, int target) async {
    final ok = await showConfirmDialog(
      context,
      title: labels.labelStatusTransition,
      message: labels.labelConfirmTransition
          .replaceAll('{status}', _statusLabel(labels, target)),
      confirmText: labels.saveButton,
      cancelText: labels.labelSwitchCancel,
    );
    if (ok) {
      if (!context.mounted) return;
      await context.read<ProjectProvider>().updateStatus(project.id, target);
    }
  }

  Future<void> _showAddMilestoneDialog(
      BuildContext context, OrgLabels labels, Project project) async {
    final titleController = TextEditingController();
    DateTime? dueDate;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: Text(labels.labelAddMilestone),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                autofocus: true,
                decoration: InputDecoration(labelText: labels.labelName),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(dueDate == null
                    ? '${labels.labelDueDate}: --'
                    : '${labels.labelDueDate}: ${formatDate(dueDate!)}'),
                trailing: const Icon(Icons.event_outlined, size: 20),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: dialogContext,
                    initialDate: dueDate ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime(2040),
                  );
                  if (picked != null) {
                    setDialogState(() => dueDate = picked);
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(labels.labelSwitchCancel),
            ),
            FilledButton(
              onPressed: () {
                final title = titleController.text.trim();
                if (title.isEmpty) return;
                final milestone = ProjectMilestone(
                  id: ProjectProvider.nextMilestoneId(project),
                  title: title,
                  dueDate: dueDate,
                );
                context.read<ProjectProvider>().addMilestone(project.id, milestone);
                Navigator.pop(dialogContext);
              },
              child: Text(labels.saveButton),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showAddTaskDialog(BuildContext context, OrgLabels labels,
      Project project, MemberProvider memberProvider) async {
    final titleController = TextEditingController();
    String? assigneeId;
    DateTime? dueDate;
    var priority = kPriorityMedium;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: Text(labels.labelAddTask),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  autofocus: true,
                  decoration: InputDecoration(labelText: '${labels.labelName} *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: assigneeId,
                  decoration: InputDecoration(labelText: labels.labelAssignee),
                  hint: Text(labels.labelAssignee),
                  items: memberProvider.members.map((Member m) {
                    return DropdownMenuItem(value: m.id, child: Text(m.name));
                  }).toList(),
                  onChanged: (v) => setDialogState(() => assigneeId = v),
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(dueDate == null
                      ? '${labels.labelDueDate}: --'
                      : '${labels.labelDueDate}: ${formatDate(dueDate!)}'),
                  trailing: const Icon(Icons.event_outlined, size: 20),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: dialogContext,
                      initialDate: dueDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2040),
                    );
                    if (picked != null) {
                      setDialogState(() => dueDate = picked);
                    }
                  },
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(labels.labelPriority,
                        style: Theme.of(dialogContext).textTheme.bodySmall),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SegmentedButton<int>(
                        segments: [
                          ButtonSegment(
                              value: kPriorityLow,
                              label: Text(labels.labelPriorityLow)),
                          ButtonSegment(
                              value: kPriorityMedium,
                              label: Text(labels.labelPriorityMedium)),
                          ButtonSegment(
                              value: kPriorityHigh,
                              label: Text(labels.labelPriorityHigh)),
                        ],
                        selected: {priority},
                        onSelectionChanged: (s) =>
                            setDialogState(() => priority = s.first),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(labels.labelSwitchCancel),
            ),
            FilledButton(
              onPressed: () {
                final title = titleController.text.trim();
                if (title.isEmpty) return;
                final task = ProjectTask(
                  id: ProjectProvider.nextTaskId(project),
                  title: title,
                  assigneeId: assigneeId ?? '',
                  dueDate: dueDate,
                  priority: priority,
                );
                context.read<ProjectProvider>().addTask(project.id, task);
                Navigator.pop(dialogContext);
              },
              child: Text(labels.saveButton),
            ),
          ],
        ),
      ),
    );
  }

  static String _statusLabel(OrgLabels labels, int status) =>
      switch (status) {
        kProjectPreparing => labels.statusPreparing,
        kProjectActive => labels.statusInProgress,
        kProjectPaused => labels.statusPaused,
        kProjectCompleted => labels.statusCompleted,
        _ => labels.statusAll,
      };

  static BadgeVariant _statusVariant(int status) => switch (status) {
        kProjectPreparing => BadgeVariant.info,
        kProjectActive => BadgeVariant.success,
        kProjectPaused => BadgeVariant.warning,
        kProjectCompleted => BadgeVariant.neutral,
        _ => BadgeVariant.neutral,
      };

  static List<int> _nextStatuses(int status) => switch (status) {
        kProjectPreparing => const [kProjectActive],
        kProjectActive => const [kProjectPaused, kProjectCompleted],
        kProjectPaused => const [kProjectActive, kProjectCompleted],
        kProjectCompleted => const [kProjectActive],
        _ => const [],
      };
}

class _ProjectFinanceSection extends StatefulWidget {
  const _ProjectFinanceSection({
    required this.projectId,
    required this.budget,
  });

  final String projectId;
  final double budget;

  @override
  State<_ProjectFinanceSection> createState() => _ProjectFinanceSectionState();
}

class _ProjectFinanceSectionState extends State<_ProjectFinanceSection> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = context.read<FinanceProvider>();
      p.loadStats(projectId: widget.projectId);
      p.loadProjectRecords(widget.projectId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final provider = context.watch<FinanceProvider>();
    final stats = provider.stats;
    final records = provider.projectRecords;

    return AppCard(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    labels.projectFinance,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => context.push(
                    '/finance/new?projectId=${widget.projectId}',
                  ),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(labels.linkRecord),
                ),
              ],
            ),
            Row(
              children: [
                _FinanceStat(
                  label: labels.budgetLabel,
                  value: '¥${formatAmount(widget.budget)}',
                  color: cs.primary,
                ),
                _FinanceStat(
                  label: labels.incomeLabel,
                  value: '¥${formatAmount(stats.income)}',
                  color: Colors.green.shade700,
                ),
                _FinanceStat(
                  label: labels.spentLabel,
                  value: '¥${formatAmount(stats.expense)}',
                  color: Colors.red.shade700,
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (records.isEmpty)
              Text(
                '暂无财务记录',
                style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
              )
            else
              for (final r in records.take(5))
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: Text(r.summary,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(r.categoryLabel),
                  trailing: Text(
                    '¥${formatAmount(r.amount)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: r.type == kFinanceIncome
                          ? Colors.green.shade700
                          : cs.primary,
                    ),
                  ),
                  onTap: () => context.push('/finance/${r.id}'),
                ),
          ],
        ),
      ),
    );
  }
}

class _FinanceStat extends StatelessWidget {
  const _FinanceStat({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _MilestoneTile extends StatelessWidget {
  const _MilestoneTile({
    required this.milestone,
    required this.onToggle,
    required this.onDelete,
  });

  final ProjectMilestone milestone;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: Checkbox(
        value: milestone.status == 1,
        onChanged: (_) => onToggle(),
      ),
      title: Text(
        milestone.title,
        style: TextStyle(
          decoration: milestone.status == 1 ? TextDecoration.lineThrough : null,
        ),
      ),
      subtitle: milestone.dueDate == null
          ? null
          : Text(formatDate(milestone.dueDate!)),
      trailing: IconButton(
        icon: const Icon(Icons.delete_outline, size: 20),
        onPressed: onDelete,
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({
    required this.task,
    required this.assigneeName,
    required this.labels,
    required this.onCycleStatus,
    required this.onDelete,
  });

  final ProjectTask task;
  final String? assigneeName;
  final OrgLabels labels;
  final VoidCallback onCycleStatus;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: InkWell(
        onTap: onCycleStatus,
        borderRadius: BorderRadius.circular(10),
        child: StatusBadge(
          label: switch (task.status) {
            kTaskTodo => labels.labelTaskTodo,
            kTaskDoing => labels.labelTaskDoing,
            _ => labels.labelTaskDone,
          },
          variant: switch (task.status) {
            kTaskTodo => BadgeVariant.neutral,
            kTaskDoing => BadgeVariant.info,
            _ => BadgeVariant.success,
          },
        ),
      ),
      title: Text(
        task.title,
        style: TextStyle(
          decoration: task.status == kTaskDone ? TextDecoration.lineThrough : null,
        ),
      ),
      subtitle: Text(
        [
          if (assigneeName != null && assigneeName!.isNotEmpty) assigneeName!,
          if (task.dueDate != null) formatDate(task.dueDate!),
        ].join(' · '),
        style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          StatusBadge(
            label: switch (task.priority) {
              kPriorityLow => labels.labelPriorityLow,
              kPriorityHigh => labels.labelPriorityHigh,
              _ => labels.labelPriorityMedium,
            },
            variant: switch (task.priority) {
              kPriorityHigh => BadgeVariant.warning,
              _ => BadgeVariant.neutral,
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}
