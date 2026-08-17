import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/business_event.dart';
import '../../models/governance.dart';
import '../../providers/governance_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_theme.dart';

/// 风险钻取（APP-04）：风险 → 原因 → 关联对象 → 责任人 → 处理动作。
class RiskDetailPage extends StatefulWidget {
  const RiskDetailPage({super.key, required this.id});

  final String id;

  @override
  State<RiskDetailPage> createState() => _RiskDetailPageState();
}

class _RiskDetailPageState extends State<RiskDetailPage> {
  bool _busy = false;

  RiskAlert? _findRisk(GovernanceProvider provider) {
    for (final r in [...provider.openRisks, ...provider.resolvedRisks]) {
      if (r.id == widget.id) return r;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = context.read<GovernanceProvider>();
      if (_findRisk(provider) == null) {
        await provider.load();
      }
      if (mounted) setState(() {});
    });
  }

  Future<void> _act(String action) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = true);
    try {
      await context.read<GovernanceProvider>().actRisk(widget.id, action);
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            action == 'resolve'
                ? '已标记为已解决（下次规则运行将重新校验）'
                : action == 'ack'
                    ? '已确认并持续监控'
                    : '已重新打开',
          ),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('操作失败：$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openEntity(RiskAlert risk) {
    final entityType = risk.sourceEntityType;
    final entityId = risk.sourceEntityId;
    switch (entityType) {
      case 'project':
        context.push('/projects/$entityId');
        break;
      case 'member':
        context.push('/members/$entityId');
        break;
      case 'finance':
        context.push('/finance/$entityId');
        break;
      case 'task':
        final projectId = risk.metadata['projectId'];
        if (projectId != null && '$projectId'.isNotEmpty) {
          context.push('/projects/$projectId');
        }
        break;
      case 'approval':
        final bizId = risk.metadata['bizId'];
        if (bizId != null && '$bizId'.isNotEmpty) {
          context.push('/finance/$bizId');
        } else {
          context.go('/finance/tasks');
        }
        break;
      case 'quality':
        context.go('/quality');
        break;
      case 'organization':
      default:
        context.go('/governance/risks');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<GovernanceProvider>();
    final risk = _findRisk(provider);
    final appTheme = context.appTheme;
    if (risk == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('风险详情')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final kindColor = risk.isRisk
        ? const Color(0xFFF54A45)
        : const Color(0xFFFF8800);
    final overdue = risk.deadline != null && risk.deadline!.isBefore(DateTime.now());
    final canResolve = risk.isOpen;

    return Scaffold(
      appBar: AppBar(title: const Text('风险详情')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          AppCard(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: kindColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          risk.isRisk ? '风险' : '预警',
                          style: TextStyle(
                            fontSize: 12,
                            color: kindColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        riskSeverityLabel(risk.severity),
                        style: TextStyle(
                          fontSize: 12,
                          color: kindColor,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _statusLabel(risk.status),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: risk.isResolved
                              ? const Color(0xFF00B96B)
                              : risk.isMonitoring
                                  ? const Color(0xFF3370FF)
                                  : kindColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    risk.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    risk.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: appTheme.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '为什么会发生',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          AppCard(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  _InfoRow(
                    label: '触发规则',
                    value: '${risk.sourceRuleId} ${risk.sourceRuleName}',
                  ),
                  _InfoRow(
                    label: '关联对象',
                    value: '${entityTypeLabel(risk.sourceEntityType)}：${risk.sourceEntityName}',
                  ),
                  _InfoRow(
                    label: '责任人',
                    value: risk.ownerName.isEmpty ? '未指定' : risk.ownerName,
                  ),
                  _InfoRow(
                    label: '发现时间',
                    value: formatDateTime(risk.createdAt),
                  ),
                  if (risk.deadline != null)
                    _InfoRow(
                      label: '处理期限',
                      value: '${formatDate(risk.deadline!)}'
                          '${overdue ? '（已过）' : ''}',
                      valueColor: overdue
                          ? const Color(0xFFF54A45)
                          : appTheme.textSecondary,
                    ),
                  if (risk.resolvedAt != null)
                    _InfoRow(
                      label: '解决时间',
                      value:
                          '${formatDateTime(risk.resolvedAt!)} · ${risk.resolvedByName}',
                    ),
                  if (risk.metadata.containsKey('lastNote'))
                    _InfoRow(
                      label: '处理备注',
                      value: '${risk.metadata['lastNote']}'
                          '（${risk.metadata['lastNoteBy']}）',
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => _openEntity(risk),
            icon: const Icon(Icons.open_in_new, size: 18),
            label: Text(
              risk.sourceEntityId.isEmpty
                  ? '前往对应模块'
                  : '查看关联对象：${entityTypeLabel(risk.sourceEntityType)}',
            ),
          ),
          const SizedBox(height: 16),
          if (canResolve)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _busy ? null : () => _act('ack'),
                    child: const Text('确认监控'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _busy ? null : () => _act('resolve'),
                    child: const Text('标记解决'),
                  ),
                ),
              ],
            )
          else
            Center(
              child: TextButton(
                onPressed: _busy ? null : () => _act('reopen'),
                child: const Text('重新打开'),
              ),
            ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              '提示：风险由规则引擎自动识别，标记解决后下次运行会重新校验；高风险动作最终由人工授权。',
              style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'resolved':
        return '已解决';
      case 'monitoring':
        return '监控中';
      default:
        return '待处理';
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              label,
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                color: valueColor ?? Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
