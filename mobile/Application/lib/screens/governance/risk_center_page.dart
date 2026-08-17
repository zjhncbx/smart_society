import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/governance.dart';
import '../../providers/governance_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 风险预警中心（SA-02/03）：区分风险（需管理层介入）与预警（可能发生问题）。
class RiskCenterPage extends StatefulWidget {
  const RiskCenterPage({super.key});

  @override
  State<RiskCenterPage> createState() => _RiskCenterPageState();
}

class _RiskCenterPageState extends State<RiskCenterPage> {
  bool _showResolved = false;

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
      await provider.runRules();
      messenger.showSnackBar(const SnackBar(content: Text('规则运行完成，风险/预警已更新')));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('运行失败：$e')));
    }
  }

  Future<void> _act(RiskAlert risk, String action) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<GovernanceProvider>().actRisk(risk.id, action);
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
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<GovernanceProvider>();
    final showResolved = _showResolved;
    final list = showResolved ? provider.resolvedRisks : provider.prioritizedRisks;
    return Scaffold(
      appBar: AppBar(title: const Text('风险预警')),
      body: RefreshIndicator(
        onRefresh: () => provider.load(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _SummaryCard(
              riskCount: provider.riskCount,
              warningCount: provider.warningCount,
              running: provider.running,
              onRun: _runRules,
            ),
            const SizedBox(height: 12),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  label: Text('待处理'),
                  icon: Icon(Icons.priority_high),
                ),
                ButtonSegment(
                  value: true,
                  label: Text('已解决'),
                  icon: Icon(Icons.done_all),
                ),
              ],
              selected: {showResolved},
              onSelectionChanged: (v) => setState(() => _showResolved = v.first),
              showSelectedIcon: false,
              style: const ButtonStyle(
                visualDensity: VisualDensity.compact,
              ),
            ),
            const SizedBox(height: 12),
            if (list.isEmpty)
              AppEmptyState(
                icon: showResolved
                    ? Icons.history_outlined
                    : Icons.verified_outlined,
                title: showResolved ? '暂无已解决记录' : '暂无风险与预警',
                subtitle: '运行规则后，系统将自动识别延期、阻塞、超预算等异常',
              )
            else
              for (final risk in list)
                _RiskCard(
                  risk: risk,
                  showActions: !showResolved,
                  onTap: () => context.push('/governance/risks/${risk.id}'),
                  onResolve: () => _act(risk, 'resolve'),
                  onAck: () => _act(risk, 'ack'),
                  onReopen: () => _act(risk, 'reopen'),
                ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.riskCount,
    required this.warningCount,
    required this.running,
    required this.onRun,
  });

  final int riskCount;
  final int warningCount;
  final bool running;
  final VoidCallback onRun;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppCard(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '组织风险态势',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
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
                _Count(
                  label: '风险',
                  value: '$riskCount',
                  color: const Color(0xFFF54A45),
                ),
                _Count(
                  label: '预警',
                  value: '$warningCount',
                  color: const Color(0xFFFF8800),
                ),
                _Count(
                  label: '待处理',
                  value: '${riskCount + warningCount}',
                  color: theme.colorScheme.primary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Count extends StatelessWidget {
  const _Count({
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
              fontSize: 22,
              fontWeight: FontWeight.w800,
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

class _RiskCard extends StatelessWidget {
  const _RiskCard({
    required this.risk,
    required this.showActions,
    required this.onTap,
    required this.onResolve,
    required this.onAck,
    required this.onReopen,
  });

  final RiskAlert risk;
  final bool showActions;
  final VoidCallback onTap;
  final VoidCallback onResolve;
  final VoidCallback onAck;
  final VoidCallback onReopen;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final kindColor = risk.isRisk
        ? const Color(0xFFF54A45)
        : const Color(0xFFFF8800);
    final severityColor = switch (risk.severity) {
      'high' => const Color(0xFFF54A45),
      'low' => const Color(0xFF8A9099),
      _ => const Color(0xFFFF8800),
    };
    final overdue = risk.deadline != null && risk.deadline!.isBefore(DateTime.now());
    return AppCard(
      margin: const EdgeInsets.only(bottom: 10),
      onTap: onTap,
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
                    color: kindColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    risk.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: kindColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    risk.isRisk ? '风险' : '预警',
                    style: TextStyle(
                      fontSize: 11,
                      color: kindColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              risk.description,
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _Chip(
                  label: risk.sourceRuleId,
                  color: const Color(0xFF7B61FF),
                ),
                _Chip(
                  label: '严重度：${riskSeverityLabel(risk.severity)}',
                  color: severityColor,
                ),
                if (risk.ownerName.isNotEmpty)
                  _Chip(
                    label: '责任人：${risk.ownerName}',
                    color: const Color(0xFF3370FF),
                  ),
                if (risk.deadline != null)
                  _Chip(
                    label: overdue
                        ? '处理期限已过'
                        : '期限 ${formatDate(risk.deadline!)}',
                    color: overdue
                        ? const Color(0xFFF54A45)
                        : const Color(0xFF8A9099),
                  ),
                if (!risk.isOpen)
                  _Chip(
                    label: risk.isMonitoring ? '监控中' : '已解决',
                    color: const Color(0xFF00B96B),
                  ),
              ],
            ),
            if (showActions) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (risk.isOpen) ...[
                    TextButton(
                      onPressed: onAck,
                      child: const Text('确认监控'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: onResolve,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 10),
                      ),
                      child: const Text('标记解决'),
                    ),
                  ] else
                    TextButton(
                      onPressed: onReopen,
                      child: const Text('重新打开'),
                    ),
                ],
              ),
            ],
          ],
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
