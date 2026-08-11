import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/organization_provider.dart';
import '../../providers/role_config_provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/dingtalk_api.dart';
import '../../services/dingtalk_sync_service.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/common.dart';
import '../../widgets/dingtalk_dept_picker.dart';

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
    final orgId = _orgId;
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
        _orgId,
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
    final isSocialOrg = orgType == OrgType.socialOrg;
    // 非管理员（含角色未刷新的 null）不允许修改设置
    final isAdmin =
        context.watch<OrganizationProvider>().currentOrgRole == 'admin';

    return Scaffold(
      appBar: AppBar(title: Text(labels.labelSettingsTitle)),
      body: isAdmin
          ? ListView(
              children: [
                _SectionHeader(title: labels.themeLabel),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Wrap(
                    spacing: 8,
                    children: ThemeConfig.all.map((themeConfig) {
                      final selected =
                          context.watch<SettingsProvider>().theme ==
                          themeConfig;
                      return ChoiceChip(
                        label: Text(themeConfig.name),
                        selected: selected,
                        avatar: CircleAvatar(
                          backgroundColor: themeConfig.seedColor,
                          radius: 10,
                        ),
                        onSelected: (_) => context
                            .read<SettingsProvider>()
                            .setTheme(themeConfig),
                      );
                    }).toList(),
                  ),
                ),
                const Divider(),
                _SectionHeader(title: labels.labelEditRoles),
                ...labels.roles.map((role) {
                  final controller = _getRoleController(role.id, role.label);
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    child: TextField(
                      controller: controller,
                      decoration: InputDecoration(
                        labelText: role.label,
                        hintText: labels.labelRoleNameHint,
                        isDense: true,
                      ),
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _saveRoles(),
                    ),
                  );
                }),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Wrap(
                    spacing: 8,
                    children: [
                      ChoiceChip(
                        label: Text(labels.saveButton),
                        selected: false,
                        onSelected: (_) => _saveRoles(),
                      ),
                      ChoiceChip(
                        label: Text(labels.labelResetRoles),
                        selected: false,
                        onSelected: (_) => _resetRoles(),
                      ),
                    ],
                  ),
                ),
                if (isSocialOrg) ...[
                  const Divider(),
                  _SectionHeader(title: labels.labelDingTalkSettings),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    child: TextField(
                      controller: _clientIdController,
                      decoration: const InputDecoration(
                        labelText: 'Client ID (AppKey)',
                        isDense: true,
                      ),
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
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
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Wrap(
                      spacing: 8,
                      children: [
                        ChoiceChip(
                          label: Text(labels.saveButton),
                          selected: false,
                          onSelected: (_) => _saveDingTalkConfig(),
                        ),
                        ChoiceChip(
                          label: Text(
                            _syncing
                                ? labels.labelDingTalkSyncing
                                : labels.labelSyncNow,
                          ),
                          selected: false,
                          avatar: _syncing
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.sync, size: 18),
                          onSelected: _syncing || !_dingTalkConfigured
                              ? null
                              : (_) => _syncDingTalk(),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      _lastSyncText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  ),
                ],
                const Divider(),
                AppCard(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  onTap: () => _openWebAdmin(),
                  child: Row(
                    children: [
                      Icon(
                        Icons.open_in_browser,
                        color: theme.colorScheme.primary,
                        size: 28,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              labels.labelWebAdmin,
                              style: theme.textTheme.titleSmall,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              labels.labelWebAdminHint,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.outline,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.chevron_right,
                        color: theme.colorScheme.outline,
                      ),
                    ],
                  ),
                ),
              ],
            )
          : Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 48,
                      color: theme.colorScheme.outline,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '仅组织管理员可以修改设置',
                      style: theme.textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '如需修改请由组织管理员操作，或切换到您担任管理员的组织',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Future<void> _saveRoles() async {
    final provider = context.read<RoleConfigProvider>();
    final labels = context.labelsRead;
    final orgId = _orgId;
    if (orgId.isEmpty) {
      showToast(context, '请先加入组织');
      return;
    }
    try {
      for (final role in labels.roles) {
        final controller = _roleControllers[role.id];
        if (controller != null && controller.text.trim().isNotEmpty) {
          await provider.setLabel(orgId, role.id, controller.text.trim());
        }
      }
      if (!mounted) return;
      showToast(context, labels.saveSuccess);
    } catch (e) {
      if (!mounted) return;
      showToast(context, '保存失败: $e');
    }
  }

  Future<void> _resetRoles() async {
    final provider = context.read<RoleConfigProvider>();
    final orgId = _orgId;
    if (orgId.isEmpty) return;
    try {
      await provider.resetToDefaults(orgId);
      for (final c in _roleControllers.values) {
        c.dispose();
      }
      _roleControllers.clear();
      if (!mounted) return;
      setState(() {});
      showToast(context, context.labelsRead.saveSuccess);
    } catch (e) {
      if (!mounted) return;
      showToast(context, '恢复失败: $e');
    }
  }

  void _openWebAdmin() {}

  /// 当前组织 ID：优先取 OrganizationProvider（唯一事实源），兜底 SettingsProvider
  String get _orgId =>
      context.read<OrganizationProvider>().currentOrgId ??
      context.read<SettingsProvider>().currentOrgId ??
      '';

  bool get _dingTalkConfigured =>
      context.read<SettingsProvider>().isDingTalkConfigured(_orgId);

  String get _lastSyncText {
    final settings = context.read<SettingsProvider>();
    return settings.dingTalkLastResult(_orgId) ??
        context.labels.labelDingTalkNeverSynced;
  }

  Future<void> _saveDingTalkConfig() async {
    FocusScope.of(context).unfocus();
    final labels = context.labelsRead;
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
      await context.read<SettingsProvider>().setDingTalkConfig(
        orgId,
        clientId,
        clientSecret,
      );
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
    final labels = context.labelsRead;
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
      (r) => r.id == 'member',
      orElse: () => labels.roles.firstWhere(
        (r) => r.maxCount != 1,
        orElse: () => labels.roles.last,
      ),
    );
    final roleLabel = roleConfig.getLabel(
      _orgId,
      defaultRole.id,
      defaultRole.label,
    );
    setState(() => _syncing = true);
    try {
      // 1. 先选择要同步的钉钉组织（部门），再同步
      List<int>? picked;
      try {
        final departments = await DingTalkApi.instance.listDepartments(
          orgId: orgId,
          clientId: clientId,
          clientSecret: clientSecret,
        );
        if (!mounted) return;
        final lastSelection = settings.dingTalkSelectedDeptIds(orgId);
        picked = await showDingTalkDeptPicker(
          context,
          departments: departments,
          initialSelection: lastSelection.isNotEmpty
              ? lastSelection
              : const [1],
        );
      } catch (e) {
        if (!mounted) return;
        showToast(context, '获取钉钉组织架构失败: $e');
        return;
      }
      if (picked == null || !mounted) return; // 用户取消
      if (picked.isEmpty) {
        if (!mounted) return;
        showToast(context, '请至少选择一个组织');
        return;
      }
      await settings.setDingTalkSelectedDeptIds(orgId, picked);

      // 2. 执行同步
      final result = await DingTalkSyncService.instance.performSync(
        orgId: orgId,
        clientId: clientId,
        clientSecret: clientSecret,
        roleId: defaultRole.id,
        roleLabel: roleLabel,
        deptIds: picked,
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
