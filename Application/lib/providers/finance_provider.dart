import 'package:flutter/foundation.dart';

import '../config/finance_config.dart';
import '../models/accounting.dart';
import '../models/approval_flow.dart';
import '../models/approval_instance.dart';
import '../models/finance_record.dart';
import '../services/cloud_function_service.dart';

/// 财务模块：云端权威数据（审批涉及多人协作，不走本地离线队列）。
class FinanceProvider extends ChangeNotifier {
  FinanceProvider({
    required String Function() orgIdGetter,
    required String Function() userIdGetter,
    required String Function() userNameGetter,
  })  : _orgIdGetter = orgIdGetter,
        _userIdGetter = userIdGetter,
        _userNameGetter = userNameGetter;

  final CloudFunctionService _cloud = CloudFunctionService.instance;
  final String Function() _orgIdGetter;
  final String Function() _userIdGetter;
  final String Function() _userNameGetter;

  List<FinanceRecord> _records = [];
  int _total = 0;
  bool _hasMore = false;
  FinanceStats _stats = FinanceStats.empty;
  List<ApprovalFlow> _flows = [];
  List<ApprovalTask> _tasks = [];
  List<FinanceRecord> _projectRecords = [];
  List<OpeningBalance> _openingBalances = [];
  AccountingReports _reports = const AccountingReports(year: '');
  LedgerData? _ledger;
  FinanceRecord? _detailRecord;
  ApprovalInstance? _detailInstance;
  bool _detailCanAct = false;
  bool _loading = false;

  List<FinanceRecord> get records => _records;
  int get total => _total;
  bool get hasMore => _hasMore;
  FinanceStats get stats => _stats;
  List<ApprovalFlow> get flows => _flows;
  List<ApprovalTask> get tasks => _tasks;
  int get taskCount => _tasks.length;
  List<FinanceRecord> get projectRecords => _projectRecords;
  List<OpeningBalance> get openingBalances => _openingBalances;
  AccountingReports get reports => _reports;
  LedgerData? get ledger => _ledger;
  FinanceRecord? get detailRecord => _detailRecord;
  ApprovalInstance? get detailInstance => _detailInstance;
  bool get detailCanAct => _detailCanAct;
  bool get loading => _loading;

  Map<String, dynamic> get _base => {
        'orgId': _orgIdGetter(),
        'userId': _userIdGetter(),
      };

