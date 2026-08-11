import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../models/accounting.dart';
import '../../providers/finance_provider.dart';
import '../../utils/date_format.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_badges.dart';

class AccountingReportsPage extends StatefulWidget {
  const AccountingReportsPage({super.key});

  @override
  State<AccountingReportsPage> createState() => _AccountingReportsPageState();
}

class _AccountingReportsPageState extends State<AccountingReportsPage> {
  late int _year;

  @override
  void initState() {
    super.initState();
    _year = DateTime.now().year;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().loadReports('$_year');
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final provider = context.watch<FinanceProvider>();
    final reports = provider.reports;

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: Text(labels.reportsTitle),
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
                  context.read<FinanceProvider>().loadReports('$v');
                },
              ),
            ),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: labels.trialBalance),
              Tab(text: labels.balanceSheet),
              Tab(text: labels.activityStatement),
              Tab(text: labels.cashFlow),
              Tab(text: labels.ledgerTitle),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _TrialTab(reports: reports),
            _BalanceSheetTab(reports: reports),
            _ActivityTab(reports: reports),
            _CashFlowTab(reports: reports),
            _LedgerTab(year: '$_year'),
          ],
        ),
      ),
    );
  }
}

class _AmountText extends StatelessWidget {
  const _AmountText(this.value, {this.bold = false});

  final double value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Text(
      formatAmount(value),
      textAlign: TextAlign.right,
      style: TextStyle(
        fontSize: 12,
        fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
        color: value < 0 ? Colors.red.shade700 : null,
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 12, 4, 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}

class _TrialTab extends StatelessWidget {
  const _TrialTab({required this.reports});

  final AccountingReports reports;

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    if (reports.trialRows.isEmpty) {
      return const Center(child: Text('暂无数据'));
    }
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Table(
            border: TableBorder.all(
              color: Theme.of(context).colorScheme.outlineVariant,
              width: 0.5,
            ),
            defaultVerticalAlignment: TableCellVerticalAlignment.middle,
            columnWidths: const {
              0: FixedColumnWidth(110),
              1: FixedColumnWidth(72),
              2: FixedColumnWidth(72),
              3: FixedColumnWidth(72),
              4: FixedColumnWidth(72),
              5: FixedColumnWidth(72),
              6: FixedColumnWidth(72),
            },
            children: [
              _headerRow([
                labels.accountColumn,
                labels.openDebit,
                labels.openCredit,
                labels.curDebit,
                labels.curCredit,
                labels.endDebit,
                labels.endCredit,
              ]),
              for (final row in reports.trialRows)
                TableRow(
                  children: [
                    _cell('${row.code} ${row.name}'),
                    _cellNum(row.openDebit),
                    _cellNum(row.openCredit),
                    _cellNum(row.curDebit),
                    _cellNum(row.curCredit),
                    _cellNum(row.endDebit),
                    _cellNum(row.endCredit),
                  ],
                ),
              _totalRow([
                labels.totalLabel,
                reports.trialTotals.openDebit,
                reports.trialTotals.openCredit,
                reports.trialTotals.curDebit,
                reports.trialTotals.curCredit,
                reports.trialTotals.endDebit,
                reports.trialTotals.endCredit,
              ]),
            ],
          ),
        ),
      ],
    );
  }
}

class _BalanceSheetTab extends StatelessWidget {
  const _BalanceSheetTab({required this.reports});

