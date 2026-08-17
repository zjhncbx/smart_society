import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/project.dart';
import '../../providers/finance_provider.dart';
import '../../providers/governance_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/settings_provider.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_theme.dart';

/// 统一待办（APP-02）：审批待办 + 自动任务 + 我的项目任务。
class TodoCenterPage extends StatefulWidget {
  const TodoCenterPage({super.key});

  @override
  State<TodoCenterPage> createState() => _TodoCenterPageState();
}

class _TodoCenterPageState extends State<TodoCenterPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().loadTasks();
      context.read<GovernanceProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final gov = context.watch<GovernanceProvider>();
    final projects = context.watch<ProjectProvider>().projects;
    final orgId = context.watch<OrganizationProvider>().currentOrgId ?? '';
    final binding = context.watch<SettingsProvider>().memberBinding(orgId);
    final myTasks = <({Project project, ProjectTask task})>[];
    if (binding != null) {
      for (final p in projects) {
        for (final t in p.tasks) {
          if (t.assigneeId == binding.memberId && t.status != kTaskDone) {
            myTasks.add((project: p, task: t));
          }
        }
      }
    }

    final approvalTasks = finance.tasks;
    final autoTasks = gov.openTasks;
    final total = approvalTasks.length + autoTasks.length + myTasks.length;

    return Scaffold(
      appBar: AppBar(title: const Text('待办中心')),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            context.read<FinanceProvider>().loadTasks(),
            context.read<GovernanceProvider>().load(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            AppCard(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .primary
                            .withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.inbox_outlined,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '共 $total 项待处理',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _SectionHeader(
              title: '审批待办',
              count: approvalTasks.length,
              onViewAll: () => context.go('/finance/tasks'),
            ),
            if (approvalTasks.isEmpty)
              const _EmptyHint(text: '暂无待我审批的单据')
            else
              for (final task in approvalTasks.take(8))
                AppCard(
                  margin: const EdgeInsets.only(bottom: 8),
                  onTap: () async {
                    final recordId = task.record?.id ?? task.instance.bizId;
                    if (recordId.isEmpty) return;
                    final finance = context.read<FinanceProvider>();
                    await context.push('/finance/$recordId');
                    if (mounted) finance.loadTasks();
                  },
                  child: ListTile(
                    dense: true,
                    leading: const Icon(
                      Icons.fact_check_outlined,
                      color: Color(0xFF3370FF),
                    ),
                    title: Text(
                      task.record?.summary ?? task.instance.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      '${task.node.nodeName}'
                      '${task.record != null ? ' · ¥${formatAmount(task.record!.amount)}' : ''}'
                      ' · ${task.instance.flowName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                  ),
                ),
            const SizedBox(height: 12),
            _SectionHeader(
              title: '自动任务',
              count: autoTasks.length,
              onViewAll: () => context.go('/governance/tasks'),
            ),
            if (autoTasks.isEmpty)
              const _EmptyHint(text: '暂无自动生成的任务，可在自动任务中心运行规则')
            else
              for (final task in autoTasks.take(8))
                AppCard(
                  margin: const EdgeInsets.only(bottom: 8),
                  onTap: () => context.go('/governance/tasks'),
                  child: ListTile(
                    dense: true,
                    leading: const Icon(
                      Icons.auto_awesome_outlined,
                      color: Color(0xFF7B61FF),
                    ),
                    title: Text(
                      task.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      '${task.sourceRuleId} · ${task.sourceRuleName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: task.isOverdue
                        ? const Text(
                            '已逾期',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFFF54A45),
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        : const Icon(Icons.chevron_right, size: 18),
                  ),
                ),
            const SizedBox(height: 12),
            _SectionHeader(
              title: '我的任务${binding != null ? '（${binding.memberName}）' : ''}',
              count: myTasks.length,
              onViewAll: () => context.go('/projects'),
            ),
            if (binding == null)
              const _EmptyHint(text: '尚未绑定会员，请先在「我的」中绑定身份')
            else if (myTasks.isEmpty)
              const _EmptyHint(text: '暂无指派给你的任务')
            else
              for (final item in myTasks.take(8))
                AppCard(
                  margin: const EdgeInsets.only(bottom: 8),
                  onTap: () => context.go('/projects/${item.project.id}'),
                  child: ListTile(
                    dense: true,
                    leading: const Icon(
                      Icons.task_alt_outlined,
                      color: Color(0xFF00B96B),
                    ),
                    title: Text(
                      item.task.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      '项目：${item.project.name}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.onViewAll,
  });

  final String title;
  final int count;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            '$title（$count）',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton(
          onPressed: onViewAll,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: const Text('查看全部'),
        ),
      ],
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return AppCard(
      margin: EdgeInsets.zero,
      child: Text(
        text,
        style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
      ),
    );
  }
}