  Future<void> loadRecords({
    String? status,
    String? projectId,
    int page = 0,
  }) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-finance-records',
        params: {
          'orgId': orgId,
          'userId': userId,
          if (status != null && status.isNotEmpty) 'status': status,
          if (projectId != null && projectId.isNotEmpty) 'projectId': projectId,
          'page': page,
        },
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['records'];
      if (list is List) {
        final parsed = list
            .map((e) => FinanceRecord.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        if (page == 0) {
          _records = parsed;
        } else {
          _records.addAll(parsed);
        }
      }
      _total = (map['total'] as int?) ?? _records.length;
      _hasMore = (map['hasMore'] as bool?) ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('loadRecords failed: $e');
    }
  }

  Future<void> loadStats({String? projectId}) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-finance-stats',
        params: {
          'orgId': orgId,
          'userId': userId,
          if (projectId != null && projectId.isNotEmpty) 'projectId': projectId,
        },
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      _stats = FinanceStats(
        income: (map['income'] as num?)?.toDouble() ?? 0,
        expense: (map['expense'] as num?)?.toDouble() ?? 0,
        balance: (map['balance'] as num?)?.toDouble() ?? 0,
        categories: (map['categories'] as List? ?? [])
            .map((e) => FinanceCategoryStat.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList(),
        projects: (map['projects'] as List? ?? [])
            .map((e) => FinanceProjectStat.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
      notifyListeners();
    } catch (e) {
      debugPrint('loadStats failed: $e');
    }
  }

  Future<void> loadFlows() async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-approval-flows',
        params: {..._base},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['flows'];
      if (list is List) {
        _flows = list
            .map((e) => ApprovalFlow.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('loadFlows failed: $e');
    }
  }

  Future<void> loadTasks() async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-approval-tasks',
        params: {..._base},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['tasks'];
      if (list is List) {
        _tasks = list.map((e) {
          final m = Map<String, dynamic>.from(e as Map);
          return ApprovalTask(
            instance: ApprovalInstance.fromJson(
                Map<String, dynamic>.from(m['instance'] as Map)),
            node: ApprovalNodeSnapshot.fromJson(
                Map<String, dynamic>.from(m['node'] as Map)),
            record: m['record'] == null
                ? null
                : FinanceRecord.fromJson(
                    Map<String, dynamic>.from(m['record'] as Map)),
          );
        }).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('loadTasks failed: $e');
    }
  }

  /// 加载某个项目的关联财务单据（项目详情页使用）
  Future<void> loadProjectRecords(String projectId) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-finance-records',
        params: {
          'orgId': orgId,
          'userId': userId,
          'projectId': projectId,
          'page': 0,
        },
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['records'];
      if (list is List) {
        _projectRecords = list
            .map((e) => FinanceRecord.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('loadProjectRecords failed: $e');
    }
  }

  Future<void> loadOpeningBalances(String year) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-opening-balances',
        params: {'orgId': orgId, 'userId': userId, 'year': year},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['balances'];
      if (list is List) {
        _openingBalances = list
            .map((e) => OpeningBalance.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('loadOpeningBalances failed: $e');
    }
  }

  /// 保存期初余额；carryFromPrevious=true 时由服务端从上期期末自动结转
  Future<void> saveOpeningBalances(
    String year,
    List<OpeningBalance> balances, {
    bool carryFromPrevious = false,
  }) async {
    final data = await _cloud.callChecked(
      'save-opening-balances',
      params: {
        ..._base,
        'year': year,
        if (carryFromPrevious)
          'carryFromPrevious': true
        else
          'balances': balances.map((b) => b.toJson()).toList(),
      },
      timeout: const Duration(seconds: 40),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    final list = map['balances'];
    if (list is List) {
      _openingBalances = list
          .map((e) => OpeningBalance.fromJson(
              Map<String, dynamic>.from(e as Map)))
          .toList();
      notifyListeners();
    }
  }

  Future<void> loadReports(String year) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-accounting-reports',
        params: {'orgId': orgId, 'userId': userId, 'year': year},
        timeout: const Duration(seconds: 40),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      _reports = AccountingReports.fromJson(map);
      notifyListeners();
    } catch (e) {
      debugPrint('loadReports failed: $e');
    }
  }

  Future<void> loadLedger(String year, String accountCode) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    try {
      final data = await _cloud.callChecked(
        'get-ledger',
        params: {
          'orgId': orgId,
          'userId': userId,
          'year': year,
          'accountCode': accountCode,
        },
        timeout: const Duration(seconds: 40),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      _ledger = LedgerData.fromJson(map);
      notifyListeners();
    } catch (e) {
      debugPrint('loadLedger failed: $e');
      _ledger = null;
      notifyListeners();
    }
  }

  /// 期末结账：生成结转凭证。返回 {alreadyClosed, voucherId, income, expense}
  Future<Map<String, dynamic>> closePeriod(String year) async {
    final data = await _cloud.callChecked(
      'close-period',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'year': year,
      },
      timeout: const Duration(seconds: 40),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    await loadReports(year);
    return map;
  }

  /// 反结账：删除该年度结转凭证，恢复可录入
  Future<Map<String, dynamic>> unclosePeriod(String year) async {
    final data = await _cloud.callChecked(
      'unclose-period',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'year': year,
      },
      timeout: const Duration(seconds: 40),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    await loadReports(year);
    return map;
  }

  Future<void> loadDetail(String id) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    _loading = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'get-finance-records',
        params: {'orgId': orgId, 'userId': userId, 'id': id},
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      _detailRecord = map['record'] == null
          ? null
          : FinanceRecord.fromJson(Map<String, dynamic>.from(map['record'] as Map));
      _detailInstance = map['instance'] == null
          ? null
          : ApprovalInstance.fromJson(
              Map<String, dynamic>.from(map['instance'] as Map));
      _detailCanAct = map['canAct'] == true;
      notifyListeners();
    } catch (e) {
      debugPrint('loadDetail failed: $e');
      _detailRecord = null;
      _detailInstance = null;
      _detailCanAct = false;
      notifyListeners();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// 提交单据（收入/支出/记账凭证）。返回最终状态。
  Future<String> submitRecord({
    required String type,
    double amount = 0,
    String category = '',
    String categoryLabel = '',
    required DateTime date,
    required String summary,
    String counterparty = '',
    String voucherNo = '',
    List<FinanceEntry> entries = const [],
    String projectId = '',
    bool restricted = false,
  }) async {
    final data = await _cloud.callChecked(
      'submit-finance-record',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'record': {
          'type': type,
          'amount': amount,
          'category': category,
          'categoryLabel': categoryLabel,
          'date': date.millisecondsSinceEpoch,
          'summary': summary,
          'counterparty': counterparty,
          'voucherNo': voucherNo,
          'entries': entries.map((e) => e.toJson()).toList(),
          'projectId': projectId,
          'restricted': restricted,
        },
      },
      timeout: const Duration(seconds: 40),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    return (map['status'] as String?) ?? kFinanceApproving;
  }

  Future<String> act(String instanceId, String action, {String comment = ''}) async {
    final data = await _cloud.callChecked(
      'act-finance-node',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'instanceId': instanceId,
        'action': action,
        'comment': comment,
      },
      timeout: const Duration(seconds: 40),
    );
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    return (map['status'] as String?) ?? '';
  }

  Future<void> saveFlow(ApprovalFlow flow) async {
    await _cloud.callChecked(
      'save-approval-flow',
      params: {
        ..._base,
        'flow': flow.toJson(),
      },
      timeout: const Duration(seconds: 30),
    );
    await loadFlows();
  }
}

class ApprovalTask {
  const ApprovalTask({
    required this.instance,
    required this.node,
    this.record,
  });

  final ApprovalInstance instance;
  final ApprovalNodeSnapshot node;
  final FinanceRecord? record;
}
