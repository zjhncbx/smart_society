import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/accounting.dart';
import '../../providers/finance_provider.dart';
import '../../widgets/common.dart';

class OpeningBalancePage extends StatefulWidget {
  const OpeningBalancePage({super.key});

  @override
  State<OpeningBalancePage> createState() => _OpeningBalancePageState();
}

class _OpeningBalancePageState extends State<OpeningBalancePage> {
  late int _year;
  late Map<String, TextEditingController> _debit;
  late Map<String, TextEditingController> _credit;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _year = DateTime.now().year;
    _debit = {};
    _credit = {};
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    for (final c in _debit.values) {
      c.dispose();
    }
    for (final c in _credit.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    final accounts = FinanceLabels.forType(context.orgTypeRead).accounts;
    for (final a in accounts) {
      _debit.putIfAbsent(a.code, () => TextEditingController());
      _credit.putIfAbsent(a.code, () => TextEditingController());
    }
    final provider = context.read<FinanceProvider>();
    await provider.loadOpeningBalances('$_year');
    final map = {
      for (final b in provider.openingBalances) b.accountCode: b,
    };
    for (final a in accounts) {
      final b = map[a.code];
      _debit[a.code]!.text = b != null && b.debit > 0 ? _num(b.debit) : '';
      _credit[a.code]!.text = b != null && b.credit > 0 ? _num(b.credit) : '';
    }
    if (mounted) setState(() {});
  }

  String _num(double v) => v == v.roundToDouble()
      ? v.toStringAsFixed(0)
      : v.toStringAsFixed(2);

  List<OpeningBalance> _collect() {
    final accounts = FinanceLabels.forType(context.orgTypeRead).accounts;
    return [
      for (final a in accounts)
        OpeningBalance(
          accountCode: a.code,
          accountName: a.name,
          debit: double.tryParse(_debit[a.code]!.text) ?? 0,
          credit: double.tryParse(_credit[a.code]!.text) ?? 0,
        ),
    ];
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await context
          .read<FinanceProvider>()
          .saveOpeningBalances('$_year', _collect());
      if (!mounted) return;
      showToast(context, '期初余额已保存');
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _carryFromPrevious() async {
    final ok = await showConfirmDialog(
      context,
      title: '从上期结转',
      message: '将 ${_year - 1} 年度期末余额结转为 $_year 年期初余额，'
          '现有 $_year 年期初余额将被覆盖，确认继续？',
      confirmText: '结转',
    );
    if (!ok || !mounted) return;
    setState(() => _saving = true);
    try {
      await context.read<FinanceProvider>().saveOpeningBalances(
        '$_year',
        const [],
        carryFromPrevious: true,
      );
      if (!mounted) return;
      showToast(context, '已从上期结转');
      await _load();
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final accounts = labels.accounts;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.openingBalance),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: DropdownButton<int>(
              value: _year,
              underline: const SizedBox.shrink(),
              items: [
                for (var y = DateTime.now().year - 5;
                    y <= DateTime.now().year + 1;
                    y++)
                  DropdownMenuItem(value: y, child: Text('$y 年')),
              ],
              onChanged: (v) {
                if (v == null) return;
                setState(() => _year = v);
                _load();
              },
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Text(
            '录入 $_year 年期初余额（资产/负债/净资产科目）；'
            '收入与费用科目期初为零。',
            style: theme.textTheme.bodySmall
                ?.copyWith(color: theme.colorScheme.outline),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _saving ? null : _carryFromPrevious,
                  icon: const Icon(Icons.playlist_add_check, size: 18),
                  label: Text(labels.carryFromPrev),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final a in accounts)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 130,
                    child: Text(
                      '${a.code} ${a.name}',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _debit[a.code],
                      decoration: InputDecoration(
                        labelText: labels.openDebit,
                        isDense: true,
                      ),
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _credit[a.code],
                      decoration: InputDecoration(
                        labelText: labels.openCredit,
                        isDense: true,
                      ),
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(_saving ? '保存中…' : '保存'),
          ),
        ],
      ),
    );
  }
}
