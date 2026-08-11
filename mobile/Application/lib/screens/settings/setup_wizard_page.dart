import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/organization_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/common.dart';

class SetupWizardPage extends StatefulWidget {
  const SetupWizardPage({super.key});

  @override
  State<SetupWizardPage> createState() => _SetupWizardPageState();
}

class _SetupWizardPageState extends State<SetupWizardPage> {
  OrgType _selectedType = OrgType.schoolClub;
  ThemeConfig _selectedTheme = ThemeConfig.campus;
  bool _creating = false;
  final _nameController = TextEditingController();
  final _creditCodeController = TextEditingController();

  static const _defaultNames = {
    OrgType.schoolClub: '我的社团',
    OrgType.volunteerTeam: '我的志愿队',
    OrgType.socialOrg: '我的组织',
  };

  @override
  void initState() {
    super.initState();
    _nameController.text = _defaultNames[_selectedType] ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _creditCodeController.dispose();
    super.dispose();
  }

  void _selectType(OrgType type) {
    setState(() {
      _selectedType = type;
      _nameController.text = _defaultNames[type] ?? '';
      _creditCodeController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = OrgLabels.forType(_selectedType);
    final isSocialOrg = _selectedType == OrgType.socialOrg;
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              Text(labels.labelSetupWelcome,
                  style: theme.textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(labels.appTitle,
                  style: theme.textTheme.headlineLarge?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      )),
              const SizedBox(height: 32),
              Text(labels.labelSetupSelectOrg,
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: OrgType.values.map((type) {
                  final l = OrgLabels.forType(type);
                  return ChoiceChip(
                    label: Text(l.appTitle),
                    selected: _selectedType == type,
                    onSelected: (_) => _selectType(type),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              Text(labels.labelSetupSelectTheme,
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ThemeConfig.all.map((themeConfig) {
                  return ChoiceChip(
                    label: Text(themeConfig.name),
                    selected: _selectedTheme == themeConfig,
                    avatar: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: themeConfig.seedColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    onSelected: (_) =>
                        setState(() => _selectedTheme = themeConfig),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: '组织全称',
                  hintText: '请输入组织全称，不可与其他组织重复',
                ),
                textInputAction: isSocialOrg
                    ? TextInputAction.next
                    : TextInputAction.done,
                onSubmitted: isSocialOrg
                    ? (_) => FocusScope.of(context).nextFocus()
                    : (_) => _confirm(),
              ),
              if (isSocialOrg) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _creditCodeController,
                  decoration: const InputDecoration(
                    labelText: '统一社会信用代码',
                    hintText: '18位统一社会信用代码',
                  ),
                  maxLength: 18,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _confirm(),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ChoiceChip(
                  label: _creating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(labels.labelSetupStart),
                  selected: false,
                  onSelected: _creating ? null : (_) => _confirm(),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('或者',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.outline)),
                  ),
                  const Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ChoiceChip(
                  label: const Text('加入已有组织'),
                  selected: false,
                  onSelected: (_) => _joinOrg(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirm() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      showToast(context, '请输入组织全称');
      return;
    }
    if (_selectedType == OrgType.socialOrg) {
      final code = _creditCodeController.text.trim();
      if (code.length != 18) {
        showToast(context, '请输入18位统一社会信用代码');
        return;
      }
    }
    setState(() => _creating = true);
    try {
      final settings = context.read<SettingsProvider>();
      final orgProvider = context.read<OrganizationProvider>();
      await settings.setOrgType(_selectedType);
      await settings.setTheme(_selectedTheme);
      await orgProvider.createOrg(
        name: name,
        orgType: _selectedType.name,
        creditCode: _creditCodeController.text.trim(),
      );
      // 主题为组织级设置：组织创建后再保存一次，写入新组织
      await settings.setTheme(_selectedTheme);
      // 创建成功后由 app 层根据 hasOrg/isInitialized 自动切换到主界面，无需手动跳转
      await settings.completeSetup();
    } catch (e) {
      if (!mounted) return;
      showToast(context, '创建失败: $e');
      setState(() => _creating = false);
    }
  }

  void _joinOrg() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('加入组织'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: '输入组织ID'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              final id = controller.text.trim();
              if (id.isEmpty) return;
              try {
                await context.read<OrganizationProvider>().joinOrg(id);
                if (ctx.mounted) Navigator.pop(ctx);
                // 加入成功后由 app 层自动切换到主界面
                if (mounted) {
                  context.read<SettingsProvider>().completeSetup();
                }
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx)
                      .showSnackBar(SnackBar(content: Text('加入失败: $e')));
                }
              }
            },
            child: const Text('加入'),
          ),
        ],
      ),
    );
  }
}
