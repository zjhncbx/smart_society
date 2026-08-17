import 'package:flutter/foundation.dart';

import '../models/governance.dart';
import '../services/cloud_function_service.dart';

/// 自动任务 + 风险/预警 + 自动化审计（WF-03/04、SA-02/03、SEC-01）。
class GovernanceProvider extends ChangeNotifier {
  GovernanceProvider({
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

  List<AutoTask> _openTasks = [];
  List<AutoTask> _recentTasks = [];
  List<RiskAlert> _openRisks = [];
  List<RiskAlert> _resolvedRisks = [];
  List<AutomationRunLog> _logs = [];
  bool _loading = false;
  bool _running = false;

  List<AutoTask> get openTasks => List.unmodifiable(_openTasks);
  List<AutoTask> get recentTasks => List.unmodifiable(_recentTasks);
  List<RiskAlert> get openRisks => List.unmodifiable(_openRisks);
  List<RiskAlert> get resolvedRisks => List.unmodifiable(_resolvedRisks);
  List<AutomationRunLog> get logs => List.unmodifiable(_logs);
  bool get loading => _loading;
  bool get running => _running;

  int get openTaskCount => _openTasks.length;
  int get riskCount => _openRisks.where((r) => r.isRisk).length;
  int get warningCount => _openRisks.where((r) => r.isWarning).length;

  /// 已升级任务（流程阻塞/需升级）
  int get escalatedTaskCount =>
      _openTasks.where((t) => t.escalationLevel > 0).length;

  /// 首页风险预警卡：风险优先，其次预警
  List<RiskAlert> get prioritizedRisks {
    final list = [..._openRisks];
    list.sort((a, b) {
      if (a.isRisk != b.isRisk) return a.isRisk ? -1 : 1;
      return b.createdAt.compareTo(a.createdAt);
    });
    return list;
  }

  Map<String, dynamic> get _base => {
        'orgId': _orgIdGetter(),
        'userId': _userIdGetter(),
      };

  Future<void> load() async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    if (_loading) return;
    _loading = true;
    notifyListeners();

    try {
      final data = await _cloud.callChecked(
        'get-governance-center',
        params: {..._base},
        timeout: const Duration(seconds: 40),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final tasks = map['tasks'];
      if (tasks is Map) {
        _openTasks = _parseTasks(tasks['open']);
        _recentTasks = _parseTasks(tasks['recent']);
      }
      final risks = map['risks'];
      if (risks is Map) {
        _openRisks = _parseRisks(risks['open']);
        _resolvedRisks = _parseRisks(risks['resolved']);
      }
      final logs = map['logs'];
      if (logs is List) {
        _logs = logs
            .map((e) =>
                AutomationRunLog.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
      notifyListeners();
    } catch (e) {
      debugPrint('GovernanceProvider.load failed: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// 运行规则引擎（服务端执行 GR-01~GR-05 并更新任务/风险/审计日志）
  Future<Map<String, dynamic>> runRules() async {
    _running = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'run-governance-rules',
        params: {
          ..._base,
          'userName': _userNameGetter(),
        },
        timeout: const Duration(seconds: 90),
      );
      await load();
      return data is Map<String, dynamic> ? data : <String, dynamic>{};
    } catch (e) {
      debugPrint('GovernanceProvider.runRules failed: $e');
      rethrow;
    } finally {
      _running = false;
      notifyListeners();
    }
  }

  /// 处理自动任务：done / cancel / reopen
  Future<void> actTask(String id, String action) async {
    await _cloud.callChecked(
      'act-auto-task',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'idempotencyKey': CloudFunctionService.newIdempotencyKey('act_auto_task'),
        'id': id,
        'action': action,
      },
      timeout: const Duration(seconds: 30),
    );
    await load();
  }

  /// 处理风险/预警：resolve / ack / reopen
  Future<void> actRisk(String id, String action, {String note = ''}) async {
    await _cloud.callChecked(
      'act-risk-alert',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'idempotencyKey': CloudFunctionService.newIdempotencyKey('act_risk'),
        'id': id,
        'action': action,
        if (note.isNotEmpty) 'note': note,
      },
      timeout: const Duration(seconds: 30),
    );
    await load();
  }

  List<AutoTask> _parseTasks(dynamic v) {
    if (v is! List) return [];
    return v
        .map((e) => AutoTask.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  List<RiskAlert> _parseRisks(dynamic v) {
    if (v is! List) return [];
    return v
        .map((e) => RiskAlert.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
