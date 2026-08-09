import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../config/theme_config.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/common.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    return Scaffold(
      appBar: AppBar(title: const Text('设置')),
      body: ListView(
        children: [
          _SectionHeader(title: labels.orgTypeLabel),
          RadioGroup<OrgType>(
            groupValue: context.watch<SettingsProvider>().orgType,
            onChanged: (v) {
              if (v != null) _switchOrgType(context, v);
            },
            child: Column(
              children: OrgType.values.map((type) {
                final typeLabels = OrgLabels.forType(type);
                return ListTile(
                  leading: Radio<OrgType>(value: type),
                  title: Text(typeLabels.appTitle),
                  subtitle: Text('${typeLabels.tabMembers} · ${typeLabels.tabActivities} · ${typeLabels.tabNotices}'),
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
              children: ThemeConfig.all.map((theme) {
                final selected = context.watch<SettingsProvider>().theme == theme;
                return ChoiceChip(
                  label: Text(theme.name),
                  selected: selected,
                  avatar: CircleAvatar(
                    backgroundColor: theme.seedColor,
                    radius: 10,
                  ),
                  onSelected: (_) => context.read<SettingsProvider>().setTheme(theme),
                );
              }).toList(),
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
      title: '切换${labels.orgTypeLabel}',
      message: '切换组织类型将重置角色和部门标签，确定继续？',
      confirmText: labels.confirmDelete,
      cancelText: '取消',
    ).then((confirmed) {
      if (confirmed && context.mounted) {
        context.read<SettingsProvider>().setOrgType(type);
      }
    });
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
