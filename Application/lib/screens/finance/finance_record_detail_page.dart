import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/approval_flow.dart';
import '../../models/approval_instance.dart';
import '../../models/finance_record.dart';
import '../../providers/finance_provider.dart';
import '../../utils/date_format.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/common.dart';

class FinanceRecordDetailPage extends StatefulWidget {
  const FinanceRecordDetailPage({super.key, required this.id});

  final String id;

  @override
  State<FinanceRecordDetailPage> createState() =>
      _FinanceRecordDetailPageState();
}

class _FinanceRecordDetailPageState extends State<FinanceRecordDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().loadDetail(widget.id);
    });
  }

  Future<void> _act(String action) async {
    final labels = FinanceLabels.forType(context.orgTypeRead);
    final provider = context.read<FinanceProvider>();
    final instance = provider.detailInstance;
    if (instance == null) return;

    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          action == 'approve'
              ? labels.approve
              : action == 'done'
                  ? labels.done
                  : labels.reject,
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 2,
          decoration: InputDecoration(
            labelText: labels.commentLabel,
            hintText: labels.commentHint,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('确定'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await provider.act(instance.id, action, comment: controller.text.trim());
      if (!mounted) return;
      showToast(context, '操作成功');
      await provider.loadDetail(widget.id);
      await provider.loadTasks();
      if (mounted) setState(() {});
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final provider = context.watch<FinanceProvider>();
    final record = provider.detailRecord;
    final instance = provider.detailInstance;

    if (record == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.formTitle)),
        body: provider.loading
            ? const Center(child: CircularProgressIndicator())
            : const EmptyView(
                icon: Icons.receipt_long_outlined,
                message: '单据不存在',
              ),
      );
    }

    final canAct = provider.detailCanAct && instance?.isRunning == true;
    final nodeType = instance?.nodeSnapshot.nodeType;

    return Scaffold(
      appBar: AppBar(title: Text(labels.formTitle)),
      body: RefreshIndicator(
        onRefresh: () => provider.loadDetail(widget.id),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
          children: [
            _InfoCard(record: record, labels: labels),
            if (record.isVoucher) _VoucherEntries(record: record),
            if (instance != null)
              _ApprovalCard(
                instance: instance,
                labels: labels,
                canAct: canAct,
                onApprove: canAct && nodeType != kNodeHandle
                    ? () => _act('approve')
                    : null,
                onDone: canAct && nodeType == kNodeHandle
                    ? () => _act('done')
                    : null,
                onReject: canAct ? () => _act('reject') : null,
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.record, required this.labels});

  final FinanceRecord record;
  final FinanceLabels labels;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isIncome = record.type == kFinanceIncome;
    final color = isIncome
        ? Colors.green.shade700
        : record.type == kFinanceExpense
            ? Colors.red.shade700
            : theme.colorScheme.primary;
    final statusText = record.isApproving
        ? labels.statusApproving
        : record.isApproved
            ? labels.statusApproved
            : labels.statusRejected;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    record.summary,
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                StatusBadge(
                  label: statusText,
                  variant: record.isApproved
                      ? BadgeVariant.success
                      : record.isRejected
                          ? BadgeVariant.error
                          : BadgeVariant.warning,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${isIncome ? '+' : record.type == kFinanceExpense ? '-' : ''}'
              '¥${formatAmount(record.amount)}',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const Divider(height: 24),
            _InfoRow(label: labels.entryLabel, value: record.categoryLabel),
            if (record.voucherNo.isNotEmpty)
              _InfoRow(label: labels.voucherNoLabel, value: record.voucherNo),
            _InfoRow(
              label: labels.dateLabel,
              value: formatDate(record.date),
            ),
            if (record.counterparty.isNotEmpty)
              _InfoRow(label: labels.counterpartyLabel, value: record.counterparty),
            if (record.projectId.isNotEmpty)
              _InfoRow(label: labels.projectLabel, value: record.projectId),
            _InfoRow(label: labels.applicant, value: record.createdByName),
            _InfoRow(
              label: '提交时间',
              value: formatDate(record.createdAt),
            ),
          ],
        ),
      ),
    );
  }
}

class _VoucherEntries extends StatelessWidget {
  const _VoucherEntries({required this.record});

  final FinanceRecord record;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '分录',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(color: Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(height: 8),
            for (final e in record.entries)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text('${e.account} ${e.accountName}'),
                    ),
                    if (e.debit > 0) Text('借 ¥${formatAmount(e.debit)}'),
                    if (e.credit > 0) Text('贷 ¥${formatAmount(e.credit)}'),
                  ],
                ),
              ),
            const Divider(height: 20),
            Row(
              children: [
                const Spacer(),
                Text(
                  '合计：借 ¥${formatAmount(record.totalDebit)} '
                  '贷 ¥${formatAmount(record.totalCredit)}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  const _ApprovalCard({
    required this.instance,
    required this.labels,
    required this.canAct,
    this.onApprove,
    this.onDone,
    this.onReject,
  });

  final ApprovalInstance instance;
  final FinanceLabels labels;
  final bool canAct;
  final VoidCallback? onApprove;
  final VoidCallback? onDone;
  final VoidCallback? onReject;

  String _actionText(ApprovalHistoryEntry h) {
    return switch (h.action) {
      'approve' => '通过',
      'reject' => '驳回',
      'done' => '办理完成',
      'cc' => '抄送',
      'skip' => '自动跳过',
      _ => h.action,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final current = instance.nodeSnapshot;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${labels.approvalProcess}：${instance.flowName}',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: theme.colorScheme.primary),
            ),
            if (instance.isRunning && !current.isEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '当前节点：${current.nodeName}'
                  '（${current.nodeType == kNodeApprove ? labels.nodeApprove : labels.nodeHandle}）'
                  '${canAct ? ' · 等待您处理' : ''}',
                ),
              ),
            ],
            const SizedBox(height: 8),
            if (instance.history.isEmpty)
              Text('暂无处理记录', style: theme.textTheme.bodySmall)
            else
              for (final h in instance.history)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        h.action == 'reject'
                            ? Icons.cancel_outlined
                            : h.action == 'cc'
                                ? Icons.campaign_outlined
                                : Icons.check_circle_outline,
                        size: 18,
                        color: theme.colorScheme.outline,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${h.nodeName} · ${_actionText(h)} — ${h.actorName}',
                              style: const TextStyle(fontSize: 13),
                            ),
                            if (h.comment.isNotEmpty)
                              Text(
                                h.comment,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.outline,
                                ),
                              ),
                            Text(
                              formatDate(h.time),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.outline,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            if (canAct) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (onApprove != null)
                    Expanded(
                      child: FilledButton(
                        onPressed: onApprove,
                        child: Text(labels.approve),
                      ),
                    ),
                  if (onDone != null)
                    Expanded(
                      child: FilledButton(
                        onPressed: onDone,
                        child: Text(labels.done),
                      ),
                    ),
                  if (onReject != null) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onReject,
                        child: Text(labels.reject),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: TextStyle(fontSize: 13, color: theme.colorScheme.outline),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}
