import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/business_event.dart';
import '../../providers/event_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 组织事件流（WF-01）：统一呈现组织内业务事件，支持按对象/级别筛选。
class EventCenterPage extends StatefulWidget {
  const EventCenterPage({super.key});

  @override
  State<EventCenterPage> createState() => _EventCenterPageState();
}

class _EventCenterPageState extends State<EventCenterPage> {
  final ScrollController _scroll = ScrollController();

  static const _entityFilters = <(String, String)>[
    ('', '全部'),
    ('member', '成员'),
    ('project', '项目'),
    ('finance', '财务'),
    ('approval', '审批'),
    ('notice', '通知'),
  ];

  static const _levelFilters = <(String, String)>[
    ('', '全部级别'),
    ('info', '动态'),
    ('warning', '预警'),
    ('risk', '风险'),
  ];

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EventProvider>().load();
    });
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 240) {
      final provider = context.read<EventProvider>();
      if (provider.hasMore && !provider.loading) {
        provider.loadMore();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<EventProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('组织事件流')),
      body: Column(
        children: [
          _FilterBar(
            entityFilters: _entityFilters,
            levelFilters: _levelFilters,
            selectedEntity: provider.entityType,
            selectedLevel: provider.level,
            onEntityChanged: (v) => provider.load(entityType: v),
            onLevelChanged: (v) => provider.load(level: v),
          ),
          const Divider(height: 1),
          Expanded(
            child: provider.events.isEmpty
                ? (provider.loading
                    ? const Center(child: CircularProgressIndicator())
                    : const AppEmptyState(
                        icon: Icons.timeline_outlined,
                        title: '暂无事件',
                        subtitle: '成员、项目、财务等业务动作将在这里形成组织事件流',
                      ))
                : RefreshIndicator(
                    onRefresh: () => provider.load(),
                    child: ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: provider.events.length + (provider.hasMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index >= provider.events.length) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                          );
                        }
                        final event = provider.events[index];
                        return _EventCard(
                          event: event,
                          onTap: () => _showDetail(event),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  void _showDetail(BusinessEvent event) {
    final appTheme = context.appTheme;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: BoxDecoration(
          color: Theme.of(sheetContext).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '事件详情',
              style: Theme.of(sheetContext).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            _DetailRow(label: '事件', value: eventTypeLabel(event.eventType)),
            _DetailRow(
              label: '对象',
              value:
                  '${entityTypeLabel(event.entityType)}${event.entityName.isEmpty ? '' : '：${event.entityName}'}',
            ),
            _DetailRow(label: '操作人', value: event.actorName.isEmpty ? '系统' : event.actorName),
            _DetailRow(label: '时间', value: formatDateTime(event.occurredAt)),
            _DetailRow(label: '级别', value: eventLevelLabel(event.level)),
            _DetailRow(label: '来源', value: event.isSystem ? '系统自动' : '人工操作'),
            if (event.correlationId.isNotEmpty)
              _DetailRow(label: '关联ID', value: event.correlationId),
            if (event.metadata.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                '附加信息',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: appTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              SelectableText(
                event.metadata.entries
                    .map((e) => '${e.key}: ${e.value}')
                    .join('\n'),
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.entityFilters,
    required this.levelFilters,
    required this.selectedEntity,
    required this.selectedLevel,
    required this.onEntityChanged,
    required this.onLevelChanged,
  });

  final List<(String, String)> entityFilters;
  final List<(String, String)> levelFilters;
  final String selectedEntity;
  final String selectedLevel;
  final ValueChanged<String> onEntityChanged;
  final ValueChanged<String> onLevelChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          for (final f in entityFilters) ...[
            _FilterChip(
              label: f.$2,
              selected: selectedEntity == f.$1,
              onTap: () => onEntityChanged(f.$1),
            ),
            const SizedBox(width: 8),
          ],
          const SizedBox(width: 4),
          for (final f in levelFilters) ...[
            _FilterChip(
              label: f.$2,
              selected: selectedLevel == f.$1,
              onTap: () => onLevelChanged(f.$1),
            ),
            const SizedBox(width: 8),
          ],
        ],
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

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.onTap});

  final BusinessEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final style = _EventStyle.forEntity(event.entityType);
    final title = event.entityName.isEmpty
        ? '${eventTypeLabel(event.eventType)}${entityTypeLabel(event.entityType)}'
        : '「${event.entityName}」${eventTypeLabel(event.eventType)}';
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      child: ListTile(
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: style.color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(style.icon, size: 20, color: style.color),
        ),
        title: Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${event.actorName.isEmpty ? '系统' : event.actorName} · ${formatRelative(event.occurredAt)}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
        ),
        trailing: _LevelBadge(level: event.level),
        onTap: onTap,
      ),
    );
  }
}

class _EventStyle {
  const _EventStyle(this.icon, this.color);

  final IconData icon;
  final Color color;

  static _EventStyle forEntity(String entityType) {
    switch (entityType) {
      case 'member':
        return const _EventStyle(Icons.people_outline, Color(0xFF3370FF));
      case 'project':
        return const _EventStyle(Icons.task_alt_outlined, Color(0xFF00B96B));
      case 'task':
        return const _EventStyle(Icons.check_circle_outline, Color(0xFF13C2C2));
      case 'notice':
        return const _EventStyle(Icons.campaign_outlined, Color(0xFFFF8800));
      case 'finance':
        return const _EventStyle(
            Icons.account_balance_wallet_outlined, Color(0xFF7B61FF));
      case 'approval':
        return const _EventStyle(Icons.fact_check_outlined, Color(0xFFF54A45));
      case 'organization':
        return const _EventStyle(Icons.business_outlined, Color(0xFF1F5FBF));
      default:
        return const _EventStyle(Icons.timeline_outlined, Color(0xFF8A9099));
    }
  }
}

class _LevelBadge extends StatelessWidget {
  const _LevelBadge({required this.level});

  final String level;

  @override
  Widget build(BuildContext context) {
    final (Color color, String label) = switch (level) {
      'risk' => (const Color(0xFFF54A45), '风险'),
      'warning' => (const Color(0xFFFF8800), '预警'),
      _ => (const Color(0xFF8A9099), '动态'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              label,
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
