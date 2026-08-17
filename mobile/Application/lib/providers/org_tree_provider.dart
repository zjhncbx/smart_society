import 'package:flutter/foundation.dart';

import '../services/cloud_function_service.dart';

/// 组织层级与数据共享关系管理。
class OrgTreeProvider extends ChangeNotifier {
  final CloudFunctionService _cloud = CloudFunctionService.instance;

  Map<String, dynamic>? _hierarchy;
  bool _loading = false;

  Map<String, dynamic>? get hierarchy => _hierarchy;
  bool get loading => _loading;

  /// 获取 orgId 及其关联组织（子组织、合作组织中的共享数据）的所有数据源 orgId 列表。
  List<String> getAllDataSources(String orgId) {
    final ids = <String>[orgId];
    final h = _hierarchy;
    if (h == null) return ids;
    final children = (h['children'] as List?) ?? [];
    for (final c in children) {
      final childOrg = c['org'];
      if (childOrg != null && (c['shareMembers'] == true || c['shareActivities'] == true || c['shareNotices'] == true)) {
        ids.add(childOrg['orgId'] as String);
      }
    }
    final partners = (h['partners'] as List?) ?? [];
    for (final p in partners) {
      final partnerOrg = p['org'];
      if (partnerOrg != null && (p['shareMembers'] == true || p['shareActivities'] == true || p['shareNotices'] == true)) {
        ids.add(partnerOrg['orgId'] as String);
      }
    }
    return ids;
  }

  Future<void> loadHierarchy(String orgId, {String userId = ''}) async {
    _loading = true;
    notifyListeners();
    try {
      _hierarchy = await _cloud.callChecked(
        'get-org-hierarchy',
        params: {
          'orgId': orgId,
          if (userId.isNotEmpty) 'userId': userId,
        },
      ) as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('LOAD_HIERARCHY_FAIL: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> setRelationship({
    required String orgId,
    required String relatedOrgId,
    required String relType,
    bool shareMembers = false,
    bool shareActivities = false,
    bool shareNotices = false,
    required String userId,
  }) async {
    await _cloud.callChecked('set-org-relationship', params: {
      'orgId': orgId,
      'relatedOrgId': relatedOrgId,
      'relType': relType,
      'shareMembers': shareMembers,
      'shareActivities': shareActivities,
      'shareNotices': shareNotices,
      'userId': userId,
    });
    await loadHierarchy(orgId, userId: userId);
  }
}
