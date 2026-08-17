import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/data_quality.dart';
import '../../providers/data_quality_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 数据治理中心（DQ-02）：健康度评分 + 问题清单 + 闭环处理。
class DataQualityCenterPage extends StatefulWidget {
  const DataQualityCenterPage({super.key});

  @override
  State<DataQualityCenterPage> createState() => _DataQualityCenterPageState();
}

class _DataQualityCenterPageState extends State<DataQualityCenterPage> {
  static const _categoryFilters = <(String, String)>[
    ('', '全部分类'),
    ('member', '会员档案'),
    ('project', '项目数据'),
    ('finance', '财务关联'),
    ('org', '组织资料'),
  ];

  static const _statusFilters = <(String, String)>[
    ('', '全部状态'),
    ('open', '待处理'),
    ('resolved', '已解决'),
    ('ignored', '已忽略'),
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DataQualityProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('数据治理中心')),
      body: RefreshIndicator(
        onRefresh: () => provider.load(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _HealthCard(
              snapshot: provider.snapshot,
              running: provider.running,
              onRun: () => _runCheck(context),
            ),
            const SizedBox(height: 16),
            _FilterBar(
              categoryFilters: _categoryFilters,
              statusFilters: _statusFilters,
              selectedCategory: provider.category,
              selectedStatus: provider.status,
              onCategoryChanged: (v) => provider.load(category: v),
              onStatusChanged: (v) => provider.load(status: v),
            ),
            const SizedBox(height: 8),
            if (provider.issues.isEmpty)
              const AppEmptyState(
                icon: Icons.verified_outlined,
                title: '暂无数据问题',
                subtitle: '运行检查后，系统将自动发现缺失、重复、冲突等坏数据',
              )
            else
              for (final issue in provider.sortedIssues)
                _IssueCard(
                  issue: issue,
                  onAction: (action, note) =>
                      _act(issue.id, action, note: note),
                ),
            if (provider.hasMore)
              TextButton(
                onPressed: () => provider.loadMore(),
                child: const Text('加载更多'),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _runCheck(BuildContext context) async {
    final provider = context.read<DataQualityProvider>();
    if (provider.running) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final score = await provider.runCheck();
      messenger.showSnackBar(
        SnackBar(content: Text('数据质量检查完成，当前健康度 $score 分')),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('检查失败：$e')),
      );
    }
  }

  Future<void> _act(String id, String action, {String note = ''}) async {
    final provider = context.read<DataQualityProvider>();
    final messenger = ScaffoldMessenger.of(context);
    try {
      await provider.act(id, action, note: note);
      messenger.showSnackBar(
        SnackBar(content: Text(_actionMessage(action))),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('操作失败：$e')));
    }
  }

  String _actionMessage(String action) {
    switch (action) {
      case 'resolve':
        return '已标记为已解决（下次检查将重新校验）';
      case 'ignore':
        return '已忽略该问题';
      default:
        return '已重新打开';
    }
  }
}

class _HealthCard extends StatelessWidget {
  const _HealthCard({
    required this.snapshot,
    required this.running,
    required this.onRun,
  });

  final DataQualitySnapshot snapshot;
  final bool running;
  final VoidCallback onRun;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    final score = snapshot.score;
    final color = score >= 90
        ? const Color(0xFF00B96B)
        : score >= 70
            ? const Color(0xFFFF8800)
            : const Color(0xFFF54A45);
    return AppCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '数据治理健康度',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              if (snapshot.checkedAt != null)
                Text(
                  '检查于 ${formatDateTime(snapshot.checkedAt!)}',
                  style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '$score',
                style: TextStyle(
                  fontSize: 40,
                  height: 1,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 18, left: 4),
                child: Text('分', style: TextStyle(fontSize: 14)),
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
                    : const Icon(Icons.play_arrow, size: 18),
                label: Text(running ? '检查中…' : '运行检查'),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _CountItem(
                label: '待处理',
                value: '${snapshot.openCount}',
                color: const Color(0xFFF54A45),
              ),
              _CountItem(
                label: '已解决',
                value: '${snapshot.resolvedCount}',
                color: const Color(0xFF00B96B),
              ),
              _CountItem(
                label: '规则命中',
                value: '${snapshot.ruleCount}',
                color: theme.colorScheme.primary,
              ),
            ],
          ),
          if (snapshot.dimensions.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            for (final entry in snapshot.dimensions.entries)
              _DimensionBar(
                label: qualityCategoryLabel(entry.key),
                score: entry.value,
              ),
          ],
        ],
      ),
    );
  }
}

