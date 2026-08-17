import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/work_item.dart';
import '../../providers/work_item_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 统一工作项中心（P0-A）：审批/自动任务/项目任务/风险整改/数据治理一个视图消费。
class WorkItemCenterPage extends StatefulWidget {
  const WorkItemCenterPage({super.key});

  @override
  State<WorkItemCenterPage> createState() => _WorkItemCenterPageState();
}

class _WorkItemCenterPageState extends State<WorkItemCenterPage> {
  static const _typeFilters = <(String, String)>[
    ('', '全部'),
    ('approval', '审批'),
    ('auto_task', '自动任务'),
    ('project_task', '项目任务'),
    ('risk', '风险整改'),
    ('data_quality', '数据治理'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await context.read<WorkItemProvider>().refresh();
      } catch (_) {}
    });
  }

  Future<void> _refresh() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await context.read<WorkItemProvider>().refresh();
      messenger.showSnackBar(
        SnackBar(content: Text('工作项已同步：新增 ${result['upserted'] ?? 0}，自动完成 ${result['autoClosed'] ?? 0}')),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('同步失败：$e')));
    }
  }

  Future<void> _act(WorkItem item, String action) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<WorkItemProvider>().act(item.id, action);
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            action == 'done'
                ? '工作项已完成'
                : action == 'cancel'
                    ? '工作项已取消'
                    : '工作项已重开',
          ),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('操作失败：$e')));
    }
  }

  void _open(WorkItem item) {
    switch (item.workItemType) {
      case 'approval':
        context.go('/finance/tasks');
        break;
      case 'project_task':
        final projectId = item.originId.split(':').first;
        if (projectId.isNotEmpty) {
          context.push('/projects/$projectId');
        }
        break;
      case 'risk':
        context.push('/governance/risks/${item.originId}');
        break;
      case 'data_quality':
        context.go('/quality');
        break;
      case 'auto_task':
      default:
        context.go('/governance/tasks');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkItemProvider>();
    final items = provider.sortedItems;
    return Scaffold(
      appBar: AppBar(title: const Text('统一工作项')),
      body: RefreshIndicator(
        onRefresh: _refresh,
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
                        '待处理 ${provider.openCount} 项 · 共 ${provider.total} 项',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    FilledButton.icon(
                      onPressed: provider.refreshing ? null : _refresh,
                      icon: provider.refreshing
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.sync, size: 18),
                      label: Text(provider.refreshing ? '同步中…' : '同步'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final f in _typeFilters) ...[
                    _FilterChip(
                      label: f.$2,
                      selected: provider.workItemType == f.$1,
                      onTap: () =>
                          provider.load(workItemType: f.$1),
                    ),
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (items.isEmpty)
              const AppEmptyState(
                icon: Icons.inbox_outlined,
                title: '暂无工作项',
                subtitle: '审批、自动任务、项目任务、风险整改与数据治理将在这里统一呈现',
              )
            else
              for (final item in items)
                _WorkItemCard(
                  item: item,
                  onTap: () => _open(item),
                  onAct: item.workItemType == 'approval' ||
                          item.workItemType == 'project_task'
                      ? null
                      : (action) => _act(item, action),
                ),
            if (provider.hasMore)
              TextButton(
                onPressed: () => provider.load(reset: false),
                child: const Text('加载更多'),
              ),
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

class _WorkItemCard extends StatelessWidget {
  const _WorkItemCard({
    required this.item,
    required this.onTap,
    required this.onAct,
  });

  final WorkItem item;
  final VoidCallback onTap;
  final void Function(String action)? onAct;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final style = _styleFor(item.workItemType);
    final overdue = item.isOverdue;
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
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: style.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(style.icon, size: 18, color: style.color),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  workItemTypeLabel(item.workItemType),
                  style: TextStyle(
                    fontSize: 11,
                    color: style.color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (item.description.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: appTheme.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (item.sourceRuleId.isNotEmpty)
                  _Chip(
                    label: item.sourceRuleId,
                    color: const Color(0xFF7B61FF),
                  ),
                if (item.ownerName.isNotEmpty)
                  _Chip(
                    label: '负责人：${item.ownerName}',
                    color: const Color(0xFF3370FF),
                  ),
                if (item.slaDeadline != null)
                  _Chip(
                    label: overdue
                        ? 'SLA 已逾期'
                        : 'SLA ${formatDate(item.slaDeadline!)}',
                    color: overdue
                        ? const Color(0xFFF54A45)
                        : const Color(0xFF8A9099),
                  ),
                if (item.escalationLevel > 0)
                  _Chip(
                    label: '已升级 L${item.escalationLevel}',
                    color: const Color(0xFFF54A45),
                  ),
              ],
            ),
            if (onAct != null) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (item.isOpen) ...[
                    TextButton(
                      onPressed: () => onAct!('cancel'),
                      child: const Text('取消'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => onAct!('done'),
                      child: const Text('完成'),
                    ),
                  ] else
                    TextButton(
                      onPressed: () => onAct!('reopen'),
                      child: const Text('重开'),
                    ),
                ],
              ),
            ] else
              const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }

  static _WorkItemStyle _styleFor(String type) {
    switch (type) {
      case 'approval':
        return const _WorkItemStyle(Icons.fact_check_outlined, Color(0xFF3370FF));
      case 'auto_task':
        return const _WorkItemStyle(Icons.auto_awesome_outlined, Color(0xFF7B61FF));
      case 'project_task':
        return const _WorkItemStyle(Icons.task_alt_outlined, Color(0xFF00B96B));
      case 'risk':
        return const _WorkItemStyle(Icons.warning_amber_rounded, Color(0xFFF54A45));
      case 'data_quality':
        return const _WorkItemStyle(Icons.verified_outlined, Color(0xFFFF8800));
      default:
        return const _WorkItemStyle(Icons.inbox_outlined, Color(0xFF8A9099));
    }
  }
}

class _WorkItemStyle {
  const _WorkItemStyle(this.icon, this.color);

  final IconData icon;
  final Color color;
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
