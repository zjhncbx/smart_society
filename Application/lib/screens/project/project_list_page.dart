import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/project.dart';
import '../../providers/member_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';

/// 项目管理列表页
class ProjectListPage extends StatefulWidget {
  const ProjectListPage({super.key});

  @override
  State<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends State<ProjectListPage> {
  int? _statusFilter;
  final _searchController = TextEditingController();
  String _keyword = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<ProjectProvider>();
    final memberProvider = context.watch<MemberProvider>();

    final projects = provider.sortedProjects
        .where((p) => _statusFilter == null || p.status == _statusFilter)
        .where((p) =>
            _keyword.isEmpty ||
            p.name.toLowerCase().contains(_keyword) ||
            p.description.toLowerCase().contains(_keyword))
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(labels.projectMgmtTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: (v) =>
                  setState(() => _keyword = v.trim().toLowerCase()),
              decoration: InputDecoration(
                hintText: '搜索项目名称 / 介绍',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                _StatusChip(
                  label: labels.statusAll,
                  selected: _statusFilter == null,
                  onTap: () => setState(() => _statusFilter = null),
                ),
                _StatusChip(
                  label: labels.statusPreparing,
                  selected: _statusFilter == kProjectPreparing,
                  onTap: () => setState(() => _statusFilter = kProjectPreparing),
                ),
                _StatusChip(
                  label: labels.statusInProgress,
                  selected: _statusFilter == kProjectActive,
                  onTap: () => setState(() => _statusFilter = kProjectActive),
                ),
                _StatusChip(
                  label: labels.statusPaused,
                  selected: _statusFilter == kProjectPaused,
                  onTap: () => setState(() => _statusFilter = kProjectPaused),
                ),
                _StatusChip(
                  label: labels.statusCompleted,
                  selected: _statusFilter == kProjectCompleted,
                  onTap: () => setState(() => _statusFilter = kProjectCompleted),
                ),
              ],
            ),
          ),
          Expanded(
            child: projects.isEmpty
                ? AppEmptyState(
                    icon: Icons.folder_open,
                    title: labels.emptyProjects,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 88),
                    itemCount: projects.length,
                    itemBuilder: (context, index) {
                      final project = projects[index];
                      return _ProjectCard(
                        project: project,
                        managerName: _managerName(memberProvider, project),
                        onTap: () =>
                            context.push('/projects/${project.id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/projects/new'),
        icon: const Icon(Icons.add),
        label: Text(labels.createButton),
      ),
    );
  }

  String _managerName(MemberProvider memberProvider, Project project) {
    if (project.managerId.isEmpty) return context.labels.notFilled;
    return memberProvider.findById(project.managerId)?.name ?? context.labels.notFilled;
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({
    required this.project,
    required this.managerName,
    required this.onTap,
  });

  final Project project;
  final String managerName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final statusLabel = _statusLabel(labels, project.status);
    final statusVariant = _statusVariant(project.status);

    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  project.name,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(label: statusLabel, variant: statusVariant),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${labels.labelManager}: $managerName',
            style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
          ),
          const SizedBox(height: 4),
          Text(
            '${formatDate(project.startDate)} ~ ${formatDate(project.endDate)}',
            style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: project.progress / 100,
                    minHeight: 6,
                    backgroundColor: cs.surfaceContainerHighest,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${project.progress}%',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: cs.primary, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${labels.labelTasks}: ${project.doneTaskCount}/${project.taskCount}',
            style: theme.textTheme.bodySmall?.copyWith(color: cs.outline),
          ),
        ],
      ),
    );
  }

  static String _statusLabel(OrgLabels labels, int status) =>
      switch (status) {
        kProjectPreparing => labels.statusPreparing,
        kProjectActive => labels.statusInProgress,
        kProjectPaused => labels.statusPaused,
        kProjectCompleted => labels.statusCompleted,
        _ => labels.statusAll,
      };

  static BadgeVariant _statusVariant(int status) => switch (status) {
        kProjectPreparing => BadgeVariant.info,
        kProjectActive => BadgeVariant.success,
        kProjectPaused => BadgeVariant.warning,
        kProjectCompleted => BadgeVariant.neutral,
        _ => BadgeVariant.neutral,
      };
}
