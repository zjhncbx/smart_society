import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../models/member.dart';
import '../../providers/member_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/role_config_provider.dart';
import '../../services/storage_service.dart';
import '../../utils/csv.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/member_avatar.dart';
import '../../widgets/common.dart';

/// 成员列表页：角色筛选 + 关键字搜索
class MemberListPage extends StatefulWidget {
  const MemberListPage({super.key});

  @override
  State<MemberListPage> createState() => _MemberListPageState();
}

class _MemberListPageState extends State<MemberListPage> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _exportCsv() async {
    final provider = context.read<MemberProvider>();
    final orgId = context.read<OrganizationProvider>().currentOrgId ?? '';
    final rows = provider.members
        .where((m) => orgId.isEmpty || m.orgId == orgId)
        .map((m) => [
              m.name,
              m.studentNo,
              m.department,
              m.roleId,
              m.phone,
              m.email,
            ].map(csvEscape).join(','))
        .toList();
    final header = '姓名,学号,部门,角色ID,电话,邮箱';
    final content = [header, ...rows].join('\n');
    try {
      final path = StorageService.instance.storagePath;
      if (path.isEmpty) throw Exception('存储目录不可用');
      final stamp = DateTime.now()
          .toIso8601String()
          .replaceAll(':', '')
          .split('.')
          .first;
      final file = File('$path/members_$stamp.csv');
      await file.writeAsString(content);
      if (!mounted) return;
      showToast(context, '已导出 ${provider.members.length} 名成员：${file.path}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, '导出失败: $e');
    }
  }

  Future<void> _importCsv() async {
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('导入成员 CSV'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('每行格式：姓名,学号,部门,角色ID,电话,邮箱（首行为表头可省略）'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 8,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: '张三,2026001,组织部,member,13800000000,\n李四,2026002,宣传部,member,,lisi@example.com',
              ),
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
            child: const Text('导入'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final text = controller.text.trim();
    if (text.isEmpty) return;

    final labels = context.labelsRead;
    final roleConfig = context.read<RoleConfigProvider>();
    final orgId = context.read<OrganizationProvider>().currentOrgId ?? '';
    final provider = context.read<MemberProvider>();
    final now = DateTime.now();
    var count = 0;
    var errors = 0;
    for (final line in text.split('\n')) {
      final cells = csvParseLine(line.trim()).map((s) => s.trim()).toList();
      if (cells.isEmpty || cells[0].isEmpty) continue;
      if (cells[0] == '姓名') continue; // 跳过表头
      final name = cells[0];
      final studentNo = cells.length > 1 ? cells[1] : '';
      final department = cells.length > 2 ? cells[2] : '';
      var roleId = cells.length > 3 && cells[3].isNotEmpty ? cells[3] : 'member';
      final role = labels.roles.where((r) => r.id == roleId).firstOrNull;
      if (role == null) roleId = 'member';
      final defaultRole = labels.roles.where((r) => r.id == roleId).firstOrNull ??
          labels.roles.first;
      final roleLabel = roleConfig.getLabel(orgId, defaultRole.id, defaultRole.label);
      final phone = cells.length > 4 ? cells[4] : '';
      final email = cells.length > 5 ? cells[5] : '';
      try {
        final member = Member(
          id: MemberProvider.nextId(provider.members),
          name: name,
          studentNo: studentNo,
          department: department,
          roleId: defaultRole.id,
          roleLabel: roleLabel,
          phone: phone,
          email: email,
          joinedAt: now,
        );
        await provider.saveMember(member);
        count++;
      } catch (_) {
        errors++;
      }
    }
    if (!mounted) return;
    showToast(
      context,
      errors > 0 ? '导入完成：成功 $count 条，失败 $errors 条' : '已导入 $count 名成员',
    );
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<MemberProvider>();
    final isAdmin =
        context.watch<OrganizationProvider>().currentOrgRole == 'admin';
    final members = provider.filteredMembers;

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.memberMgmtTitle),
        actions: [
          if (isAdmin)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) {
                if (v == 'export') {
                  _exportCsv();
                } else if (v == 'import' && !provider.isDingTalkManaged) {
                  _importCsv();
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'export', child: Text('导出成员 CSV')),
                if (!provider.isDingTalkManaged)
                  const PopupMenuItem(value: 'import', child: Text('导入成员 CSV')),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          if (provider.isDingTalkManaged)
            Container(
              width: double.infinity,
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.lock_outline,
                      size: 16, color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      labels.labelDingTalkManagedHint,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.outline),
                    ),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: provider.setKeyword,
              decoration: InputDecoration(
                hintText: labels.searchHint,
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                _RoleChip(
                  label: labels.statusAll,
                  selected: provider.roleFilterId == null,
                  onTap: () => provider.setRoleFilter(null),
                ),
                for (final role in labels.roles)
                  _RoleChip(
                    label: role.label,
                    selected: provider.roleFilterId == role.id,
                    onTap: () => provider.setRoleFilter(role.id),
                  ),
              ],
            ),
          ),
          Expanded(
            child: members.isEmpty
                ? AppEmptyState(
                    icon: Icons.people_outline,
                    title: labels.emptyMembers,
                    action: provider.isDingTalkManaged
                        ? null
                        : FilledButton.icon(
                            onPressed: () => context.push('/members/new'),
                            icon: const Icon(Icons.add),
                            label: Text(labels.addButton),
                          ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 88),
                    itemCount: members.length,
                    itemBuilder: (context, index) {
                      final member = members[index];
                      final roleIndex = labels.roles
                          .indexWhere((r) => r.id == member.roleId);
                      return ListTile(
                        leading: MemberAvatar(
                          name: member.name,
                          colorIndex: member.avatarColorIndex,
                        ),
                        title: Text(member.name),
                        subtitle: Text(
                          '${member.department} · ${labels.labelStudentNo} ${member.studentNo}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: StatusBadge(
                          label: member.roleLabel,
                          variant: _variantForIndex(roleIndex),
                        ),
                        onTap: () => context.push('/members/${member.id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: provider.isDingTalkManaged
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.push('/members/new'),
              icon: const Icon(Icons.add),
              label: Text(labels.addButton),
            ),
    );
  }

  BadgeVariant _variantForIndex(int index) {
    return switch (index) {
      0 => BadgeVariant.info,
      1 => BadgeVariant.success,
      _ => BadgeVariant.neutral,
    };
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({
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
                ? Border.all(color: Colors.transparent, width: 0)
                : Border.all(color: Theme.of(context).colorScheme.outlineVariant),
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
