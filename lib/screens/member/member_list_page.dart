import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/member.dart';
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
    final provider = context.watch<MemberProvider>();
    final members = provider.filteredMembers;

    return Scaffold(
      appBar: AppBar(title: const Text('成员管理')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: provider.setKeyword,
              decoration: InputDecoration(
                hintText: '搜索姓名 / 学号 / 部门',
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
                  label: '全部',
                  selected: provider.roleFilter == null,
                  onTap: () => provider.setRoleFilter(null),
                ),
                for (final role in MemberRole.values)
                  _RoleChip(
                    label: role.label,
                    selected: provider.roleFilter == role,
                    onTap: () => provider.setRoleFilter(role),
                  ),
              ],
            ),
          ),
          Expanded(
            child: members.isEmpty
                ? EmptyView(
                    icon: Icons.people_outline,
                    message: '没有符合条件的成员',
                    action: FilledButton.icon(
                      onPressed: () => context.push('/members/new'),
                      icon: const Icon(Icons.add),
                      label: const Text('添加成员'),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 88),
                    itemCount: members.length,
                    itemBuilder: (context, index) {
                      final member = members[index];
                      return ListTile(
                        leading: MemberAvatar(
                          name: member.name,
                          colorIndex: member.avatarColorIndex,
                        ),
                        title: Text(member.name),
                        subtitle: Text(
                          '${member.department} · 学号 ${member.studentNo}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: _RoleBadge(role: member.role),
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
        label: const Text('添加成员'),
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
  const _RoleBadge({required this.role});

  final MemberRole role;

  @override
  Widget build(BuildContext context) {
    final color = switch (role) {
      MemberRole.president => const Color(0xFFE06B3D),
      MemberRole.director => const Color(0xFF3D6BD6),
      MemberRole.officer => const Color(0xFF4FB3A6),
      MemberRole.member => const Color(0xFF8A8F99),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        role.label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
