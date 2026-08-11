import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/project.dart';
import '../../providers/member_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/common.dart';

/// 项目创建/编辑表单
class ProjectFormPage extends StatefulWidget {
  const ProjectFormPage({super.key, this.id});

  /// 为 null 时表示新增
  final String? id;

  @override
  State<ProjectFormPage> createState() => _ProjectFormPageState();
}

class _ProjectFormPageState extends State<ProjectFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descController;
  late final TextEditingController _budgetController;
  String? _managerId;
  DateTime? _startDate;
  DateTime? _endDate;
  Project? _existing;

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _existing = context.read<ProjectProvider>().findById(widget.id!);
    }
    _nameController = TextEditingController(text: _existing?.name ?? '');
    _descController = TextEditingController(text: _existing?.description ?? '');
    _budgetController = TextEditingController(
      text: (_existing?.budget ?? 0) > 0
          ? _existing!.budget.toString()
          : '',
    );
    _managerId = _existing?.managerId;
    _startDate = _existing?.startDate;
    _endDate = _existing?.endDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _budgetController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final initial = isStart ? _startDate : _endDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 10),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate == null || _endDate!.isBefore(picked)) {
          _endDate = picked.add(const Duration(days: 7));
        }
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<ProjectProvider>();
    final labels = context.labelsRead;

    if (_isEdit && _existing != null) {
      _existing!.name = _nameController.text.trim();
      _existing!.description = _descController.text.trim();
      _existing!.managerId = _managerId ?? '';
      _existing!.startDate = _startDate!;
      _existing!.endDate = _endDate!;
      _existing!.budget = double.tryParse(_budgetController.text) ?? 0;
      await provider.saveProject(_existing!);
    } else {
      final project = Project(
        id: ProjectProvider.nextProjectId(provider.projects),
        name: _nameController.text.trim(),
        description: _descController.text.trim(),
        managerId: _managerId ?? '',
        startDate: _startDate ?? DateTime.now(),
        endDate: _endDate ?? DateTime.now(),
        status: kProjectPreparing,
        budget: double.tryParse(_budgetController.text) ?? 0,
        createdAt: DateTime.now(),
      );
      await provider.saveProject(project);
    }
    if (!mounted) return;
    showToast(context, _isEdit ? labels.saveSuccess : labels.labelProjectCreated);
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final members = context.watch<MemberProvider>().members;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? labels.projectDetailTitle : labels.createProjectTitle),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(labelText: '${labels.labelProjectName} *'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? labels.labelProjectNameRequired : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _managerId,
              decoration: InputDecoration(labelText: '${labels.labelManager} *'),
              hint: Text(labels.labelManagerRequired),
              items: members.map((m) {
                return DropdownMenuItem(value: m.id, child: Text(m.name));
              }).toList(),
              onChanged: (v) => setState(() => _managerId = v),
              validator: (v) => (v == null || v.isEmpty) ? labels.labelManagerRequired : null,
            ),
            const SizedBox(height: 12),
            _DateField(
              label: '${labels.labelStartDate} *',
              value: _startDate,
              onTap: () => _pickDate(isStart: true),
              validator: (_) => _startDate == null ? labels.labelStartDateRequired : null,
            ),
            const SizedBox(height: 12),
            _DateField(
              label: '${labels.labelEndDate} *',
              value: _endDate,
              onTap: () => _pickDate(isStart: false),
              validator: (_) => _endDate == null
                  ? labels.labelEndDateRequired
                  : (_startDate != null && _endDate!.isBefore(_startDate!))
                      ? labels.labelEndDateRequired
                      : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descController,
              decoration: InputDecoration(labelText: labels.labelProjectDesc),
              maxLines: 5,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _budgetController,
              decoration: InputDecoration(
                labelText:
                    '${FinanceLabels.forType(context.orgTypeRead).budgetLabel}（元）',
                hintText: '0 = 未设置预算',
              ),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
              ],
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _save,
              child: Text(labels.saveButton),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
    required this.validator,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;
  final FormFieldValidator<String> validator;

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      validator: validator,
      builder: (field) => InkWell(
        onTap: () {
          onTap();
          field.validate();
        },
        borderRadius: BorderRadius.circular(14),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            errorText: field.errorText,
          ),
          child: Row(
            children: [
              const Icon(Icons.event_outlined, size: 18),
              const SizedBox(width: 10),
              Text(value == null ? '--' : formatDate(value!)),
            ],
          ),
        ),
      ),
    );
  }
}
