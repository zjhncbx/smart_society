import 'dart:convert';

/// 项目状态：0 筹备中 / 1 进行中 / 2 已暂停 / 3 已完成
const int kProjectPreparing = 0;
const int kProjectActive = 1;
const int kProjectPaused = 2;
const int kProjectCompleted = 3;

/// 任务状态：0 待办 / 1 进行中 / 2 已完成
const int kTaskTodo = 0;
const int kTaskDoing = 1;
const int kTaskDone = 2;

/// 任务优先级：0 低 / 1 中 / 2 高
const int kPriorityLow = 0;
const int kPriorityMedium = 1;
const int kPriorityHigh = 2;

/// 项目内任务
class ProjectTask {
  ProjectTask({
    required this.id,
    required this.title,
    this.assigneeId = '',
    this.status = kTaskTodo,
    this.dueDate,
    this.priority = kPriorityMedium,
  });

  final String id;
  String title;
  String assigneeId;
  int status;
  DateTime? dueDate;
  int priority;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'assigneeId': assigneeId,
        'status': status,
        if (dueDate != null) 'dueDate': dueDate!.millisecondsSinceEpoch,
        'priority': priority,
      };

  factory ProjectTask.fromJson(Map<String, dynamic> json) => ProjectTask(
        id: json['id'] as String,
        title: (json['title'] as String?) ?? '',
        assigneeId: (json['assigneeId'] as String?) ?? '',
        status: (json['status'] as int?) ?? kTaskTodo,
        dueDate: _toDate(json['dueDate']),
        priority: (json['priority'] as int?) ?? kPriorityMedium,
      );
}

/// 项目里程碑
class ProjectMilestone {
  ProjectMilestone({
    required this.id,
    required this.title,
    this.dueDate,
    this.status = 0,
  });

  final String id;
  String title;
  DateTime? dueDate;
  int status; // 0 未完成 / 1 已完成

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        if (dueDate != null) 'dueDate': dueDate!.millisecondsSinceEpoch,
        'status': status,
      };

  factory ProjectMilestone.fromJson(Map<String, dynamic> json) =>
      ProjectMilestone(
        id: json['id'] as String,
        title: (json['title'] as String?) ?? '',
        dueDate: _toDate(json['dueDate']),
        status: (json['status'] as int?) ?? 0,
      );
}

/// 项目
class Project {
  Project({
    required this.id,
    required this.name,
    this.description = '',
    this.managerId = '',
    required this.startDate,
    required this.endDate,
    this.status = kProjectPreparing,
    this.progress = 0,
    this.budget = 0,
    List<ProjectTask>? tasks,
    List<ProjectMilestone>? milestones,
    required this.createdAt,
    this.orgId = '',
    this.code = '',
    this.createdBy = '',
    this.updatedBy = '',
    this.version = 1,
    this.sourceType = 'manual',
    this.sourceId = '',
    this.updatedAt,
  })  : tasks = tasks ?? [],
        milestones = milestones ?? [];

  final String id;
  String name;
  String description;
  String managerId;
  DateTime startDate;
  DateTime endDate;
  int status;
  int progress;
  double budget;
  final List<ProjectTask> tasks;
  final List<ProjectMilestone> milestones;
  final DateTime createdAt;
  String orgId;
  final String code;
  final String createdBy;
  final String updatedBy;
  final int version;
  final String sourceType;
  final String sourceId;
  DateTime? updatedAt;

  int get taskCount => tasks.length;
  int get doneTaskCount => tasks.where((t) => t.status == kTaskDone).length;
  int get milestoneCount => milestones.length;
  int get doneMilestoneCount =>
      milestones.where((m) => m.status == 1).length;

  /// 根据任务与里程碑完成比例自动计算进度（0-100）。
  int recomputeProgress() {
    if (status == kProjectCompleted) return 100;
    final taskRatio = tasks.isEmpty ? 0.0 : doneTaskCount / tasks.length;
    final msRatio =
        milestones.isEmpty ? 0.0 : doneMilestoneCount / milestones.length;
    if (tasks.isEmpty && milestones.isEmpty) return 0;
    return ((taskRatio * 0.7 + msRatio * 0.3) * 100).round();
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'managerId': managerId,
        'startDate': startDate.millisecondsSinceEpoch,
        'endDate': endDate.millisecondsSinceEpoch,
        'status': status,
        'progress': progress,
        'budget': budget,
        // 与云端约定一致：子对象整体存为 JSON 字符串
        'tasks': jsonEncode(tasks.map((t) => t.toJson()).toList()),
        'milestones': jsonEncode(milestones.map((m) => m.toJson()).toList()),
        'createdAt': createdAt.millisecondsSinceEpoch,
        'orgId': orgId,
        'code': code,
        'createdBy': createdBy,
        'updatedBy': updatedBy,
        'version': version,
        'sourceType': sourceType,
        'sourceId': sourceId,
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['id'] as String,
        name: (json['name'] as String?) ?? '',
        description: (json['description'] as String?) ?? '',
        managerId: (json['managerId'] as String?) ?? '',
        startDate: _toDate(json['startDate']) ?? DateTime.now(),
        endDate: _toDate(json['endDate']) ?? DateTime.now(),
        status: (json['status'] as int?) ?? kProjectPreparing,
        progress: (json['progress'] as int?) ?? 0,
        budget: (json['budget'] as num?)?.toDouble() ?? 0,
        tasks: _parseTasks(json['tasks']),
        milestones: _parseMilestones(json['milestones']),
        createdAt: _toDate(json['createdAt']) ?? DateTime.now(),
        orgId: (json['orgId'] as String?) ?? '',
        code: (json['code'] as String?) ?? '',
        createdBy: (json['createdBy'] as String?) ?? '',
        updatedBy: (json['updatedBy'] as String?) ?? '',
        version: (json['version'] as num?)?.toInt() ?? 1,
        sourceType: (json['sourceType'] as String?) ?? 'manual',
        sourceId: (json['sourceId'] as String?) ?? '',
        updatedAt: _toDate(json['updatedAt']),
      );

  static List<ProjectTask> _parseTasks(dynamic v) {
    final list = _toList(v);
    return list
        .map((e) => ProjectTask.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  static List<ProjectMilestone> _parseMilestones(dynamic v) {
    final list = _toList(v);
    return list
        .map((e) => ProjectMilestone.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}

/// 兼容 String（JSON 字符串）与 List 两种形态。
List<dynamic> _toList(dynamic v) {
  if (v == null) return [];
  if (v is List) return v;
  if (v is String) {
    if (v.isEmpty) return [];
    try {
      final decoded = jsonDecode(v);
      return decoded is List ? decoded : [];
    } catch (_) {
      return [];
    }
  }
  return [];
}

/// 兼容 int（epoch 毫秒）/ String（ISO）/ DateTime 三种形态。
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
