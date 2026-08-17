import 'dart:convert';

/// 财务单据状态
const String kFinanceApproving = 'approving';
const String kFinanceApproved = 'approved';
const String kFinanceRejected = 'rejected';

/// 财务单据类型：收入 / 支出 / 记账凭证（社会团体）
const String kFinanceIncome = 'income';
const String kFinanceExpense = 'expense';
const String kFinanceVoucher = 'voucher';

/// 记账凭证分录
class FinanceEntry {
  FinanceEntry({
    required this.account,
    required this.accountName,
    this.debit = 0,
    this.credit = 0,
  });

  String account;
  String accountName;
  double debit;
  double credit;

  Map<String, dynamic> toJson() => {
        'account': account,
        'accountName': accountName,
        'debit': debit,
        'credit': credit,
      };

  factory FinanceEntry.fromJson(Map<String, dynamic> json) => FinanceEntry(
        account: (json['account'] as String?) ?? '',
        accountName: (json['accountName'] as String?) ?? '',
        debit: (json['debit'] as num?)?.toDouble() ?? 0,
        credit: (json['credit'] as num?)?.toDouble() ?? 0,
      );
}

/// 财务单据（简化版收支单 / 社会团体记账凭证）
class FinanceRecord {
  FinanceRecord({
    required this.id,
    required this.orgId,
    this.projectId = '',
    required this.type,
    this.amount = 0,
    this.category = '',
    this.categoryLabel = '',
    required this.date,
    required this.summary,
    this.counterparty = '',
    this.voucherNo = '',
    List<FinanceEntry>? entries,
    required this.status,
    this.flowId = '',
    this.instanceId = '',
    this.createdBy = '',
    this.createdByName = '',
    this.code = '',
    this.updatedBy = '',
    this.version = 1,
    this.sourceType = 'manual',
    this.sourceId = '',
    this.period = '',
    this.restricted = false,
    required this.createdAt,
    this.updatedAt,
  }) : entries = entries ?? [];

  final String id;
  final String orgId;
  final String projectId;
  final String type;
  final double amount;
  final String category;
  final String categoryLabel;
  final DateTime date;
  final String summary;
  final String counterparty;
  final String voucherNo;
  final List<FinanceEntry> entries;
  final String status;
  final String flowId;
  final String instanceId;
  final String createdBy;
  final String createdByName;
  final String code;
  final String updatedBy;
  final int version;
  final String sourceType;
  final String sourceId;
  final String period;
  final bool restricted;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isApproving => status == kFinanceApproving;
  bool get isApproved => status == kFinanceApproved;
  bool get isRejected => status == kFinanceRejected;
  bool get isVoucher => type == kFinanceVoucher;

  double get totalDebit =>
      entries.fold(0, (sum, e) => sum + e.debit);
  double get totalCredit =>
      entries.fold(0, (sum, e) => sum + e.credit);
  bool get balanced =>
      entries.isEmpty || (totalDebit - totalCredit).abs() < 0.005;

  Map<String, dynamic> toJson() => {
        'id': id,
        'orgId': orgId,
        'projectId': projectId,
        'type': type,
        'amount': amount,
        'category': category,
        'categoryLabel': categoryLabel,
        'date': date.millisecondsSinceEpoch,
        'summary': summary,
        'counterparty': counterparty,
        'voucherNo': voucherNo,
        'entries': entries.map((e) => e.toJson()).toList(),
        'status': status,
        'flowId': flowId,
        'instanceId': instanceId,
        'createdBy': createdBy,
        'createdByName': createdByName,
        'code': code,
        'updatedBy': updatedBy,
        'version': version,
        'sourceType': sourceType,
        'sourceId': sourceId,
        'period': period,
        'restricted': restricted,
        'createdAt': createdAt.millisecondsSinceEpoch,
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory FinanceRecord.fromJson(Map<String, dynamic> json) => FinanceRecord(
        id: json['id'] as String,
        orgId: (json['orgId'] as String?) ?? '',
        projectId: (json['projectId'] as String?) ?? '',
        type: (json['type'] as String?) ?? kFinanceExpense,
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        category: (json['category'] as String?) ?? '',
        categoryLabel: (json['categoryLabel'] as String?) ?? '',
        date: _toDate(json['date']) ?? DateTime.now(),
        summary: (json['summary'] as String?) ?? '',
        counterparty: (json['counterparty'] as String?) ?? '',
        voucherNo: (json['voucherNo'] as String?) ?? '',
        entries: _parseEntries(json['entries']),
        status: (json['status'] as String?) ?? kFinanceApproving,
        flowId: (json['flowId'] as String?) ?? '',
        instanceId: (json['instanceId'] as String?) ?? '',
        createdBy: (json['createdBy'] as String?) ?? '',
        createdByName: (json['createdByName'] as String?) ?? '',
        code: (json['code'] as String?) ?? '',
        updatedBy: (json['updatedBy'] as String?) ?? '',
        version: (json['version'] as num?)?.toInt() ?? 1,
        sourceType: (json['sourceType'] as String?) ?? 'manual',
        sourceId: (json['sourceId'] as String?) ?? '',
        period: (json['period'] as String?) ?? '',
        restricted: (json['restricted'] as bool?) ?? false,
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: _toDate(json['updatedAt']),
      );
}

List<FinanceEntry> _parseEntries(dynamic v) {
  if (v == null) return [];
  if (v is List) {
    return v
        .map((e) => FinanceEntry.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
  if (v is String) {
    if (v.isEmpty) return [];
    try {
      final decoded = jsonDecode(v);
      if (decoded is List) {
        return decoded
            .map((e) =>
                FinanceEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } catch (_) {}
  }
  return [];
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
