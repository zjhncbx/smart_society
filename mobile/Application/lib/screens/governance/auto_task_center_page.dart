import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/governance.dart';
import '../../providers/governance_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 自动任务中心（WF-03）：系统自动生成任务统一管理，可解释来源规则并闭环处理。
class AutoTaskCenterPage extends StatefulWidget {
  const AutoTaskCenterPage({super.key});

  @override
  State<AutoTaskCenterPage> createState() => _AutoTaskCenterPageState();
}

class _AutoTaskCenterPageState extends State<AutoTaskCenterPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GovernanceProvider>().load();
    });
  }

  Future<void> _runRules() async {
    final provider = context.read<GovernanceProvider>();
    if (provider.running) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await provider.runRules();
      final tasks = result['tasks'];
      final risks = result['risks'];
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            '规则运行完成：新增任务 ${_val(tasks, 'created')} 项，新增风险/预警 ${_val(risks, 'created')} 项',
          ),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('运行失败：$e')));
    }
  }

  int _val(dynamic map, String key) {
    if (map is Map) {
      return (map[key] as num?)?.toInt() ?? 0;
    }
    return 0;
  }

  Future<void> _act(String id, String action) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<GovernanceProvider>().actTask(id, action);
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            action == 'done' ? '任务已完成' : action == 'cancel' ? '任务已取消' : '任务已重开',
          ),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('操作失败：$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<GovernanceProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('自动任务')),
      body: RefreshIndicator(
        onRefresh: () => provider.load(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _HeaderCard(
              openCount: provider.openTaskCount,
              running: provider.running,
              onRun: _runRules,
              onOpenApprovals: () => context.go('/finance/tasks'),
              onOpenRisks: () => context.go('/governance/risks'),
            ),
            const SizedBox(height: 16),
            Text(
              '待处理（${provider.openTasks.length}）',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            if (provider.openTasks.isEmpty)
              const AppEmptyState(
                icon: Icons.auto_awesome_outlined,
                title: '暂无自动任务',
                subtitle: '运行规则后，系统将根据逾期、进度、预算、数据质量等自动生成任务',
              )
            else
              for (final task in provider.openTasks)
                _TaskCard(
                  task: task,
                  onDone: () => _act(task.id, 'done'),
                  onCancel: () => _act(task.id, 'cancel'),
                ),
            if (provider.recentTasks.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                '最近完成',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              for (final task in provider.recentTasks.take(10))
                _DoneTaskTile(
                  task: task,
                  onReopen: () => _act(task.id, 'reopen'),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.openCount,
    required this.running,
    required this.onRun,
    required this.onOpenApprovals,
    required this.onOpenRisks,
  });

  final int openCount;
  final bool running;
  final VoidCallback onRun;
  final VoidCallback onOpenApprovals;
  final VoidCallback onOpenRisks;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    return AppCard(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '自动任务待处理 $openCount 项',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: running ? null : onRun,
                  icon: running
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.auto_awesome, size: 18),
                  label: Text(running ? '运行中…' : '运行规则'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _LinkTile(
                    icon: Icons.fact_check_outlined,
                    color: const Color(0xFF3370FF),
                    label: '审批待办',
                    onTap: onOpenApprovals,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _LinkTile(
                    icon: Icons.warning_amber_rounded,
                    color: const Color(0xFFF54A45),
                    label: '风险预警',
                    onTap: onOpenRisks,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '自动任务由规则引擎生成，来源规则与触发原因均可追溯，完成后系统自动重新校验。',
              style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color,
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
    required this.onDone,
    required this.onCancel,
  });

  final AutoTask task;
  final VoidCallback onDone;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final priorityColor = switch (task.priority) {
      'high' => const Color(0xFFF54A45),
      'low' => const Color(0xFF8A9099),
      _ => const Color(0xFFFF8800),
    };
    final overdue = task.isOverdue;
    return AppCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 14,
                  decoration: BoxDecoration(
                    color: priorityColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    task.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (task.escalationLevel > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF54A45).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '已升级 L${task.escalationLevel}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFFF54A45),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              task.description,
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _Chip(
                  label: task.sourceRuleId,
                  color: const Color(0xFF7B61FF),
                ),
                if (task.assigneeName.isNotEmpty)
                  _Chip(
                    label: '负责人：${task.assigneeName}',
                    color: const Color(0xFF3370FF),
                  ),
                if (task.slaDeadline != null)
                  _Chip(
                    label: overdue
                        ? 'SLA 已逾期'
                        : 'SLA ${formatDate(task.slaDeadline!)}',
                    color: overdue
                        ? const Color(0xFFF54A45)
                        : const Color(0xFF8A9099),
                  ),
                _Chip(
                  label: autoTaskPriorityLabel(task.priority),
                  color: priorityColor,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: onCancel,
                  child: const Text('取消'),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: onDone,
                  style: FilledButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  ),
                  child: const Text('完成'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DoneTaskTile extends StatelessWidget {
  const _DoneTaskTile({required this.task, required this.onReopen});

  final AutoTask task;
  final VoidCallback onReopen;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return AppCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        leading: const Icon(Icons.check_circle_outline,
            color: Color(0xFF00B96B)),
        title: Text(
          task.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14),
        ),
        subtitle: Text(
          '${task.completedByName.isEmpty ? '系统' : task.completedByName}'
          ' · ${task.completedAt != null ? formatDateTime(task.completedAt!) : ''}'
          ' · ${task.sourceRuleId}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
        ),
        trailing: TextButton(
          onPressed: onReopen,
          child: const Text('重开'),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
