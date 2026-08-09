import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

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
  MemberRole _role = MemberRole.member;
  Member? _existing;

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
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
      _role = _existing!.role;
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
      role: _role,
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      joinedAt: _existing?.joinedAt ?? DateTime.now(),
    );
    await provider.saveMember(member);
    if (!mounted) return;
    showToast(context, _isEdit ? '已保存修改' : '成员添加成功');
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? '编辑成员' : '添加成员')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: '姓名 *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入姓名' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _studentNoController,
              decoration: const InputDecoration(labelText: '学号 *'),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入学号' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _departmentController,
              decoration: const InputDecoration(labelText: '部门 *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入部门' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<MemberRole>(
              initialValue: _role,
              decoration: const InputDecoration(labelText: '角色'),
              items: [
                for (final role in MemberRole.values)
                  DropdownMenuItem(value: role, child: Text(role.label)),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _role = value);
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: '电话'),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: '邮箱'),
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return null;
                final email = v.trim();
                final ok = RegExp(r'^[\w.-]+@[\w-]+(\.[\w-]+)+$')
                    .hasMatch(email);
                return ok ? null : '邮箱格式不正确';
              },
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _save,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(_isEdit ? '保存修改' : '添加成员'),
            ),
          ],
        ),
      ),
    );
  }
}
