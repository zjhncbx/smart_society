import 'package:flutter/foundation.dart';

import '../models/business_event.dart';
import '../services/cloud_function_service.dart';

/// 组织事件流（WF-01）：云端权威数据，统一记录业务事件并按组织隔离。
///
/// 支持按业务对象/事件类型/级别筛选与分页加载；首页“组织动态”直接取最近事件。
class EventProvider extends ChangeNotifier {
  EventProvider({
    required String Function() orgIdGetter,
    required String Function() userIdGetter,
  })  : _orgIdGetter = orgIdGetter,
        _userIdGetter = userIdGetter;

  final CloudFunctionService _cloud = CloudFunctionService.instance;
  final String Function() _orgIdGetter;
  final String Function() _userIdGetter;

  List<BusinessEvent> _events = [];
  int _total = 0;
  bool _hasMore = false;
  bool _loading = false;
  String _entityType = '';
  String _eventType = '';
  String _level = '';
  int _page = 0;

  List<BusinessEvent> get events => List.unmodifiable(_events);
  int get total => _total;
  bool get hasMore => _hasMore;
  bool get loading => _loading;
  String get entityType => _entityType;
  String get eventType => _eventType;
  String get level => _level;

  /// 首页“组织动态”：最近 3 条，仅过滤空值。
  List<BusinessEvent> get recentEvents {
    final list = [..._events];
    return list.take(3).toList();
  }

  Map<String, dynamic> get _base => {
        'orgId': _orgIdGetter(),
        'userId': _userIdGetter(),
      };

  /// 重新加载（可切换筛选条件）；reset=false 时追加下一页。
  Future<void> load({
    bool reset = true,
    String? entityType,
    String? eventType,
    String? level,
  }) async {
    final orgId = _orgIdGetter();
    final userId = _userIdGetter();
    if (orgId.isEmpty || userId.isEmpty) return;

    if (reset) {
      _entityType = entityType ?? '';
      _eventType = eventType ?? '';
      _level = level ?? '';
      _page = 0;
    }
    if (_loading) return;
    _loading = true;
    notifyListeners();

    try {
      final data = await _cloud.callChecked(
        'get-business-events',
        params: {
          ..._base,
          if (_entityType.isNotEmpty) 'entityType': _entityType,
          if (_eventType.isNotEmpty) 'eventType': _eventType,
          if (_level.isNotEmpty) 'level': _level,
          'page': _page,
          'pageSize': 30,
        },
        timeout: const Duration(seconds: 30),
      );
      final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
      final list = map['events'];
      if (list is List) {
        final parsed = list
            .map((e) => BusinessEvent.fromJson(
                Map<String, dynamic>.from(e as Map)))
            .toList();
        if (reset) {
          _events = parsed;
        } else {
          final ids = _events.map((e) => e.id).toSet();
          _events.addAll(parsed.where((e) => !ids.contains(e.id)));
        }
      }
      _total = (map['total'] as num?)?.toInt() ?? _events.length;
      _hasMore = (map['hasMore'] as bool?) ?? false;
      _page += 1;
      notifyListeners();
    } catch (e) {
      debugPrint('EventProvider.load failed: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() => load(reset: false);

  /// 手动记录一条自定义业务事件（供客户端扩展场景使用）。
  Future<void> record({
    required String eventType,
    required String entityType,
    String entityId = '',
    String entityName = '',
    String? actorName,
    String level = 'info',
    Map<String, dynamic> metadata = const {},
  }) async {
    try {
      await _cloud.callChecked(
        'record-business-event',
        params: {
          ..._base,
          'eventType': eventType,
          'entityType': entityType,
          'entityId': entityId,
          'entityName': entityName,
          if (actorName != null && actorName.isNotEmpty) 'actorName': actorName,
          'level': level,
          'metadata': metadata,
        },
      );
      await load(reset: true);
    } catch (e) {
      debugPrint('EventProvider.record failed: $e');
    }
  }
}
