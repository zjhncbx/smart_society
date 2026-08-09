import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../providers/member_provider.dart';
import '../../widgets/common.dart';
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
                ? EmptyView(
                    icon: Icons.people_outline,
                    message: labels.emptyMembers,
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
                        trailing: _RoleBadge(
                          roleLabel: member.roleLabel,
                          colorIndex: roleIndex,
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

/// 成员角色徽标
class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.roleLabel, required this.colorIndex});

  final String roleLabel;
  final int colorIndex;

  static const _colors = [
    Color(0xFFE06B3D),
    Color(0xFF3D6BD6),
    Color(0xFF4FB3A6),
    Color(0xFF8A8F99),
    Color(0xFF9B59B6),
    Color(0xFFE67E22),
  ];

  @override
  Widget build(BuildContext context) {
    final color = colorIndex >= 0
        ? _colors[colorIndex % _colors.length]
        : _colors.last;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        roleLabel,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