  final AccountingReports reports;

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final t = reports.bsTotals;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Row(
          children: [
            Text(
              '${labels.yearLabel} ${reports.year}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            StatusBadge(
              label: reports.closingExists
                  ? labels.closedBadge
                  : labels.notClosedBadge,
              variant: reports.closingExists
                  ? BadgeVariant.success
                  : BadgeVariant.warning,
            ),
          ],
        ),
        _SectionHeader(labels.assetsLabel),
        for (final r in reports.assets)
          _bsRowWidget(r.code, r.name, r.open, r.end),
        _bsTotal(labels.totalLabel, t.assetOpen, t.assetEnd),
        _SectionHeader(labels.liabilitiesLabel),
        for (final r in reports.liabilities)
          _bsRowWidget(r.code, r.name, r.open, r.end),
        _bsTotal(labels.totalLabel, t.liabilityOpen, t.liabilityEnd),
        _SectionHeader(labels.netAssetsLabel),
        for (final r in reports.netAssetsRows)
          _bsRowWidget(r.code, r.name, r.open, r.end),
        _bsTotal(labels.totalLabel, t.netOpen, t.netEnd),
        const Divider(height: 20),
        _bsTotal('${labels.assetsLabel}合计', t.assetOpen, t.assetEnd),
        _bsTotal(
          '${labels.liabilitiesLabel}+${labels.netAssetsLabel}合计',
          t.liabilityOpen + t.netOpen,
          t.liabilityEnd + t.netEnd,
          bold: true,
        ),
      ],
    );
  }

}

class _ActivityTab extends StatelessWidget {
  const _ActivityTab({required this.reports});

  final AccountingReports reports;

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final t = reports.activityTotals;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Table(
            border: TableBorder.all(
              color: Theme.of(context).colorScheme.outlineVariant,
              width: 0.5,
            ),
            columnWidths: const {
              0: FixedColumnWidth(150),
              1: FixedColumnWidth(80),
              2: FixedColumnWidth(80),
              3: FixedColumnWidth(80),
            },
            children: [
              _headerRow([
                labels.accountColumn,
                labels.freeLabel,
                labels.restrictedLabel,
                labels.totalLabel,
              ]),
              _sectionRow(labels.incomeLabel),
              for (final r in reports.activityRows.where((x) => x.kind == 'income'))
                TableRow(
                  children: [
                    _cell('${r.code} ${r.name}'),
                    _cellNum(r.free),
                    _cellNum(r.restricted),
                    _cellNum(r.total),
                  ],
                ),
              _sectionRow(labels.incomeTotal),
              _totalRow([
                labels.incomeTotal,
                t.incomeFree,
                t.incomeRestricted,
                t.income,
              ]),
              _sectionRow(labels.expenseLabel),
              for (final r in reports.activityRows.where((x) => x.kind == 'expense'))
                TableRow(
                  children: [
                    _cell('${r.code} ${r.name}'),
                    _cellNum(r.free),
                    _cellNum(r.restricted),
                    _cellNum(r.total),
                  ],
                ),
              _sectionRow(labels.expenseTotal),
              _totalRow([
                labels.expenseTotal,
                t.expenseFree,
                t.expenseRestricted,
                t.expense,
              ]),
              _sectionRow(labels.netChange),
              _totalRow([
                labels.netChange,
                t.changeFree,
                t.changeRestricted,
                t.change,
              ]),
            ],
          ),
        ),
      ],
    );
  }
}

class _CashFlowTab extends StatelessWidget {
  const _CashFlowTab({required this.reports});

  final AccountingReports reports;

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final t = reports.cashTotals;
    final rows = reports.cashRows;
    if (rows.isEmpty) {
      return const Center(child: Text('暂无现金收支数据'));
    }
    final sections = [
      (labels.operatingLabel, t.operating),
      (labels.investingLabel, t.investing),
      (labels.financingLabel, t.financing),
    ];
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        for (final sec in sections)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader(sec.$1),
              for (final r in rows.where((x) => x.category == sec.$1))
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Expanded(child: Text(r.line, style: const TextStyle(fontSize: 13))),
                      _AmountText(r.amount),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${sec.$1}现金流量净额',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                    _AmountText(sec.$2, bold: true),
                  ],
                ),
              ),
            ],
          ),
        const Divider(height: 20),
        Row(
          children: [
            const Expanded(
              child: Text(
                '现金及现金等价物净增加额',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ),
            _AmountText(t.net, bold: true),
          ],
        ),
      ],
    );
  }
}

