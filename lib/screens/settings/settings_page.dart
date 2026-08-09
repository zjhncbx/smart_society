import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../models/member.dart';
import '../../models/notice.dart';
import '../../models/society_activity.dart';
import '../../providers/activity_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/role_config_provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/cloud_function_service.dart';
import '../../services/storage_service.dart';
import '../../utils/date_format.dart';
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
  bool _syncing = false;
  String _lastCloudSync = '--';

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
                      '${typeLabels.tabMembers} · ${typeLabels.tabActivities} · ${typeLabels.tabNotices}'),
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
          // ── 云端数据同步 ──
          _SectionHeader(title: labels.labelCloudSync),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                FilledButton.icon(
                  onPressed: _syncing ? null : _syncCloud,
                  icon: _syncing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.cloud_sync, size: 18),
                  label: Text(labels.labelSyncNow),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    '${labels.labelLastSync}: $_lastCloudSync',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.outline),
                    overflow: TextOverflow.ellipsis,
                  ),
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
                  onPressed: () => _syncDingTalk(),
                  icon: const Icon(Icons.sync, size: 18),
                  label: Text(labels.labelSyncNow),
                ),
                const SizedBox(width: 16),
                Text(
                  '${labels.labelLastSync}: --',
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

  Future<void> _syncCloud() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    final labels = context.labels;
    try {
      final data =
          await CloudFunctionService.instance.callChecked('get-all-data');
      final members = ((data['Member'] as List?) ?? const [])
          .map((e) => Member.fromJson(e as Map<String, dynamic>))
          .toList();
      final activities = ((data['Activity'] as List?) ?? const [])
          .map((e) => SocietyActivity.fromJson(e as Map<String, dynamic>))
          .toList();
      final notices = ((data['Notice'] as List?) ?? const [])
          .map((e) => Notice.fromJson(e as Map<String, dynamic>))
          .toList();

      if (members.isEmpty && activities.isEmpty && notices.isEmpty) {
        if (mounted) {
          showToast(context, '${labels.labelCloudSyncFail}: 云端暂无数据');
        }
        return;
      }

      final storage = StorageService.instance;
      await storage.membersBox.clear();
      for (final m in members) {
        await storage.membersBox.put(m.id, m.toJson());
      }
      await storage.activitiesBox.clear();
      for (final a in activities) {
        await storage.activitiesBox.put(a.id, a.toJson());
      }
      await storage.noticesBox.clear();
      for (final n in notices) {
        await storage.noticesBox.put(n.id, n.toJson());
      }
      if (mounted) {
        context.read<MemberProvider>().load();
        context.read<ActivityProvider>().load();
        context.read<NoticeProvider>().load();
        setState(() => _lastCloudSync =
            formatDateTime(DateTime.now()).substring(5));
      }
      if (mounted) {
        showToast(
          context,
          '${labels.labelCloudSyncDone}'
          '（${labels.tabMembers} ${members.length} · '
          '${labels.tabActivities} ${activities.length} · '
          '${labels.tabNotices} ${notices.length}）',
        );
      }
    } catch (e) {
      if (mounted) {
        showToast(context, '${labels.labelCloudSyncFail}: $e');
      }
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  void _syncDingTalk() {
    // Placeholder for DingTalk sync logic
    showToast(context, '${context.labels.labelSyncNow}...');
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
