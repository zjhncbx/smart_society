import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../providers/member_provider.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/member_avatar.dart';

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

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<MemberProvider>();
    final members = provider.filteredMembers;

    return Scaffold(
      appBar: AppBar(title: Text(labels.memberMgmtTitle)),
      body: Column(
        children: [
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
                    action: FilledButton.icon(
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
      floatingActionButton: FloatingActionButton.extended(
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
