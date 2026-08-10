import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/settings_provider.dart';

class SetupWizardPage extends StatefulWidget {
  const SetupWizardPage({super.key});

  @override
  State<SetupWizardPage> createState() => _SetupWizardPageState();
}

class _SetupWizardPageState extends State<SetupWizardPage> {
  OrgType _selectedType = OrgType.schoolClub;
  ThemeConfig _selectedTheme = ThemeConfig.campus;

  @override
  Widget build(BuildContext context) {
    final labels = OrgLabels.forType(_selectedType);
    return Scaffold(
      body: SafeArea(
        child: Padding(
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
                onChanged: (v) => setState(() => _selectedType = v!),
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
                        onTap: () => setState(() => _selectedType = type),
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
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => _confirm(),
                  child: Text(labels.labelSetupStart),
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
    final settings = context.read<SettingsProvider>();
    await settings.setOrgType(_selectedType);
    await settings.setTheme(_selectedTheme);
    await settings.completeSetup();
    if (mounted) {
      context.go('/members');
    }
  }
}