class _LedgerTab extends StatefulWidget {
  const _LedgerTab({required this.year});

  final String year;

  @override
  State<_LedgerTab> createState() => _LedgerTabState();
}

class _LedgerTabState extends State<_LedgerTab> {
  String? _accountCode;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final accounts = FinanceLabels.forType(context.orgTypeRead).accounts;
      if (accounts.isNotEmpty) {
        _accountCode = accounts.first.code;
        context.read<FinanceProvider>().loadLedger(widget.year, accounts.first.code);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final accounts = labels.accounts;
    final provider = context.watch<FinanceProvider>();
    final ledger = provider.ledger;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        DropdownButtonFormField<String>(
          initialValue: _accountCode,
          decoration: InputDecoration(labelText: labels.accountColumn, isDense: true),
          items: [
            for (final a in accounts)
              DropdownMenuItem(value: a.code, child: Text(a.label)),
          ],
          onChanged: (v) {
            if (v == null) return;
            setState(() => _accountCode = v);
            context.read<FinanceProvider>().loadLedger(widget.year, v);
          },
        ),
        const SizedBox(height: 8),
        if (ledger == null)
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Center(child: Text('暂无数据')),
          )
        else ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Text(
              '${ledger.accountCode} ${ledger.accountName}'
              '（${ledger.accountCategory}）',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              children: [
                const Expanded(child: Text('期初余额', style: TextStyle(fontSize: 13))),
                _AmountText(ledger.openDebit),
                const SizedBox(width: 12),
                _AmountText(ledger.openCredit),
              ],
            ),
          ),
          const Divider(height: 12),
          for (final e in ledger.entries)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${formatDate(e.date)} ${e.voucherNo} ${e.summary}',
                          style: const TextStyle(fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _AmountText(e.debit),
                      const SizedBox(width: 12),
                      _AmountText(e.credit),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 8, top: 1),
                    child: Text(
                      '余额 借 ${formatAmount(e.runningDebit)} 贷 ${formatAmount(e.runningCredit)}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(context).colorScheme.outline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ],
    );
  }
}

Widget _cell(String text) {
  return Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
    child: Text(text, style: const TextStyle(fontSize: 12)),
  );
}

Widget _cellNum(double v) {
  return Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
    child: Align(
      alignment: Alignment.centerRight,
      child: Text(
        formatAmount(v),
        style: const TextStyle(fontSize: 12),
      ),
    ),
  );
}

TableRow _headerRow(List<String> cells) {
  return TableRow(
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: 0.04),
    ),
    children: cells.map((c) => _cell(c)).toList(),
  );
}

TableRow _sectionRow(String title) {
  return TableRow(
    children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
        child: Text(
          title,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        ),
      ),
      const Padding(padding: EdgeInsets.all(5), child: SizedBox()),
      const Padding(padding: EdgeInsets.all(5), child: SizedBox()),
      const Padding(padding: EdgeInsets.all(5), child: SizedBox()),
    ],
  );
}

TableRow _totalRow(List<Object> cells) {
  return TableRow(
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: 0.04),
    ),
    children: cells.map((c) {
      if (c is String) return _cell(c);
      return _cellNum(c as double);
    }).toList(),
  );
}

Widget _bsTotal(String label, double open, double end, {bool bold = false}) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w700,
            ),
          ),
        ),
        _AmountText(open, bold: bold),
        const SizedBox(width: 40),
        SizedBox(width: 72, child: _AmountText(end, bold: bold)),
      ],
    ),
  );
}

Widget _bsRowWidget(String code, String name, double open, double end) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Expanded(
          child: Text(
            '$code $name',
            style: const TextStyle(fontSize: 13),
          ),
        ),
        SizedBox(width: 80, child: _AmountText(open)),
        SizedBox(width: 80, child: _AmountText(end)),
      ],
    ),
  );
}
