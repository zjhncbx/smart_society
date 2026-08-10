import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/role_config_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/common.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final Map<String, TextEditingController> _roleControllers = {};
  final _corpIdController = TextEditingController();
  final _appKeyController = TextEditingController();
  final _appSecretController = TextEditingController();

  @override
  void dispose() {
    for (final c in _roleControllers.values) {
      c.dispose();
    }
    _corpIdController.dispose();
    _appKeyController.dispose();
    _appSecretController.dispose();
    super.dispose();
  }

  TextEditingController _getRoleController(String roleId, String label) {
    if (!_roleControllers.containsKey(roleId)) {
      final roleConfig = context.read<RoleConfigProvider>();
      final currentLabel = roleConfig.getLabel(
        context.orgTypeRead,
        roleId,
        label,
      );
      _roleControllers[roleId] = TextEditingController(text: currentLabel);
    }
    return _roleControllers[roleId]!;
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final orgType = context.watch<SettingsProvider>().orgType;

    return Scaffold(
      appBar: AppBar(title: Text(labels.labelSettingsTitle)),
      body: ListView(
        children: [
          _SectionHeader(title: labels.orgTypeLabel),
          RadioGroup<OrgType>(
            groupValue: orgType,
            onChanged: (v) {
              if (v != null) _switchOrgType(context, v);
            },
            child: Column(
              children: OrgType.values.map((type) {
                final typeLabels = OrgLabels.forType(type);
                return ListTile(
                  leading: Radio<OrgType>(value: type),
                  title: Text(typeLabels.appTitle),
                  subtitle: Text(
                      '${typeLabels.tabMembers} · ${typeLabels.tabProjects} · ${typeLabels.tabNotices}'),
                  onTap: () => _switchOrgType(context, type),
                );
              }).toList(),
            ),
          ),
          const Divider(),
          _SectionHeader(title: labels.themeLabel),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              children: ThemeConfig.all.map((themeConfig) {
                final selected =
                    context.watch<SettingsProvider>().theme == themeConfig;
                return ChoiceChip(
                  label: Text(themeConfig.name),
                  selected: selected,
                  avatar: CircleAvatar(
                    backgroundColor: themeConfig.seedColor,
                    radius: 10,
                  ),
                  onSelected: (_) =>
                      context.read<SettingsProvider>().setTheme(themeConfig),
                );
              }).toList(),
            ),
          ),
          const Divider(),
          // ── 角色名称编辑 ──
          _SectionHeader(title: labels.labelEditRoles),
          ...labels.roles.map((role) {
            final controller = _getRoleController(role.id, role.label);
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: TextField(
                controller: controller,
                decoration: InputDecoration(
                  labelText: role.label,
                  hintText: labels.labelRoleNameHint,
                  isDense: true,
                ),
              ),
            );
          }),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                FilledButton(
                  onPressed: () => _saveRoles(orgType),
                  child: Text(labels.saveButton),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () => _resetRoles(orgType),
                  child: Text(labels.labelResetRoles),
                ),
              ],
            ),
          ),
          const Divider(),
          // ── 钉钉同步设置 ──
          _SectionHeader(title: labels.labelDingTalkSettings),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _corpIdController,
              decoration: const InputDecoration(
                labelText: 'Corp ID',
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _appKeyController,
              decoration: const InputDecoration(
                labelText: 'App Key',
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _appSecretController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'App Secret',
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                FilledButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.sync, size: 18),
                  label: Text(labels.labelSyncNow),
                ),
                const SizedBox(width: 16),
                Text(
                  '${labels.labelLastSync}: --（待接入）',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
              ],
            ),
          ),
          const Divider(),
          // ── Web管理后台 ──
          AppCard(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            onTap: () => _openWebAdmin(),
            child: Row(
              children: [
                Icon(Icons.open_in_browser,
                    color: theme.colorScheme.primary, size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(labels.labelWebAdmin,
                          style: theme.textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(labels.labelWebAdminHint,
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.outline)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: theme.colorScheme.outline),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _switchOrgType(BuildContext context, OrgType type) {
    final labels = context.labels;
    showConfirmDialog(
      context,
      title: labels.labelOrgTypeSwitchTitle,
      message: labels.labelOrgTypeSwitchMsg,
      confirmText: labels.confirmDelete,
      cancelText: labels.labelSwitchCancel,
    ).then((confirmed) {
      if (confirmed && context.mounted) {
        context.read<SettingsProvider>().setOrgType(type);
      }
    });
  }

  void _saveRoles(OrgType type) {
    final provider = context.read<RoleConfigProvider>();
    final labels = context.labels;
    for (final role in labels.roles) {
      final controller = _roleControllers[role.id];
      if (controller != null && controller.text.trim().isNotEmpty) {
        provider.setLabel(type, role.id, controller.text.trim());
      }
    }
    showToast(context, labels.saveSuccess);
  }

  void _resetRoles(OrgType type) {
    final provider = context.read<RoleConfigProvider>();
    provider.resetToDefaults(type);
    // Clear cached controllers so they get re-initialized with defaults
    for (final c in _roleControllers.values) {
      c.dispose();
    }
    _roleControllers.clear();
    setState(() {});
    if (mounted) {
      showToast(context, context.labels.saveSuccess);
    }
  }

  void _openWebAdmin() {
    // Placeholder for opening web admin
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: Theme.of(context).colorScheme.primary,
            ),
      ),
    );
  }
}
