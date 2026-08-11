import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/finance_record.dart';
import '../../providers/finance_provider.dart';
import '../../providers/organization_provider.dart';
import '../../utils/date_format.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';

class FinanceListPage extends StatefulWidget {
  const FinanceListPage({super.key});

  @override
  State<FinanceListPage> createState() => _FinanceListPageState();
}

class _FinanceListPageState extends State<FinanceListPage> {
  String? _statusFilter;
  String? _lastOrgId;
  bool _orgWatched = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _reload());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_orgWatched) return;
    _orgWatched = true;
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
      _statusFilter = null;
      _reload();
    }
  }

  void _reload() {
    final p = context.read<FinanceProvider>();
    p.loadRecords(status: _statusFilter);
    p.loadStats();
    p.loadTasks();
    if (context.read<OrganizationProvider>().currentOrgRole == 'admin') {
      p.loadFlows();
    }
  }

  Future<void> _onRefresh() async {
    _reload();
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final provider = context.watch<FinanceProvider>();
    final isAdmin =
        context.watch<OrganizationProvider>().currentOrgRole == 'admin';

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.title),
        actions: [
          IconButton(
            tooltip: labels.myTasks,
            icon: Badge(
              label: Text('${provider.taskCount}'),
              isLabelVisible: provider.taskCount > 0,
              child: const Icon(Icons.inbox_outlined),
            ),
            onPressed: () => context.push('/finance/tasks'),
          ),
          if (isAdmin)
            IconButton(
              tooltip: labels.approvalFlows,
              icon: const Icon(Icons.account_tree_outlined),
              onPressed: () => context.push('/finance/flows'),
            ),
          if (labels.isFullAccounting)
            PopupMenuButton<String>(
              tooltip: '会计',
              icon: const Icon(Icons.menu_book_outlined),
              onSelected: (v) {
                if (v == 'reports') {
                  context.push('/finance/reports');
                } else if (v == 'opening') {
                  context.push('/finance/opening');
                } else if (v == 'close') {
                  _closePeriod(context, labels);
                } else if (v == 'unclose') {
                  _unclosePeriod(context, labels);
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'reports',
                  child: Text('财务报表'),
                ),
                if (isAdmin) ...[
                  const PopupMenuItem(
                    value: 'opening',
                    child: Text('期初余额'),
                  ),
                  const PopupMenuItem(
                    value: 'close',
                    child: Text('期末结账'),
                  ),
                  const PopupMenuItem(
                    value: 'unclose',
                    child: Text('反结账'),
                  ),
                ],
              ],
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 88),
          children: [
            _SummaryCard(stats: provider.stats, labels: labels),
            const SizedBox(height: 12),
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                children: [
                  _FilterChip(
                    label: '全部',
                    selected: _statusFilter == null,
                    onTap: () => setState(() {
                      _statusFilter = null;
                      _reload();
                    }),
                  ),
                  _FilterChip(
                    label: labels.statusApproving,
                    selected: _statusFilter == kFinanceApproving,
                    onTap: () => setState(() {
                      _statusFilter = kFinanceApproving;
                      _reload();
                    }),
                  ),
                  _FilterChip(
                    label: labels.statusApproved,
                    selected: _statusFilter == kFinanceApproved,
                    onTap: () => setState(() {
                      _statusFilter = kFinanceApproved;
                      _reload();
                    }),
                  ),
                  _FilterChip(
                    label: labels.statusRejected,
                    selected: _statusFilter == kFinanceRejected,
                    onTap: () => setState(() {
                      _statusFilter = kFinanceRejected;
                      _reload();
                    }),
                  ),
                ],
              ),
            ),
            if (provider.records.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 80),
                child: AppEmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: '暂无财务单据',
                ),
              )
            else
              ...provider.records.map((r) => _RecordTile(
                    record: r,
                    labels: labels,
                    onTap: () => context.push('/finance/${r.id}'),
                  )),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/finance/new'),
        icon: const Icon(Icons.add),
        label: Text(labels.addRecord),
      ),
    );
  }

  Future<void> _closePeriod(BuildContext context, FinanceLabels labels) async {
    var year = DateTime.now().year;
    final provider = context.read<FinanceProvider>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('期末结账'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('将所选年度收入、费用结转至净资产，并生成结转凭证。'),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: year,
                decoration: const InputDecoration(labelText: '年度'),
                items: [
                  for (var y = DateTime.now().year - 5;
                      y <= DateTime.now().year;
                      y++)
                    DropdownMenuItem(value: y, child: Text('$y 年')),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => year = v);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('结账'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    try {
      final res = await provider.closePeriod('$year');
      if (!context.mounted) return;
      if (res['alreadyClosed'] == true) {
        showToast(context, '$year 年度已结账');
      } else if (res['nothingToClose'] == true) {
        showToast(context, '$year 年度无收支可结转');
      } else {
        showToast(context,
            '$year 年度结转完成：收入 ¥${res['income']} 费用 ¥${res['expense']}');
      }
      provider.loadRecords(status: _statusFilter);
      provider.loadStats();
      provider.loadTasks();
    } catch (e) {
      if (!context.mounted) return;
      showToast(context, '$e');
    }
  }

  Future<void> _unclosePeriod(BuildContext context, FinanceLabels labels) async {
    var year = DateTime.now().year;
    final provider = context.read<FinanceProvider>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('反结账'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('将删除所选年度的结转凭证，恢复该年度凭证录入权限。'),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: year,
                decoration: const InputDecoration(labelText: '年度'),
                items: [
                  for (var y = DateTime.now().year - 5;
                      y <= DateTime.now().year;
                      y++)
                    DropdownMenuItem(value: y, child: Text('$y 年')),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => year = v);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('反结账'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await provider.unclosePeriod('$year');
      if (!context.mounted) return;
      showToast(context, '$year 年度已反结账');
      provider.loadRecords(status: _statusFilter);
      provider.loadStats();
      provider.loadTasks();
    } catch (e) {
      if (!context.mounted) return;
      showToast(context, '$e');
    }
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.stats, required this.labels});

  final FinanceStats stats;
  final FinanceLabels labels;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _SummaryItem(
                  label: labels.incomeLabel,
                  value: formatAmount(stats.income),
                  color: Colors.green.shade700,
                ),
                const SizedBox(width: 12),
                _SummaryItem(
                  label: labels.expenseLabel,
                  value: formatAmount(stats.expense),
                  color: Colors.red.shade700,
                ),
                const SizedBox(width: 12),
                _SummaryItem(
                  label: labels.balanceLabel,
                  value: formatAmount(stats.balance),
                  color: theme.colorScheme.primary,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              labels.incomeExpenseNote,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.outline),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  const _SummaryItem({
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
          const SizedBox(height: 4),
          Text(
            '¥$value',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecordTile extends StatelessWidget {
  const _RecordTile({
    required this.record,
    required this.labels,
    required this.onTap,
  });

  final FinanceRecord record;
  final FinanceLabels labels;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isIncome = record.type == kFinanceIncome;
    final isExpense = record.type == kFinanceExpense;
    final color = isIncome
        ? Colors.green.shade700
        : isExpense
            ? Colors.red.shade700
            : theme.colorScheme.primary;
    final variant = record.isApproving
        ? BadgeVariant.warning
        : record.isApproved
            ? BadgeVariant.success
            : BadgeVariant.error;
    final statusText = record.isApproving
        ? labels.statusApproving
        : record.isApproved
            ? labels.statusApproved
            : labels.statusRejected;

    return Card(
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.12),
          child: Icon(
            isExpense
                ? Icons.arrow_upward
                : isIncome
                    ? Icons.arrow_downward
                    : Icons.receipt_long,
            size: 20,
            color: color,
          ),
        ),
        title: Text(record.summary, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          '${record.categoryLabel} · ${formatDate(record.date)}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isIncome ? '+' : isExpense ? '-' : ''}¥${formatAmount(record.amount)}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
            const SizedBox(height: 3),
            StatusBadge(label: statusText, variant: variant),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? cs.primary : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(20),
            border: selected
                ? null
                : Border.all(color: cs.outlineVariant),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? cs.onPrimary : cs.onSurface,
              fontSize: 13,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }
}
