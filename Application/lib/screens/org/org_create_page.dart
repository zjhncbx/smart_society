import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_labels.dart';
import '../../config/org_type.dart';
import '../../providers/organization_provider.dart';

class OrgCreatePage extends StatefulWidget {
  const OrgCreatePage({super.key});

  @override
  State<OrgCreatePage> createState() => _OrgCreatePageState();
}

class _OrgCreatePageState extends State<OrgCreatePage> {
  final _nameController = TextEditingController();
  final _creditCodeController = TextEditingController();
  final _descController = TextEditingController();
  OrgType _selectedType = OrgType.schoolClub;
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _creditCodeController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSocialOrg = _selectedType == OrgType.socialOrg;

    return Scaffold(
      appBar: AppBar(title: const Text('注册组织')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('选择组织类型', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: OrgType.values.map((type) {
              final l = OrgLabels.forType(type);
              return ChoiceChip(
                label: Text(l.appTitle),
                selected: _selectedType == type,
                onSelected: (_) => setState(() => _selectedType = type),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: '组织名称', hintText: '请输入组织名称，不可与其他组织重复'),
          ),
          const SizedBox(height: 12),
          if (isSocialOrg)
            TextField(
              controller: _creditCodeController,
              decoration: const InputDecoration(
                labelText: '统一社会信用代码',
                hintText: '18位统一社会信用代码',
              ),
              maxLength: 18,
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _descController,
            decoration: const InputDecoration(labelText: '组织简介', hintText: '可选'),
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: _saving ? null : _create,
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('注册组织'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _create() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入组织名称')));
      return;
    }
    if (_selectedType == OrgType.socialOrg) {
      final code = _creditCodeController.text.trim();
      if (code.length != 18) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入18位统一社会信用代码')));
        return;
      }
    }

    setState(() => _saving = true);
    try {
      final provider = context.read<OrganizationProvider>();
      await provider.createOrg(
        name: name,
        orgType: _selectedType.name,
        creditCode: _creditCodeController.text.trim(),
        description: _descController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('组织注册成功')));
        context.go('/members');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('注册失败: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
