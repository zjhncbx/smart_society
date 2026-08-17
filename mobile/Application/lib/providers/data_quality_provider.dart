import 'package:flutter/foundation.dart';

import '../models/data_quality.dart';
import '../services/cloud_function_service.dart';

/// 数据质量中心（DQ-02）：云端权威数据。
///
/// 运行确定性质量规则 → 生成/复用/自动关闭问题 → 计算健康度快照；
/// 支持按分类/状态筛选问题清单，问题可人工处理（解决/忽略/重开）。
class DataQualityProvider extends ChangeNotifier {
  DataQualityProvider({
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

  DataQualitySnapshot _snapshot = const DataQualitySnapshot();
  List<DataQualityIssue> _issues = [];
  int _total = 0;
  int _openTotal = 0;
  bool _hasMore = false;
  bool _loading = false;
  bool _running = false;
  String _category = '';
  String _status = '';

  DataQualitySnapshot get snapshot => _snapshot;
  List<DataQualityIssue> get issues => List.unmodifiable(_issues);

  /// 首页健康度卡片展示：未处理问题数
  int get openTotal => _openTotal;
  int get total => _total;
  bool get hasMore => _hasMore;
  bool get loading => _loading;
  bool get running => _running;
  String get category => _category;
  String get status => _status;

  /// 严重（high）且待处理的问题数
  int get highSeverityOpenCount =>
      _issues.where((i) => i.isOpen && i.severity == 'high').length;

  /// 待处理问题（open 优先，其次按时间倒序）
  List<DataQualityIssue> get sortedIssues {
    final list = [..._issues];
    list.sort((a, b) {
      if (a.isOpen != b.isOpen) return a.isOpen ? -1 : 1;
      return b.createdAt.compareTo(a.createdAt);
    });
    return list;
  }

  Map<String, dynamic> get _base => {
        'orgId': _orgIdGetter(),
        'userId': _userIdGetter(),
      };

  Future<void> load({bool reset = true, String? category, String? status}) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    if (reset) {
      _category = category ?? '';
      _status = status ?? '';
    }
    if (_loading) return;
    _loading = true;
    notifyListeners();

    try {
      final data = await _cloud.callChecked(
        'get-data-quality',
        params: {
          ..._base,
          if (_category.isNotEmpty) 'category': _category,
          if (_status.isNotEmpty) 'status': _status,
          'page': reset ? 0 : (_issues.length ~/ 50),
          'pageSize': 50,
        },
        timeout: const Duration(seconds: 40),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final snap = map['snapshot'];
      if (snap is Map) {
        _snapshot = DataQualitySnapshot.fromJson(
            Map<String, dynamic>.from(snap));
      }
      final list = map['issues'];
      if (list is List) {
        final parsed = list
            .map((e) => DataQualityIssue.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        if (reset) {
          _issues = parsed;
        } else {
          final ids = _issues.map((e) => e.id).toSet();
          _issues.addAll(parsed.where((e) => !ids.contains(e.id)));
        }
      }
      _total = (map['total'] as num?)?.toInt() ?? _issues.length;
      _openTotal = (map['openTotal'] as num?)?.toInt() ?? 0;
      _hasMore = (map['hasMore'] as bool?) ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('DataQualityProvider.load failed: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() => load(reset: false);

  /// 运行数据质量检查（服务端执行规则并更新快照）
  Future<int> runCheck() async {
    _running = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'run-data-quality',
        params: {
          ..._base,
          'userName': _userNameGetter(),
        },
        timeout: const Duration(seconds: 60),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final score = (map['score'] as num?)?.toInt() ?? 100;
      await load(reset: true);
      return score;
    } catch (e) {
      debugPrint('DataQualityProvider.runCheck failed: $e');
      rethrow;
    } finally {
      _running = false;
      notifyListeners();
    }
  }

  /// 处理数据质量问题：resolve 解决 / ignore 忽略 / reopen 重开
  Future<void> act(String id, String action, {String note = ''}) async {
    await _cloud.callChecked(
      'resolve-data-quality-issue',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'id': id,
        'action': action,
        if (note.isNotEmpty) 'note': note,
      },
      timeout: const Duration(seconds: 30),
    );
    await load(reset: true);
  }
}
