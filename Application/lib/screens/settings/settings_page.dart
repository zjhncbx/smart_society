import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/role_config_provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/dingtalk_sync_service.dart';
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
  final _clientIdController = TextEditingController();
  final _clientSecretController = TextEditingController();
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    final settings = context.read<SettingsProvider>();
    final orgId = settings.currentOrgId ?? '';
    _clientIdController.text = settings.dingTalkClientId(orgId) ?? '';
    _clientSecretController.text = settings.dingTalkClientSecret(orgId) ?? '';
  }

  @override
  void dispose() {
    for (final c in _roleControllers.values) {
      c.dispose();
    }
    _clientIdController.dispose();
    _clientSecretController.dispose();
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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.save_outlined),
          tooltip: labels.saveButton,
          onPressed: () {
            _saveRoles(context.read<SettingsProvider>().orgType);
            _saveDingTalkConfig();
          },
        ),
        title: Text(labels.labelSettingsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            tooltip: '返回',
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
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
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _saveRoles(orgType),
              ),
            );
          }),
          ListTile(
            leading: Icon(Icons.save_outlined, color: theme.colorScheme.primary),
            title: Text(labels.saveButton),
            onTap: () => _saveRoles(orgType),
          ),
          ListTile(
            leading: Icon(Icons.refresh, color: theme.colorScheme.outline),
            title: Text(labels.labelResetRoles),
            onTap: () => _resetRoles(orgType),
          ),
          const Divider(),
          // ── 钉钉同步设置（凭证按组织配置）──
          _SectionHeader(title: labels.labelDingTalkSettings),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _clientIdController,
              decoration: const InputDecoration(
                labelText: 'Client ID (AppKey)',
                isDense: true,
              ),
              textInputAction: TextInputAction.next,
              onSubmitted: (_) => FocusScope.of(context).nextFocus(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _clientSecretController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Client Secret (AppSecret)',
                isDense: true,
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _saveDingTalkConfig(),
            ),
          ),
          ListTile(
            leading: Icon(Icons.save_outlined, color: theme.colorScheme.primary),
            title: Text(labels.saveButton),
            onTap: _saveDingTalkConfig,
          ),
          ListTile(
            leading: _syncing
                ? SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2,
                        color: theme.colorScheme.primary),
                  )
                : Icon(Icons.sync, color: theme.colorScheme.outline),
            title: Text(_syncing
                ? labels.labelDingTalkSyncing
                : labels.labelSyncNow),
            enabled: !_syncing && _dingTalkConfigured,
            onTap: _syncing ? null : _syncDingTalk,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Text(
              _lastSyncText,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.outline),
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
    for (final c in _roleControllers.values) {
      c.dispose();
    }
    _roleControllers.clear();
    setState(() {});
    if (mounted) {
      showToast(context, context.labels.saveSuccess);
    }
  }

  void _openWebAdmin() {}

  String get _orgId => context.read<SettingsProvider>().currentOrgId ?? '';

  bool get _dingTalkConfigured =>
      context.read<SettingsProvider>().isDingTalkConfigured(_orgId);

  String get _lastSyncText {
    final settings = context.read<SettingsProvider>();
    return settings.dingTalkLastResult(_orgId) ?? labelsText.labelDingTalkNeverSynced;
  }

  OrgLabels get labelsText => context.labels;

  Future<void> _saveDingTalkConfig() async {
    FocusScope.of(context).unfocus();
    final labels = context.labels;
    final orgId = _orgId;
    if (orgId.isEmpty) {
      showToast(context, '请先加入组织');
      return;
    }
    final clientId = _clientIdController.text.trim();
    final clientSecret = _clientSecretController.text.trim();
    if (clientId.isEmpty || clientSecret.isEmpty) {
      showToast(context, '请填写 Client ID 与 Client Secret');
      return;
    }
    try {
      await context
          .read<SettingsProvider>()
          .setDingTalkConfig(orgId, clientId, clientSecret);
      if (!mounted) return;
      setState(() {});
      showToast(context, labels.saveSuccess);
    } catch (e) {
      if (!mounted) return;
      showToast(context, '保存失败：$e');
    }
  }

  Future<void> _syncDingTalk() async {
    FocusScope.of(context).unfocus();
    final labels = context.labels;
    final settings = context.read<SettingsProvider>();
    final orgId = _orgId;
    if (orgId.isEmpty) {
      showToast(context, '请先加入组织');
      return;
    }
    final clientId = settings.dingTalkClientId(orgId) ?? '';
    final clientSecret = settings.dingTalkClientSecret(orgId) ?? '';
    if (clientId.isEmpty || clientSecret.isEmpty) {
      showToast(context, '请先保存 Client ID 与 Client Secret');
      return;
    }
    final roleConfig = context.read<RoleConfigProvider>();
    final defaultRole = labels.roles.firstWhere(
      (r) => r.maxCount != 1,
      orElse: () => labels.roles.last,
    );
    final roleLabel = roleConfig.getLabel(
      context.orgTypeRead,
      defaultRole.id,
      defaultRole.label,
    );
    setState(() => _syncing = true);
    try {
      final result = await DingTalkSyncService.instance.performSync(
        orgId: orgId,
        clientId: clientId,
        clientSecret: clientSecret,
        roleId: defaultRole.id,
        roleLabel: roleLabel,
      );
      if (!mounted) return;
      final resultText =
          '${labels.labelDingTalkLastSync}: ${formatDateTime(result.syncedAt)} · 新增 ${result.contactsAdded} · 更新 ${result.contactsUpdated}';
      await settings.setDingTalkLastSync(orgId, result.syncedAt, resultText);
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
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
