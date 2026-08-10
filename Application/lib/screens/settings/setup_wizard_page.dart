import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/organization_provider.dart';
import '../../providers/settings_provider.dart';

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
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              Text(labels.labelSetupWelcome,
                  style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(labels.appTitle,
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      )),
              const SizedBox(height: 32),
              Text(labels.labelSetupSelectOrg,
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              RadioGroup<OrgType>(
                groupValue: _selectedType,
                onChanged: (v) => _selectType(v!),
                child: Column(
                  children: OrgType.values.map((type) {
                    final l = OrgLabels.forType(type);
                    final isSelected = _selectedType == type;
                    return Card(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primaryContainer
                          : null,
                      child: ListTile(
                        leading: Radio<OrgType>(value: type),
                        title: Text(l.appTitle,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                            '${l.tabMembers} · ${l.tabActivities} · ${l.tabNotices}'),
                        onTap: () => _selectType(type),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),
              Text(labels.labelSetupSelectTheme,
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ThemeConfig.all.map((theme) {
                  final selected = _selectedTheme == theme;
                  return ChoiceChip(
                    label: Text(theme.name),
                    selected: selected,
                    avatar: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: theme.seedColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    onSelected: (_) => setState(() => _selectedTheme = theme),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: '组织名称',
                  hintText: '请输入组织名称，不可与其他组织重复',
                  border: OutlineInputBorder(),
                ),
              ),
              if (isSocialOrg) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _creditCodeController,
                  decoration: const InputDecoration(
                    labelText: '统一社会信用代码',
                    hintText: '18位统一社会信用代码',
                    border: OutlineInputBorder(),
                  ),
                  maxLength: 18,
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _creating ? null : () => _confirm(),
                  child: _creating
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(labels.labelSetupStart),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirm() async {
    final name = _nameController.text.trim();
    debugPrint('[_confirm] name="$name" type=${_selectedType.name}');
    if (name.isEmpty) {
      debugPrint('[_confirm] name empty -> show snackbar');
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('请输入组织名称')));
      return;
    }
    if (_selectedType == OrgType.socialOrg) {
      final code = _creditCodeController.text.trim();
      if (code.length != 18) {
        debugPrint('[_confirm] creditCode invalid len=${code.length}');
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('请输入18位统一社会信用代码')));
        return;
      }
    }
    setState(() => _creating = true);
    try {
      final settings = context.read<SettingsProvider>();
      final orgProvider = context.read<OrganizationProvider>();
      await settings.setOrgType(_selectedType);
      await settings.setTheme(_selectedTheme);
      debugPrint('[_confirm] calling createOrg name="$name"');

      // 创建首个组织
      await orgProvider.createOrg(
        name: name,
        orgType: _selectedType.name,
        creditCode: _creditCodeController.text.trim(),
      );

      await settings.completeSetup();
      debugPrint('[_confirm] createOrg OK, goto /members');
      if (!mounted) return;
      context.go('/members');
    } catch (e) {
      debugPrint('[_confirm] FAILED: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('创建失败: $e')));
      setState(() => _creating = false);
    }
  }
}