class _CountItem extends StatelessWidget {
  const _CountItem({
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
              fontSize: 18,
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

class _DimensionBar extends StatelessWidget {
  const _DimensionBar({required this.label, required this.score});

  final String label;
  final int score;

  @override
  Widget build(BuildContext context) {
    final color = score >= 90
        ? const Color(0xFF00B96B)
        : score >= 70
            ? const Color(0xFFFF8800)
            : const Color(0xFFF54A45);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: Text(label, style: const TextStyle(fontSize: 13)),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: score / 100,
                minHeight: 6,
                color: color,
                backgroundColor:
                    Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 32,
            child: Text(
              '$score%',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.categoryFilters,
    required this.statusFilters,
    required this.selectedCategory,
    required this.selectedStatus,
    required this.onCategoryChanged,
    required this.onStatusChanged,
  });

  final List<(String, String)> categoryFilters;
  final List<(String, String)> statusFilters;
  final String selectedCategory;
  final String selectedStatus;
  final ValueChanged<String> onCategoryChanged;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final f in categoryFilters) ...[
                _FilterChip(
                  label: f.$2,
                  selected: selectedCategory == f.$1,
                  onTap: () => onCategoryChanged(f.$1),
                ),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final f in statusFilters) ...[
                _FilterChip(
                  label: f.$2,
                  selected: selectedStatus == f.$1,
                  onTap: () => onStatusChanged(f.$1),
                ),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
      ],
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
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? scheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outlineVariant,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: selected ? scheme.onPrimary : scheme.onSurfaceVariant,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

class _IssueCard extends StatelessWidget {
  const _IssueCard({
    required this.issue,
    required this.onAction,
  });

  final DataQualityIssue issue;
  final void Function(String action, String note) onAction;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final severityColor = switch (issue.severity) {
      'high' => const Color(0xFFF54A45),
      'low' => const Color(0xFF8A9099),
      _ => const Color(0xFFFF8800),
    };
    final statusLabel = switch (issue.status) {
      'open' => '待处理',
      'ignored' => '已忽略',
      _ => '已解决',
    };
    final statusColor = switch (issue.status) {
      'open' => const Color(0xFFF54A45),
      'ignored' => const Color(0xFF8A9099),
      _ => const Color(0xFF00B96B),
    };
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
                    color: severityColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    issue.ruleName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  '${issue.ruleId} · ${qualitySeverityLabel(issue.severity)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: severityColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              issue.entityName.isEmpty
                  ? issue.description
                  : '「${issue.entityName}」${issue.description}',
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${qualityCategoryLabel(issue.category)} · 已检查 ${issue.checkCount} 次',
                  style:
                      TextStyle(fontSize: 11, color: appTheme.textSecondary),
                ),
                const Spacer(),
                if (issue.isOpen)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton(
                        onPressed: () => _confirm(context, 'resolve'),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('解决'),
                      ),
                      TextButton(
                        onPressed: () => _confirm(context, 'ignore'),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('忽略'),
                      ),
                    ],
                  )
                else
                  TextButton(
                    onPressed: () => onAction('reopen', ''),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('重开'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirm(BuildContext context, String action) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(action == 'resolve' ? '确认解决？' : '确认忽略？'),
        content: Text(action == 'resolve'
            ? '将标记「${issue.ruleName}：${issue.entityName}」为已解决，下次检查将重新校验。'
            : '将忽略该问题，后续检查不再提示（修复数据后可重开）。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('确认'),
          ),
        ],
      ),
    );
    if (confirmed == true) onAction(action, '');
  }
}
