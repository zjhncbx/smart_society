import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../models/member.dart';
import '../../providers/member_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/role_config_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/common.dart';
import '../../widgets/member_avatar.dart';

/// 成员详情页
class MemberDetailPage extends StatelessWidget {
  const MemberDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<MemberProvider>();
    final member = provider.findById(id);

    if (member == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.memberDetailTitle)),
        body: EmptyView(
          icon: Icons.person_off,
          message: labels.labelMemberNotExist,
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.memberDetailTitle),
        actions: provider.isDingTalkManaged
            ? [
                IconButton(
                  tooltip: '变更部门',
                  icon: const Icon(Icons.apartment_outlined),
                  onPressed: () => _changeDepartment(context, member),
                ),
                IconButton(
                  tooltip: labels.labelChangeRole,
                  icon: const Icon(Icons.supervised_user_circle_outlined),
                  onPressed: () => _changeRole(context, member),
                ),
              ]
            : [
                IconButton(
                  tooltip: labels.editTooltip,
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () => context.push('/members/$id/edit'),
                ),
                IconButton(
                  tooltip: labels.deleteTooltip,
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    final ok = await showConfirmDialog(
                      context,
                      title: labels.deleteMemberTitle,
                      message: labels.confirmDeleteMsg
                          .replaceAll('{type}', labels.deleteMemberTitle)
                          .replaceAll('{name}', member.name),
                      confirmText: labels.labelDelete,
                    );
                    if (!ok || !context.mounted) return;
                    await provider.deleteMember(member.id);
                    if (context.mounted) context.pop();
                  },
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
                Text(member.name,
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  '${member.department} · ${member.roleLabel}',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(
                          color: Theme.of(context).colorScheme.outline),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _InfoRow(
                    label: labels.labelStudentNo,
                    value: member.studentNo,
                    icon: Icons.badge_outlined),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                    label: labels.deptLabel,
                    value: member.department,
                    icon: Icons.apartment_outlined),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                    label: labels.labelRole,
                    value: member.roleLabel,
                    icon: Icons.star_outline),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: labels.labelPhone,
                  value: member.phone.isEmpty ? labels.notFilled : member.phone,
                  icon: Icons.phone_outlined,
                ),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: labels.labelEmail,
                  value:
                      member.email.isEmpty ? labels.notFilled : member.email,
                  icon: Icons.mail_outline,
                ),
                const Divider(height: 1, indent: 52),
                _InfoRow(
                  label: labels.labelJoinDate,
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

  Future<void> _changeDepartment(
    BuildContext context,
    Member member,
  ) async {
    final labels = context.labelsRead;
    final controller = TextEditingController(text: member.department);
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('变更部门'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(labelText: labels.deptLabel),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(labels.labelSwitchCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(labels.saveButton),
          ),
        ],
      ),
    );
    if (saved != true || !context.mounted) return;
    final department = controller.text.trim();
    if (department.isEmpty) {
      showToast(context, '请输入部门');
      return;
    }
    await context
        .read<MemberProvider>()
        .changeDepartment(member.id, department);
    if (!context.mounted) return;
    showToast(context, labels.saveSuccess);
  }

  Future<void> _changeRole(BuildContext context, Member member) async {
    final labels = context.labelsRead;
    final roleConfig = context.read<RoleConfigProvider>();
    final orgId = context.read<OrganizationProvider>().currentOrgId ?? '';
    final available = labels.roles;
    var selectedId = available.any((r) => r.id == member.roleId)
        ? member.roleId
        : available.first.id;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text(labels.labelChangeRole),
          content: DropdownButtonFormField<String>(
            initialValue: selectedId,
            decoration: InputDecoration(labelText: labels.labelRole),
            items: [
              for (final role in available)
                DropdownMenuItem(
                  value: role.id,
                  child: Text(roleConfig.getLabel(orgId, role.id, role.label)),
                ),
            ],
            onChanged: (value) {
              if (value != null) setState(() => selectedId = value);
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text(labels.labelSwitchCancel),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text(labels.saveButton),
            ),
          ],
        ),
      ),
    );
    if (saved != true || !context.mounted) return;

    final role = available.firstWhere((r) => r.id == selectedId);
    await context.read<MemberProvider>().changeRole(
      member.id,
      role.id,
      roleConfig.getLabel(orgId, role.id, role.label),
    );
    if (!context.mounted) return;
    showToast(context, labels.saveSuccess);
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
