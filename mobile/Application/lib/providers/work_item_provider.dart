import 'package:flutter/foundation.dart';

import '../models/work_item.dart';
import '../services/cloud_function_service.dart';

/// 统一工作项（P0-A）：Web/移动端只消费 WorkItem 视图，来源详情仍指向源对象。
class WorkItemProvider extends ChangeNotifier {
  WorkItemProvider({
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

  List<WorkItem> _items = [];
  int _total = 0;
  int _openCount = 0;
  bool _hasMore = false;
  bool _loading = false;
  bool _refreshing = false;
  String _workItemType = '';
  String _status = '';

  List<WorkItem> get items => List.unmodifiable(_items);
  int get total => _total;
  int get openCount => _openCount;
  bool get hasMore => _hasMore;
  bool get loading => _loading;
  bool get refreshing => _refreshing;
  String get workItemType => _workItemType;

  /// 待处理优先，其次按时间倒序
  List<WorkItem> get sortedItems {
    final list = [..._items];
    list.sort((a, b) {
      if (a.isOpen != b.isOpen) return a.isOpen ? -1 : 1;
      return (b.updatedAt ?? b.createdAt).compareTo(a.updatedAt ?? a.createdAt);
    });
    return list;
  }

  Map<String, dynamic> get _base => {
        'orgId': _orgIdGetter(),
        'userId': _userIdGetter(),
      };

  Future<void> load({
    bool reset = true,
    String? workItemType,
    String? status,
  }) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;
    if (reset) {
      _workItemType = workItemType ?? '';
      _status = status ?? '';
    }
    if (_loading) return;
    _loading = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'get-work-items',
        params: {
          ..._base,
          if (_workItemType.isNotEmpty) 'workItemType': _workItemType,
          if (_status.isNotEmpty) 'status': _status,
          'page': reset ? 0 : (_items.length ~/ 30),
          'pageSize': 30,
        },
        timeout: const Duration(seconds: 40),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['items'];
      if (list is List) {
        final parsed = list
            .map((e) => WorkItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        if (reset) {
          _items = parsed;
        } else {
          final ids = _items.map((e) => e.id).toSet();
          _items.addAll(parsed.where((e) => !ids.contains(e.id)));
        }
      }
      _total = (map['total'] as num?)?.toInt() ?? _items.length;
      _openCount = (map['openCount'] as num?)?.toInt() ?? 0;
      _hasMore = (map['hasMore'] as bool?) ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('WorkItemProvider.load failed: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// 从来源业务重新物化工作项视图
  Future<Map<String, dynamic>> refresh() async {
    _refreshing = true;
    notifyListeners();
    try {
      final data = await _cloud.callChecked(
        'refresh-work-items',
        params: {..._base},
        timeout: const Duration(seconds: 90),
      );
      await load(reset: true);
      return data is Map<String, dynamic> ? data : <String, dynamic>{};
    } catch (e) {
      debugPrint('WorkItemProvider.refresh failed: $e');
      rethrow;
    } finally {
      _refreshing = false;
      notifyListeners();
    }
  }

  /// 处理工作项：done/cancel/reopen（审批与项目任务由来源系统处理）
  Future<void> act(String id, String action) async {
    await _cloud.callChecked(
      'act-work-item',
      params: {
        ..._base,
        'userName': _userNameGetter(),
        'id': id,
        'action': action,
      },
      timeout: const Duration(seconds: 30),
    );
    await load(reset: true);
  }
}
