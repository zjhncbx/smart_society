import 'package:flutter/foundation.dart';

import '../models/project.dart';
import '../services/storage_service.dart';
import 'sync_provider.dart';

/// 项目管理状态：列表、创建、编辑、任务/里程碑管理、状态流转、删除。
class ProjectProvider extends ChangeNotifier {
  ProjectProvider({required String Function() orgIdGetter})
      : _orgIdGetter = orgIdGetter;

  final StorageService _storage = StorageService.instance;
  final String Function() _orgIdGetter;

  List<Project> _projects = [];

  List<Project> get projects => _projects;

  /// 按开始日期倒序（最近的在前）
  List<Project> get sortedProjects {
    final list = [..._projects];
    list.sort((a, b) => b.startDate.compareTo(a.startDate));
    return list;
  }

  Future<void> load() async {
    final box = _storage.projectsBox;
    final currentOrgId = _orgIdGetter();
    _projects = box.values
        .map((e) => Project.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((p) => currentOrgId.isEmpty || p.orgId == currentOrgId)
        .toList();
    notifyListeners();
  }

  Project? findById(String id) {
    for (final p in _projects) {
      if (p.id == id) return p;
    }
    return null;
  }

  /// 内存更新 + Hive 落盘 + 云端自动提交
  Future<void> saveProject(Project project) async {
    if (project.orgId.isEmpty) {
      project.orgId = _orgIdGetter();
    }
    project.progress = project.recomputeProgress();
    final index = _projects.indexWhere((p) => p.id == project.id);
    if (index >= 0) {
      _projects[index] = project;
    } else {
      _projects.add(project);
    }
    await _storage.projectsBox.put(project.id, project.toJson());
    notifyListeners();
    SyncProvider.instance
        .enqueue('project', project.id, SyncOp.upsert, project.toJson());
  }

  Future<void> deleteProject(String id) async {
    final found = findById(id);
    final orgId = found?.orgId ?? _orgIdGetter();
    _projects.removeWhere((p) => p.id == id);
    await _storage.projectsBox.delete(id);
    notifyListeners();
    SyncProvider.instance
        .enqueue('project', id, SyncOp.delete, {'id': id, 'orgId': orgId});
  }

  /// 状态流转：0筹备中→1进行中↔2已暂停→3已完成；已完成可重新开启为进行中。
  Future<void> updateStatus(String projectId, int newStatus) async {
    final project = findById(projectId);
    if (project == null) return;
    project.status = newStatus;
    await saveProject(project);
  }

  Future<void> addTask(String projectId, ProjectTask task) async {
    final project = findById(projectId);
    if (project == null) return;
    project.tasks.add(task);
    await saveProject(project);
  }

  Future<void> removeTask(String projectId, String taskId) async {
    final project = findById(projectId);
    if (project == null) return;
    project.tasks.removeWhere((t) => t.id == taskId);
    await saveProject(project);
  }

  Future<void> addMilestone(String projectId, ProjectMilestone milestone) async {
    final project = findById(projectId);
    if (project == null) return;
    project.milestones.add(milestone);
    await saveProject(project);
  }

  Future<void> toggleMilestone(String projectId, String milestoneId) async {
    final project = findById(projectId);
    if (project == null) return;
    final ms = project.milestones.where((m) => m.id == milestoneId).firstOrNull;
    if (ms == null) return;
    ms.status = ms.status == 1 ? 0 : 1;
    await saveProject(project);
  }

  Future<void> removeMilestone(String projectId, String milestoneId) async {
    final project = findById(projectId);
    if (project == null) return;
    project.milestones.removeWhere((m) => m.id == milestoneId);
    await saveProject(project);
  }

  static String nextProjectId(List<Project> projects) {
    var max = 0;
    for (final p in projects) {
      final n = int.tryParse(p.id.replaceFirst('p', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'p${(max + 1).toString().padLeft(3, '0')}';
  }

  static String nextTaskId(Project project) {
    var max = 0;
    for (final t in project.tasks) {
      final n = int.tryParse(t.id.replaceFirst('t', '')) ?? 0;
      if (n > max) max = n;
    }
    return 't${(max + 1).toString().padLeft(3, '0')}';
  }

  static String nextMilestoneId(Project project) {
    var max = 0;
    for (final m in project.milestones) {
      final n = int.tryParse(m.id.replaceFirst('m', '')) ?? 0;
      if (n > max) max = n;
    }
    return 'm${(max + 1).toString().padLeft(3, '0')}';
  }
}
