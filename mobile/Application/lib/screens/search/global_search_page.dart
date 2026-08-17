import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/business_event.dart';
import '../../models/project.dart';
import '../../providers/event_provider.dart';
import '../../providers/governance_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 全域检索（APP-03）：跨成员/项目/任务/公告/自动任务/风险/事件统一搜索。
class GlobalSearchPage extends StatefulWidget {
  const GlobalSearchPage({super.key});

  @override
  State<GlobalSearchPage> createState() => _GlobalSearchPageState();
}

class _GlobalSearchPageState extends State<GlobalSearchPage> {
  final TextEditingController _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool _match(String text) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return false;
    return text.toLowerCase().contains(q);
  }

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final members = context.watch<MemberProvider>().members;
    final projects = context.watch<ProjectProvider>().projects;
    final notices = context.watch<NoticeProvider>().notices;
    final gov = context.watch<GovernanceProvider>();
    final events = context.watch<EventProvider>().events;

    final memberHits = members.where((m) {
      return _match(m.name) ||
          _match(m.studentNo) ||
          _match(m.phone) ||
          _match(m.department) ||
          _match(m.roleLabel);
    }).toList();
    final projectHits = projects.where((p) {
      return _match(p.name) || _match(p.description);
    }).toList();
    final taskHits = <({Project project, ProjectTask task})>[];
    for (final p in projects) {
      for (final t in p.tasks) {
        if (_match(t.title)) {
          taskHits.add((project: p, task: t));
        }
      }
    }
    final noticeHits = notices.where((n) {
      return _match(n.title) || _match(n.content) || _match(n.publisher);
    }).toList();
    final taskAutoHits = gov.openTasks
        .where((t) => _match(t.title) || _match(t.description))
        .toList();
    final riskHits = [...gov.openRisks, ...gov.resolvedRisks]
        .where((r) => _match(r.title) || _match(r.description))
        .toList();
    final eventHits = events
        .where((e) =>
            _match(e.entityName) ||
            _match(eventTypeLabel(e.eventType)) ||
            _match(entityTypeLabel(e.entityType)))
        .take(30)
        .toList();

    final hasQuery = _query.trim().isNotEmpty;
    final total = memberHits.length +
        projectHits.length +
        taskHits.length +
        noticeHits.length +
        taskAutoHits.length +
        riskHits.length +
        eventHits.length;

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          onChanged: (v) => setState(() => _query = v),
          decoration: const InputDecoration(
            hintText: '搜索成员 / 项目 / 任务 / 公告 / 风险…',
            border: InputBorder.none,
            filled: false,
            isDense: true,
          ),
          style: const TextStyle(fontSize: 16),
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                _controller.clear();
                setState(() => _query = '');
              },
            ),
        ],
      ),
      body: !hasQuery
          ? const AppEmptyState(
              icon: Icons.search,
              title: '全域检索',
              subtitle: '统一搜索组织知识：人员、会员、项目、任务、公告、审批、风险、事件',
            )
          : total == 0
              ? const AppEmptyState(
                  icon: Icons.search_off_outlined,
                  title: '未找到相关内容',
                )
              : ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    if (memberHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '成员',
                        count: memberHits.length,
                      ),
                      for (final m in memberHits.take(10))
                        _ResultTile(
                          icon: Icons.people_outline,
                          color: const Color(0xFF3370FF),
                          title: m.name,
                          subtitle: '${m.roleLabel} · ${m.department}',
                          onTap: () => context.push('/members/${m.id}'),
                        ),
                    ],
                    if (projectHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '项目',
                        count: projectHits.length,
                      ),
                      for (final p in projectHits.take(10))
                        _ResultTile(
                          icon: Icons.task_alt_outlined,
                          color: const Color(0xFF00B96B),
                          title: p.name,
                          subtitle: '进度 ${p.progress}%',
                          onTap: () => context.push('/projects/${p.id}'),
                        ),
                    ],
                    if (taskHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '任务',
                        count: taskHits.length,
                      ),
                      for (final hit in taskHits.take(10))
                        _ResultTile(
                          icon: Icons.check_circle_outline,
                          color: const Color(0xFF13C2C2),
                          title: hit.task.title,
                          subtitle: '项目：${hit.project.name}',
                          onTap: () => context.push('/projects/${hit.project.id}'),
                        ),
                    ],
                    if (noticeHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '公告',
                        count: noticeHits.length,
                      ),
                      for (final n in noticeHits.take(10))
                        _ResultTile(
                          icon: Icons.campaign_outlined,
                          color: const Color(0xFFFF8800),
                          title: n.title,
                          subtitle: n.publisher,
                          onTap: () => context.push('/notices/${n.id}'),
                        ),
                    ],
                    if (taskAutoHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '自动任务',
                        count: taskAutoHits.length,
                      ),
                      for (final t in taskAutoHits.take(10))
                        _ResultTile(
                          icon: Icons.auto_awesome_outlined,
                          color: const Color(0xFF7B61FF),
                          title: t.title,
                          subtitle: '${t.sourceRuleId} · ${t.sourceRuleName}',
                          onTap: () => context.push('/governance/tasks'),
                        ),
                    ],
                    if (riskHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '风险/预警',
                        count: riskHits.length,
                      ),
                      for (final r in riskHits.take(10))
                        _ResultTile(
                          icon: Icons.warning_amber_rounded,
                          color: r.isRisk
                              ? const Color(0xFFF54A45)
                              : const Color(0xFFFF8800),
                          title: r.title,
                          subtitle: '${r.sourceRuleId} · ${r.status}',
                          onTap: () => context.push('/governance/risks/${r.id}'),
                        ),
                    ],
                    if (eventHits.isNotEmpty) ...[
                      _SectionHeader(
                        title: '事件',
                        count: eventHits.length,
                      ),
                      for (final e in eventHits)
                        _ResultTile(
                          icon: Icons.timeline_outlined,
                          color: const Color(0xFF8A9099),
                          title: e.entityName.isEmpty
                              ? '${eventTypeLabel(e.eventType)}${entityTypeLabel(e.entityType)}'
                              : '「${e.entityName}」${eventTypeLabel(e.eventType)}',
                          subtitle: formatRelative(e.occurredAt),
                          onTap: () => context.push('/events'),
                        ),
                    ],
                    const SizedBox(height: 12),
                    Center(
                      child: Text(
                        '共 $total 条结果',
                        style: TextStyle(
                          fontSize: 12,
                          color: appTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Text(
        '$title（$count）',
        style: Theme.of(context)
            .textTheme
            .titleSmall
            ?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _ResultTile extends StatelessWidget {
  const _ResultTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return AppCard(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      onTap: onTap,
      child: ListTile(
        dense: true,
        leading: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        title: Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14),
        ),
        subtitle: Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
        ),
        trailing: const Icon(Icons.chevron_right, size: 18),
      ),
    );
  }
}
