/// 期初余额
class OpeningBalance {
  OpeningBalance({
    required this.accountCode,
    this.accountName = '',
    this.debit = 0,
    this.credit = 0,
  });

  final String accountCode;
  String accountName;
  double debit;
  double credit;

  Map<String, dynamic> toJson() => {
        'accountCode': accountCode,
        'accountName': accountName,
        'debit': debit,
        'credit': credit,
      };

  factory OpeningBalance.fromJson(Map<String, dynamic> json) => OpeningBalance(
        accountCode: (json['accountCode'] as String?) ?? '',
        accountName: (json['accountName'] as String?) ?? '',
        debit: (json['debit'] as num?)?.toDouble() ?? 0,
        credit: (json['credit'] as num?)?.toDouble() ?? 0,
      );
}

/// 科目余额表行
class TrialRow {
  const TrialRow({
    required this.code,
    required this.name,
    required this.category,
    required this.openDebit,
    required this.openCredit,
    required this.curDebit,
    required this.curCredit,
    required this.endDebit,
    required this.endCredit,
  });

  final String code;
  final String name;
  final String category;
  final double openDebit;
  final double openCredit;
  final double curDebit;
  final double curCredit;
  final double endDebit;
  final double endCredit;

  factory TrialRow.fromJson(Map<String, dynamic> json) => TrialRow(
        code: (json['code'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        category: (json['category'] as String?) ?? '',
        openDebit: (json['openDebit'] as num?)?.toDouble() ?? 0,
        openCredit: (json['openCredit'] as num?)?.toDouble() ?? 0,
        curDebit: (json['curDebit'] as num?)?.toDouble() ?? 0,
        curCredit: (json['curCredit'] as num?)?.toDouble() ?? 0,
        endDebit: (json['endDebit'] as num?)?.toDouble() ?? 0,
        endCredit: (json['endCredit'] as num?)?.toDouble() ?? 0,
      );
}

class TrialTotals {
  const TrialTotals({
    this.openDebit = 0,
    this.openCredit = 0,
    this.curDebit = 0,
    this.curCredit = 0,
    this.endDebit = 0,
    this.endCredit = 0,
  });

  final double openDebit;
  final double openCredit;
  final double curDebit;
  final double curCredit;
  final double endDebit;
  final double endCredit;

  factory TrialTotals.fromJson(Map<String, dynamic> json) => TrialTotals(
        openDebit: (json['openDebit'] as num?)?.toDouble() ?? 0,
        openCredit: (json['openCredit'] as num?)?.toDouble() ?? 0,
        curDebit: (json['curDebit'] as num?)?.toDouble() ?? 0,
        curCredit: (json['curCredit'] as num?)?.toDouble() ?? 0,
        endDebit: (json['endDebit'] as num?)?.toDouble() ?? 0,
        endCredit: (json['endCredit'] as num?)?.toDouble() ?? 0,
      );
}

/// 资产负债表：资产/负债/净资产 + 合计
class BalanceSheetRow {
  const BalanceSheetRow({
    required this.code,
    required this.name,
    this.open = 0,
    this.end = 0,
  });

  final String code;
  final String name;
  final double open;
  final double end;

  factory BalanceSheetRow.fromJson(Map<String, dynamic> json) => BalanceSheetRow(
        code: (json['code'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        open: (json['openDebit'] as num?)?.toDouble() ??
            (json['open'] as num?)?.toDouble() ??
            0,
        end: (json['endDebit'] as num?)?.toDouble() ??
            (json['end'] as num?)?.toDouble() ??
            0,
      );
}

class NetAssetsRow {
  const NetAssetsRow({
    required this.code,
    required this.name,
    this.open = 0,
    this.end = 0,
  });

  final String code;
  final String name;
  final double open;
  final double end;

  factory NetAssetsRow.fromJson(Map<String, dynamic> json) => NetAssetsRow(
        code: (json['code'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        open: (json['open'] as num?)?.toDouble() ?? 0,
        end: (json['end'] as num?)?.toDouble() ?? 0,
      );
}

class BalanceSheetTotals {
  const BalanceSheetTotals({
    this.assetOpen = 0,
    this.assetEnd = 0,
    this.liabilityOpen = 0,
    this.liabilityEnd = 0,
    this.netOpen = 0,
    this.netEnd = 0,
  });

  final double assetOpen;
  final double assetEnd;
  final double liabilityOpen;
  final double liabilityEnd;
  final double netOpen;
  final double netEnd;

  factory BalanceSheetTotals.fromJson(Map<String, dynamic> json) =>
      BalanceSheetTotals(
        assetOpen: (json['assetOpen'] as num?)?.toDouble() ?? 0,
        assetEnd: (json['assetEnd'] as num?)?.toDouble() ?? 0,
        liabilityOpen: (json['liabilityOpen'] as num?)?.toDouble() ?? 0,
        liabilityEnd: (json['liabilityEnd'] as num?)?.toDouble() ?? 0,
        netOpen: (json['netOpen'] as num?)?.toDouble() ?? 0,
        netEnd: (json['netEnd'] as num?)?.toDouble() ?? 0,
      );
}

/// 业务活动表行
class ActivityRow {
  const ActivityRow({
    required this.code,
    required this.name,
    required this.kind,
    required this.restricted,
    required this.free,
    required this.total,
  });

  final String code;
  final String name;
  final String kind;
  final double restricted;
  final double free;
  final double total;

  factory ActivityRow.fromJson(Map<String, dynamic> json) => ActivityRow(
        code: (json['code'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        kind: (json['kind'] as String?) ?? '',
        restricted: (json['restricted'] as num?)?.toDouble() ?? 0,
        free: (json['free'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
      );
}

class ActivityTotals {
  const ActivityTotals({
    this.income = 0,
    this.expense = 0,
    this.change = 0,
    this.incomeRestricted = 0,
    this.incomeFree = 0,
    this.expenseRestricted = 0,
    this.expenseFree = 0,
    this.changeRestricted = 0,
    this.changeFree = 0,
  });

  final double income;
  final double expense;
  final double change;
  final double incomeRestricted;
  final double incomeFree;
  final double expenseRestricted;
  final double expenseFree;
  final double changeRestricted;
  final double changeFree;

  factory ActivityTotals.fromJson(Map<String, dynamic> json) => ActivityTotals(
        income: (json['income'] as num?)?.toDouble() ?? 0,
        expense: (json['expense'] as num?)?.toDouble() ?? 0,
        change: (json['change'] as num?)?.toDouble() ?? 0,
        incomeRestricted: (json['incomeRestricted'] as num?)?.toDouble() ?? 0,
        incomeFree: (json['incomeFree'] as num?)?.toDouble() ?? 0,
        expenseRestricted: (json['expenseRestricted'] as num?)?.toDouble() ?? 0,
        expenseFree: (json['expenseFree'] as num?)?.toDouble() ?? 0,
        changeRestricted: (json['changeRestricted'] as num?)?.toDouble() ?? 0,
        changeFree: (json['changeFree'] as num?)?.toDouble() ?? 0,
      );
}

/// 现金流量表
class CashFlowRow {
  const CashFlowRow({
    required this.line,
    required this.category,
    required this.amount,
  });

  final String line;
  final String category;
  final double amount;

  factory CashFlowRow.fromJson(Map<String, dynamic> json) => CashFlowRow(
        line: (json['line'] as String?) ?? '',
        category: (json['category'] as String?) ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
      );
}

class CashFlowTotals {
  const CashFlowTotals({
    this.operating = 0,
    this.investing = 0,
    this.financing = 0,
    this.net = 0,
  });

  final double operating;
  final double investing;
  final double financing;
  final double net;

  factory CashFlowTotals.fromJson(Map<String, dynamic> json) => CashFlowTotals(
        operating: (json['operating'] as num?)?.toDouble() ?? 0,
        investing: (json['investing'] as num?)?.toDouble() ?? 0,
        financing: (json['financing'] as num?)?.toDouble() ?? 0,
        net: (json['net'] as num?)?.toDouble() ?? 0,
      );
}

class AccountingReports {
  const AccountingReports({
    required this.year,
    this.closingExists = false,
    this.trialRows = const [],
    this.trialTotals = const TrialTotals(),
    this.assets = const [],
    this.liabilities = const [],
    this.netAssetsRows = const [],
    this.bsTotals = const BalanceSheetTotals(),
    this.activityRows = const [],
    this.activityTotals = const ActivityTotals(),
    this.cashRows = const [],
    this.cashTotals = const CashFlowTotals(),
  });

  final String year;
  final bool closingExists;
  final List<TrialRow> trialRows;
  final TrialTotals trialTotals;
  final List<BalanceSheetRow> assets;
  final List<BalanceSheetRow> liabilities;
  final List<NetAssetsRow> netAssetsRows;
  final BalanceSheetTotals bsTotals;
  final List<ActivityRow> activityRows;
  final ActivityTotals activityTotals;
  final List<CashFlowRow> cashRows;
  final CashFlowTotals cashTotals;

  factory AccountingReports.fromJson(Map<String, dynamic> json) {
    List<BalanceSheetRow> parseBs(dynamic v) => (v as List? ?? [])
        .map((e) => BalanceSheetRow.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return AccountingReports(
      year: (json['year'] as String?) ?? '',
      closingExists: (json['closingExists'] as bool?) ?? false,
      trialRows: ((json['trialBalance'] as Map?)?['rows'] as List? ?? [])
          .map((e) => TrialRow.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      trialTotals: TrialTotals.fromJson(
          Map<String, dynamic>.from(
              ((json['trialBalance'] as Map?)?['totals'] as Map?) ?? {})),
      assets: parseBs((json['balanceSheet'] as Map?)?['assets']),
      liabilities: parseBs((json['balanceSheet'] as Map?)?['liabilities']),
      netAssetsRows:
          ((json['balanceSheet'] as Map?)?['netAssetsRows'] as List? ?? [])
              .map((e) =>
                  NetAssetsRow.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList(),
      bsTotals: BalanceSheetTotals.fromJson(
          Map<String, dynamic>.from(
              ((json['balanceSheet'] as Map?)?['totals'] as Map?) ?? {})),
      activityRows:
          ((json['activityStatement'] as Map?)?['rows'] as List? ?? [])
              .map((e) =>
                  ActivityRow.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList(),
      activityTotals: ActivityTotals.fromJson(
          Map<String, dynamic>.from(
              ((json['activityStatement'] as Map?)?['totals'] as Map?) ?? {})),
      cashRows: ((json['cashFlow'] as Map?)?['rows'] as List? ?? [])
          .map((e) => CashFlowRow.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      cashTotals: CashFlowTotals.fromJson(
          Map<String, dynamic>.from(
              ((json['cashFlow'] as Map?)?['totals'] as Map?) ?? {})),
    );
  }
}

/// 明细账
class LedgerEntry {
  const LedgerEntry({
    required this.date,
    required this.voucherNo,
    required this.summary,
    required this.debit,
    required this.credit,
    this.runningDebit = 0,
    this.runningCredit = 0,
  });

  final DateTime date;
  final String voucherNo;
  final String summary;
  final double debit;
  final double credit;
  final double runningDebit;
  final double runningCredit;

  factory LedgerEntry.fromJson(Map<String, dynamic> json) => LedgerEntry(
        date: _toDate(json['date']) ?? DateTime.now(),
        voucherNo: (json['voucherNo'] as String?) ?? '',
        summary: (json['summary'] as String?) ?? '',
        debit: (json['debit'] as num?)?.toDouble() ?? 0,
        credit: (json['credit'] as num?)?.toDouble() ?? 0,
        runningDebit: (json['runningDebit'] as num?)?.toDouble() ?? 0,
        runningCredit: (json['runningCredit'] as num?)?.toDouble() ?? 0,
      );
}

class LedgerData {
  const LedgerData({
    this.accountCode = '',
    this.accountName = '',
    this.accountCategory = '',
    this.year = '',
    this.openDebit = 0,
    this.openCredit = 0,
    this.entries = const [],
  });

  final String accountCode;
  final String accountName;
  final String accountCategory;
  final String year;
  final double openDebit;
  final double openCredit;
  final List<LedgerEntry> entries;

  factory LedgerData.fromJson(Map<String, dynamic> json) => LedgerData(
        accountCode: ((json['account'] as Map?)?['code'] as String?) ?? '',
        accountName: ((json['account'] as Map?)?['name'] as String?) ?? '',
        accountCategory:
            ((json['account'] as Map?)?['category'] as String?) ?? '',
        year: (json['year'] as String?) ?? '',
        openDebit: (json['openDebit'] as num?)?.toDouble() ?? 0,
        openCredit: (json['openCredit'] as num?)?.toDouble() ?? 0,
        entries: (json['entries'] as List? ?? [])
            .map((e) => LedgerEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

DateTime? _toDate(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
  if (v is String) {
    final n = int.tryParse(v);
    if (n != null) return DateTime.fromMillisecondsSinceEpoch(n);
    return DateTime.tryParse(v);
  }
  return null;
}
