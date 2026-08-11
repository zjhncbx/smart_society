import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/finance_record.dart';
import '../../providers/finance_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/common.dart';

class FinanceRecordFormPage extends StatefulWidget {
  const FinanceRecordFormPage({super.key, this.projectId});

  final String? projectId;

  @override
  State<FinanceRecordFormPage> createState() => _FinanceRecordFormPageState();
}

class _FinanceRecordFormPageState extends State<FinanceRecordFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  late final TextEditingController _summaryController;
  late final TextEditingController _counterpartyController;
  late final TextEditingController _voucherNoController;
  late final List<TextEditingController> _debitControllers;
  late final List<TextEditingController> _creditControllers;

  String _type = kFinanceIncome;
  String _categoryId = '';
  bool _restricted = false;
  DateTime _date = DateTime.now();
  String? _projectId;
  final List<FinanceAccount> _selectedAccounts = [];
  bool _submitting = false;

  FinanceLabels get _labels => FinanceLabels.forType(context.orgTypeRead);

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController();
    _summaryController = TextEditingController();
    _counterpartyController = TextEditingController();
    _voucherNoController = TextEditingController();
    _debitControllers = [];
    _creditControllers = [];
    _projectId = widget.projectId;
    final labels = FinanceLabels.forType(
      context.read<SettingsProvider>().orgType,
    );
    if (labels.isFullAccounting) {
      _type = kFinanceVoucher;
      _addEntry();
    } else {
      _type = kFinanceIncome;
      _categoryId = labels.incomeCategories.firstOrNull?.id ?? '';
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _summaryController.dispose();
    _counterpartyController.dispose();
    _voucherNoController.dispose();
    for (final c in _debitControllers) {
      c.dispose();
    }
    for (final c in _creditControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _addEntry() {
    setState(() {
      _selectedAccounts.add(_labels.accounts.firstOrNull ??
          const FinanceAccount(code: '1001', name: '现金', category: '资产'));
      _debitControllers.add(TextEditingController());
      _creditControllers.add(TextEditingController());
    });
  }

  void _removeEntry(int index) {
    setState(() {
      _debitControllers[index].dispose();
      _creditControllers[index].dispose();
      _debitControllers.removeAt(index);
      _creditControllers.removeAt(index);
      _selectedAccounts.removeAt(index);
    });
  }

  double get _totalDebit => _debitControllers.fold(
      0, (sum, c) => sum + (double.tryParse(c.text) ?? 0));
  double get _totalCredit => _creditControllers.fold(
      0, (sum, c) => sum + (double.tryParse(c.text) ?? 0));
  bool get _balanced => (_totalDebit - _totalCredit).abs() < 0.005;

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final labels = _labels;
    final provider = context.read<FinanceProvider>();
    setState(() => _submitting = true);
    try {
      final List<FinanceEntry> entries = [];
      double amount = 0;
      if (labels.isFullAccounting) {
        if (_debitControllers.isEmpty) {
          showToast(context, '请至少添加一条分录');
          return;
        }
        if (!_balanced) {
          showToast(context, labels.balanceBad);
          return;
        }
        for (var i = 0; i < _debitControllers.length; i++) {
          final account = _selectedAccounts[i];
          entries.add(FinanceEntry(
            account: account.code,
            accountName: account.name,
            debit: double.tryParse(_debitControllers[i].text) ?? 0,
            credit: double.tryParse(_creditControllers[i].text) ?? 0,
          ));
        }
        amount = _totalDebit;
      } else {
        amount = double.tryParse(_amountController.text) ?? 0;
        final categories = _type == kFinanceIncome
            ? labels.incomeCategories
            : labels.expenseCategories;
        final cat = categories.where((c) => c.id == _categoryId).firstOrNull;
        entries.add(FinanceEntry(
          account: _type == kFinanceIncome ? '4109' : '5101',
          accountName: cat?.label ?? '',
          debit: _type == kFinanceExpense ? amount : 0,
          credit: _type == kFinanceIncome ? amount : 0,
        ));
      }

      final status = await provider.submitRecord(
        type: _type,
        amount: amount,
        category: labels.isFullAccounting ? '' : _categoryId,
        categoryLabel: labels.isFullAccounting
            ? labels.formTitle
            : (entries.firstOrNull?.accountName ?? ''),
        date: _date,
        summary: _summaryController.text.trim(),
        counterparty: _counterpartyController.text.trim(),
        voucherNo: _voucherNoController.text.trim(),
        entries: entries,
        projectId: _projectId ?? '',
        restricted: _restricted,
      );
      if (!mounted) return;
      showToast(
        context,
        status == kFinanceApproving
            ? labels.submittedHint
            : '已生效',
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = _labels;
    final theme = Theme.of(context);
    final isVoucher = labels.isFullAccounting;
    final projects = context.watch<ProjectProvider>().projects;

    return Scaffold(
      appBar: AppBar(title: Text(labels.formTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              labels.formHint,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.outline),
            ),
            const SizedBox(height: 16),
            if (!isVoucher) ...[
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                    value: kFinanceIncome,
                    label: Text(labels.incomeLabel),
                  ),
                  ButtonSegment(
                    value: kFinanceExpense,
                    label: Text(labels.expenseLabel),
                  ),
                ],
                selected: {_type},
                onSelectionChanged: (s) => setState(() {
                  _type = s.first;
                  _categoryId = (_type == kFinanceIncome
                          ? labels.incomeCategories
                          : labels.expenseCategories)
                      .firstOrNull
                      ?.id ??
                      '';
                }),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _categoryId,
                decoration: InputDecoration(labelText: labels.entryLabel),
                items: [
                  for (final c in _type == kFinanceIncome
                      ? labels.incomeCategories
                      : labels.expenseCategories)
                    DropdownMenuItem(value: c.id, child: Text(c.label)),
                ],
                onChanged: (v) => setState(() => _categoryId = v ?? ''),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(
                  labelText: '${labels.amountLabel} *',
                  prefixText: '¥ ',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                    decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                ],
                validator: (v) {
                  final n = double.tryParse(v ?? '');
                  return (n == null || n <= 0) ? '请输入有效金额' : null;
                },
              ),
            ] else ...[
              TextFormField(
                controller: _voucherNoController,
                decoration: InputDecoration(
                  labelText: labels.voucherNoLabel,
                  hintText: '如：记-2026-001',
                ),
              ),
              const SizedBox(height: 16),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.calendar_today, size: 18),
                    label: Text(
                      '${labels.dateLabel}: '
                      '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    initialValue: _projectId,
                    decoration: InputDecoration(labelText: labels.projectLabel),
                    items: [
                      const DropdownMenuItem<String?>(
                        value: null,
                        child: Text('不关联项目'),
                      ),
                      for (final p in projects)
                        DropdownMenuItem<String?>(
                          value: p.id,
                          child: Text(p.name, overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    onChanged: (v) => setState(() => _projectId = v),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _summaryController,
              decoration: InputDecoration(
                labelText: '${labels.summaryLabel} *',
              ),
              maxLines: 2,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请填写摘要' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _counterpartyController,
              decoration:
                  InputDecoration(labelText: labels.counterpartyLabel),
            ),
            if (isVoucher)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('限定性（专项资金）'),
                subtitle: const Text('限定性收入/支出计入限定性净资产'),
                value: _restricted,
                onChanged: (v) => setState(() => _restricted = v),
              ),
            if (isVoucher) ...[
              const SizedBox(height: 20),
              Row(
                children: [
                  Text(
                    labels.entryLabel,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(color: theme.colorScheme.primary),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: _addEntry,
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(labels.addEntry),
                  ),
                ],
              ),
              for (var i = 0; i < _debitControllers.length; i++)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<FinanceAccount>(
                                initialValue: _selectedAccounts[i],
                                decoration: InputDecoration(
                                  labelText: labels.accountLabel,
                                  isDense: true,
                                ),
                                items: [
                                  for (final a in labels.accounts)
                                    DropdownMenuItem(
                                      value: a,
                                      child: Text(
                                        a.label,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                ],
                                onChanged: (v) {
                                  if (v != null) {
                                    setState(() =>
                                        _selectedAccounts[i] = v);
                                  }
                                },
                              ),
                            ),
                            IconButton(
                              onPressed: _debitControllers.length > 1
                                  ? () => _removeEntry(i)
                                  : null,
                              icon: const Icon(Icons.delete_outline),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _debitControllers[i],
                                decoration: InputDecoration(
                                  labelText: labels.debitLabel,
                                  isDense: true,
                                ),
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                        decimal: true),
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.]')),
                                ],
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _creditControllers[i],
                                decoration: InputDecoration(
                                  labelText: labels.creditLabel,
                                  isDense: true,
                                ),
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                        decimal: true),
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.]')),
                                ],
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text('${labels.debitLabel}: ${_totalDebit.toStringAsFixed(2)}'),
                  const SizedBox(width: 16),
                  Text('${labels.creditLabel}: ${_totalCredit.toStringAsFixed(2)}'),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _balanced ? labels.balanceOk : labels.balanceBad,
                style: TextStyle(
                  fontSize: 13,
                  color: _balanced
                      ? Colors.green.shade700
                      : Theme.of(context).colorScheme.error,
                ),
              ),
            ],
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(_submitting ? '提交中…' : '提交'),
            ),
          ],
        ),
      ),
    );
  }
}
