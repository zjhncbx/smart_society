import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/member.dart';
import '../../providers/member_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/common.dart';
import '../../widgets/member_avatar.dart';

/// 成员详情页
class MemberDetailPage extends StatelessWidget {
  const MemberDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MemberProvider>();
    final member = provider.findById(id);

    if (member == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('成员详情')),
        body: const EmptyView(icon: Icons.person_off, message: '成员不存在'),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('成员详情'),
        actions: [
          IconButton(
            tooltip: '编辑',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/members/$id/edit'),
          ),
          IconButton(
            tooltip: '删除',
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _deleteMember(context, provider, member),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                MemberAvatar(
                  name: member.name,
                  colorIndex: member.avatarColorIndex,
                  radius: 40,
                ),
                const SizedBox(height: 12),
                Text(member.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  '${member.department} · ${member.role.label}',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Theme.of(context).colorScheme.outline),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _InfoRow(label: '学号', value: member.studentNo, icon: Icons.badge_outlined),
                const Divider(height: 1, indent: 52),
                _InfoRow(label: '部门', value: member.department, icon: Icons.apartment_outlined),
                const Divider(height: 1, indent: 52),
                _InfoRow(label: '角色', value: member.role.label, icon: Icons.star_outline),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: '电话',
                  value: member.phone.isEmpty ? '未填写' : member.phone,
                  icon: Icons.phone_outlined,
                ),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: '邮箱',
                  value: member.email.isEmpty ? '未填写' : member.email,
                  icon: Icons.mail_outline,
                ),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: '加入时间',
                  value: formatDate(member.joinedAt),
                  icon: Icons.event_outlined,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteMember(
    BuildContext context,
    MemberProvider provider,
    Member member,
  ) async {
    final ok = await showConfirmDialog(
      context,
      title: '删除成员',
      message: '确定删除成员「${member.name}」吗？',
      confirmText: '删除',
    );
    if (!ok || !context.mounted) return;
    await provider.deleteMember(member.id);
    if (context.mounted) context.pop();
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(label, style: const TextStyle(fontSize: 13)),
      trailing: Text(
        value,
        style: TextStyle(
          fontSize: 14,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
