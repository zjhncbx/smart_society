import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/member.dart';
import '../../providers/member_provider.dart';
import '../../widgets/common.dart';

/// 成员添加/编辑表单
class MemberFormPage extends StatefulWidget {
  const MemberFormPage({super.key, this.id});

  /// 为 null 时表示新增
  final String? id;

  @override
  State<MemberFormPage> createState() => _MemberFormPageState();
}

class _MemberFormPageState extends State<MemberFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _studentNoController;
  late final TextEditingController _departmentController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  String _roleId = '';
  String _roleLabel = '';
  Member? _existing;

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    final defaultLabels = OrgLabels.forType(context.orgTypeRead);
    _roleId = defaultLabels.roles.first.id;
    _roleLabel = defaultLabels.roles.first.label;
    if (_isEdit) {
      _existing = context.read<MemberProvider>().findById(widget.id!);
    }
    _nameController = TextEditingController(text: _existing?.name ?? '');
    _studentNoController =
        TextEditingController(text: _existing?.studentNo ?? '');
    _departmentController =
        TextEditingController(text: _existing?.department ?? '');
    _phoneController = TextEditingController(text: _existing?.phone ?? '');
    _emailController = TextEditingController(text: _existing?.email ?? '');
    if (_existing != null) {
      _roleId = _existing!.roleId;
      _roleLabel = _existing!.roleLabel;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _studentNoController.dispose();
    _departmentController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<MemberProvider>();

    final member = Member(
      id: _existing?.id ?? MemberProvider.nextId(provider.members),
      name: _nameController.text.trim(),
      studentNo: _studentNoController.text.trim(),
      department: _departmentController.text.trim(),
      roleId: _roleId,
      roleLabel: _roleLabel,
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      joinedAt: _existing?.joinedAt ?? DateTime.now(),
    );
    await provider.saveMember(member);
    if (!mounted) return;
    final labels = context.labels;
    showToast(context, _isEdit ? labels.saveSuccess : labels.addSuccess);
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? labels.editMemberTitle : labels.addMemberTitle),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _SectionHeader(title: '基本信息'),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(labelText: '${labels.labelName} *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? labels.labelTitleRequired : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _studentNoController,
              decoration:
                  InputDecoration(labelText: '${labels.labelStudentNo} *'),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty)
                      ? labels.labelStudentNoRequired
                      : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _departmentController,
              decoration: InputDecoration(labelText: '${labels.deptLabel} *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty)
                      ? labels.labelDeptRequired
                      : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _roleId,
              decoration: InputDecoration(labelText: labels.labelRole),
              items: [
                for (final role in labels.roles)
                  DropdownMenuItem(value: role.id, child: Text(role.label)),
              ],
              onChanged: (value) {
                if (value != null) {
                  final selected =
                      labels.roles.firstWhere((r) => r.id == value);
                  setState(() {
                    _roleId = value;
                    _roleLabel = selected.label;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            _SectionHeader(title: '联系方式'),
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(labelText: labels.labelPhone),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(labelText: labels.labelEmail),
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return null;
                final email = v.trim();
                final ok = RegExp(r'^[\w.-]+@[\w-]+(\.[\w-]+)+$')
                    .hasMatch(email);
                return ok ? null : labels.labelEmailInvalid;
              },
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _save,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                  _isEdit ? labels.saveButton : labels.addMemberTitle),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: cs.primary,
        ),
      ),
    );
  }
}
