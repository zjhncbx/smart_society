import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/business_event.dart';
import '../../models/project.dart';
import '../../providers/finance_provider.dart';
import '../../providers/event_provider.dart';
import '../../providers/data_quality_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/sync_provider.dart';
import '../../utils/date_format.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_theme.dart';

/// 工作台首页：问候 + 统计 + 快捷入口 + 最近动态（钉钉/飞书风格）
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? _lastOrgId;
  bool _watching = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refresh());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_watching) return;
    _watching = true;
    final org = context.read<OrganizationProvider>();
    _lastOrgId = org.currentOrgId;
    org.addListener(_onOrgChanged);
  }

  @override
  void dispose() {
    context.read<OrganizationProvider>().removeListener(_onOrgChanged);
    super.dispose();
  }

  void _onOrgChanged() {
    final orgId = context.read<OrganizationProvider>().currentOrgId;
    if (orgId != _lastOrgId) {
      _lastOrgId = orgId;
      _refresh();
    }
  }

  Future<void> _refresh() async {
    final orgId = context.read<OrganizationProvider>().currentOrgId;
    final finance = context.read<FinanceProvider>();
    finance.loadStats();
    finance.loadTasks();
    context.read<EventProvider>().load();
    context.read<DataQualityProvider>().load();
    if (orgId != null && orgId.isNotEmpty) {
      await SyncProvider.instance.pullAndRefresh(orgId);
    }
    if (mounted) setState(() {});
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 6) return '夜深了';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    final org = context.watch<OrganizationProvider>().currentOrg;
    final members = context.watch<MemberProvider>().totalCount;
    final projects = context.watch<ProjectProvider>().projects;
    final activeProjects = projects.where((p) => p.status == kProjectActive).toList();
    final unread = context.watch<NoticeProvider>().unreadCount;
    final notices = context.watch<NoticeProvider>().sortedNotices.take(3).toList();
    final taskCount = context.watch<FinanceProvider>().taskCount;
    final finance = context.watch<FinanceProvider>();
    final events = context.watch<EventProvider>().recentEvents;
    final dq = context.watch<DataQualityProvider>();
    final orgId = context.watch<OrganizationProvider>().currentOrgId ?? '';
    final binding = context.watch<SettingsProvider>().memberBinding(orgId);
    final myTasks = [
      for (final p in projects)
        for (final t in p.tasks)
          if (binding != null && t.assigneeId == binding.memberId) t,
    ];
    final today = DateTime.now();
    final startOfToday = DateTime(today.year, today.month, today.day);
    int overdue = 0, dueToday = 0, dueWeek = 0;
    for (final t in myTasks) {
      if (t.status == kTaskDone || t.dueDate == null) continue;
      final due = DateTime(t.dueDate!.year, t.dueDate!.month, t.dueDate!.day);
      final diff = due.difference(startOfToday).inDays;
      if (diff < 0) {
        overdue++;
      } else if (diff == 0) {
        dueToday++;
      } else if (diff <= 7) {
        dueWeek++;
      }
    }
    final projectExpense = {
      for (final p in finance.stats.projects) p.projectId: p.expense,
    };
    final budgetWarnings = activeProjects
        .where((p) =>
            p.budget > 0 &&
            (projectExpense[p.id] ?? 0) / p.budget >= 0.9)
        .toList();

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
        children: [
          Text(
            '${_greeting()}，${org?.name ?? ''}',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '今天也要元气满满地组织活动',
            style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
          ),
          const SizedBox(height: 16),
          // 统计卡
          Row(
            children: [
              _StatCard(
                label: '成员总数',
                value: '$members',
                icon: Icons.people_outline,
                color: const Color(0xFF3370FF),
                onTap: () => context.go('/members'),
              ),
              const SizedBox(width: 12),
              _StatCard(
                label: '进行中项目',
                value: '${activeProjects.length}',
                icon: Icons.task_alt_outlined,
                color: const Color(0xFF00B96B),
                onTap: () => context.go('/projects'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _StatCard(
                label: '未读通知',
                value: '$unread',
                icon: Icons.campaign_outlined,
                color: const Color(0xFFFF8800),
                onTap: () => context.go('/notices'),
              ),
              const SizedBox(width: 12),
              _StatCard(
                label: '我的待办',
                value: '$taskCount',
                icon: Icons.inbox_outlined,
                color: const Color(0xFFF54A45),
                onTap: () => context.go('/finance/tasks'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // 我的任务
          _MyTasksCard(
            binding: binding,
            overdue: overdue,
            dueToday: dueToday,
            dueWeek: dueWeek,
            onTap: () => context.go('/projects'),
          ),
          const SizedBox(height: 12),
          // 财务概览
          _FinanceOverviewCard(stats: finance.stats),
          if (budgetWarnings.isNotEmpty) ...[
            const SizedBox(height: 12),
            _BudgetWarningsCard(
              warnings: budgetWarnings,
              projectExpense: projectExpense,
              onTap: (id) => context.go('/projects/$id'),
            ),
          ],
          const SizedBox(height: 12),
          _DataQualityCard(
            score: dq.snapshot.score,
            openCount: dq.openTotal,
            hasSnapshot: dq.snapshot.checkedAt != null,
            onTap: () => context.go('/quality'),
          ),
          const SizedBox(height: 20),
          // 快捷入口
          AppCard(
            margin: EdgeInsets.zero,
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Row(
                  children: [
                    _QuickAction(
                      label: labels.tabMembers,
                      icon: Icons.people_outline,
                      color: const Color(0xFF3370FF),
                      onTap: () => context.go('/members'),
                    ),
                    _QuickAction(
                      label: labels.tabProjects,
                      icon: Icons.task_alt_outlined,
                      color: const Color(0xFF00B96B),
                      onTap: () => context.go('/projects'),
                    ),
                    _QuickAction(
                      label: labels.tabNotices,
                      icon: Icons.campaign_outlined,
                      color: const Color(0xFFFF8800),
                      onTap: () => context.go('/notices'),
                    ),
                    _QuickAction(
                      label: labels.tabFinance,
                      icon: Icons.account_balance_wallet_outlined,
                      color: const Color(0xFF7B61FF),
                      onTap: () => context.go('/finance'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _QuickAction(
                      label: '审批待办',
                      icon: Icons.fact_check_outlined,
                      color: const Color(0xFFF54A45),
                      onTap: () => context.go('/finance/tasks'),
                    ),
                    _QuickAction(
                      label: '设置',
                      icon: Icons.settings_outlined,
                      color: const Color(0xFF8A9099),
                      onTap: () => context.go('/settings'),
                    ),
                    _QuickAction(
                      label: '事件流',
                      icon: Icons.timeline_outlined,
                      color: const Color(0xFF13C2C2),
                      onTap: () => context.go('/events'),
                    ),
                    const _QuickAction(
                      label: '',
                      icon: Icons.circle,
                      color: Colors.transparent,
                      onTap: null,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // 组织动态（事件流）
          Row(
            children: [
              Expanded(
                child: Text(
                  '组织动态',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/events'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('查看全部'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          if (events.isEmpty)
            AppCard(
              margin: EdgeInsets.zero,
              child: Text(
                '暂无事件，成员、项目、财务等业务动作将在这里形成组织事件流',
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            )
          else
            for (final ev in events)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.go('/events'),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: _eventColor(ev.entityType).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _eventIcon(ev.entityType),
                        size: 18,
                        color: _eventColor(ev.entityType),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ev.entityName.isEmpty
                                ? '${eventTypeLabel(ev.eventType)}${entityTypeLabel(ev.entityType)}'
                                : '「${ev.entityName}」${eventTypeLabel(ev.eventType)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${ev.actorName.isEmpty ? '系统' : ev.actorName} · ${formatRelative(ev.occurredAt)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: appTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ),
          const SizedBox(height: 12),
          // 最近动态
          Text(
            '进行中项目',
            style: theme.textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (activeProjects.isEmpty)
            AppCard(
              margin: EdgeInsets.zero,
              child: Text(
                '暂无进行中的项目',
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            )
          else
            for (final p in activeProjects.take(3))
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.go('/projects/${p.id}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            p.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          '${p.progress}%',
                          style: TextStyle(
                            fontSize: 13,
                            color: appTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: p.progress / 100,
                        minHeight: 6,
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      ),
                    ),
                  ],
                ),
              ),
          const SizedBox(height: 12),
          Text(
            '最新通知',
            style: theme.textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (notices.isEmpty)
            AppCard(
              margin: EdgeInsets.zero,
              child: Text(
                '暂无通知',
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            )
          else
            for (final n in notices)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.go('/notices/${n.id}'),
                child: Row(
                  children: [
                    if (!n.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF54A45),
                          shape: BoxShape.circle,
                        ),
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            formatDate(n.publishTime),
                            style: TextStyle(
                              fontSize: 12,
                              color: appTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return Expanded(
      child: AppCard(
        margin: EdgeInsets.zero,
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 22, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: appTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MyTasksCard extends StatelessWidget {
  const _MyTasksCard({
    required this.binding,
    required this.overdue,
    required this.dueToday,
    required this.dueWeek,
    required this.onTap,
  });

  final ({String memberId, String memberName})? binding;
  final int overdue;
  final int dueToday;
  final int dueWeek;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    return AppCard(
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '我的任务${binding != null ? '（${binding!.memberName}）' : ''}',
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (binding == null)
            Text(
              '尚未绑定会员，请先在「我的」中绑定身份',
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            )
          else
            Row(
              children: [
                _TaskStat(
                  label: '已逾期',
                  value: '$overdue',
                  color: const Color(0xFFF54A45),
                ),
                _TaskStat(
                  label: '今日到期',
                  value: '$dueToday',
                  color: const Color(0xFFFF8800),
                ),
                _TaskStat(
                  label: '7 天内',
                  value: '$dueWeek',
                  color: theme.colorScheme.primary,
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _TaskStat extends StatelessWidget {
  const _TaskStat({
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
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

class _FinanceOverviewCard extends StatelessWidget {
  const _FinanceOverviewCard({required this.stats});

  final FinanceStats stats;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return AppCard(
      margin: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '财务概览',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _FinanceStat(
                label: '收入',
                value: formatAmount(stats.income),
                color: const Color(0xFF00B96B),
              ),
              _FinanceStat(
                label: '支出',
                value: formatAmount(stats.expense),
                color: const Color(0xFFF54A45),
              ),
              _FinanceStat(
                label: '结余',
                value: formatAmount(stats.balance),
                color: Theme.of(context).colorScheme.primary,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '已生效单据汇总，详见财务模块',
            style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
          ),
        ],
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
          const SizedBox(height: 2),
          Text(
            '¥$value',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _BudgetWarningsCard extends StatelessWidget {
  const _BudgetWarningsCard({
    required this.warnings,
    required this.projectExpense,
    required this.onTap,
  });

  final List<Project> warnings;
  final Map<String, double> projectExpense;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppCard(
      margin: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_rounded,
                  size: 18, color: const Color(0xFFFF8800)),
              const SizedBox(width: 6),
              const Text(
                '预算预警',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final p in warnings)
            InkWell(
              onTap: () => onTap(p.id),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        p.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                    Text(
                      '${((projectExpense[p.id] ?? 0) / p.budget * 100).round()}%',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DataQualityCard extends StatelessWidget {
  const _DataQualityCard({
    required this.score,
    required this.openCount,
    required this.hasSnapshot,
    required this.onTap,
  });

  final int score;
  final int openCount;
  final bool hasSnapshot;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final color = score >= 90
        ? const Color(0xFF00B96B)
        : score >= 70
            ? const Color(0xFFFF8800)
            : const Color(0xFFF54A45);
    return AppCard(
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.verified_outlined, size: 22, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '数据治理健康度',
                    style: TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasSnapshot
                        ? (openCount > 0
                            ? '$score 分 · $openCount 项数据问题待处理'
                            : '$score 分 · 数据质量良好')
                        : '尚未运行数据质量检查',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, size: 18, color: appTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 24, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

IconData _eventIcon(String entityType) {
  switch (entityType) {
    case 'member':
      return Icons.people_outline;
    case 'project':
      return Icons.task_alt_outlined;
    case 'task':
      return Icons.check_circle_outline;
    case 'notice':
      return Icons.campaign_outlined;
    case 'finance':
      return Icons.account_balance_wallet_outlined;
    case 'approval':
      return Icons.fact_check_outlined;
    case 'organization':
      return Icons.business_outlined;
    default:
      return Icons.timeline_outlined;
  }
}

Color _eventColor(String entityType) {
  switch (entityType) {
    case 'member':
      return const Color(0xFF3370FF);
    case 'project':
      return const Color(0xFF00B96B);
    case 'task':
      return const Color(0xFF13C2C2);
    case 'notice':
      return const Color(0xFFFF8800);
    case 'finance':
      return const Color(0xFF7B61FF);
    case 'approval':
      return const Color(0xFFF54A45);
    case 'organization':
      return const Color(0xFF1F5FBF);
    default:
      return const Color(0xFF8A9099);
  }
}
