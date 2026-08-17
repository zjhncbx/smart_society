/// 通知公告
class Notice {
  Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.publisher,
    required this.publishTime,
    this.isRead = false,
    this.isImportant = false,
    this.orgId = '',
    this.code = '',
    this.status = 'active',
    this.createdAt,
    this.createdBy = '',
    this.updatedBy = '',
    this.version = 1,
    this.sourceType = 'manual',
    this.sourceId = '',
    this.updatedAt,
  });

  final String id;
  final String title;
  final String content;
  final String publisher;
  final DateTime publishTime;
  bool isRead;
  final bool isImportant;
  String orgId;
  final String code;
  final String status;
  final DateTime? createdAt;
  final String createdBy;
  final String updatedBy;
  final int version;
  final String sourceType;
  final String sourceId;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'publisher': publisher,
        'publishTime': publishTime.millisecondsSinceEpoch,
        'isRead': isRead,
        'isImportant': isImportant,
        'orgId': orgId,
        'code': code,
        'status': status,
        if (createdAt != null) 'createdAt': createdAt!.millisecondsSinceEpoch,
        'createdBy': createdBy,
        'updatedBy': updatedBy,
        'version': version,
        'sourceType': sourceType,
        'sourceId': sourceId,
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory Notice.fromJson(Map<String, dynamic> json) => Notice(
        id: json['id'] as String,
        title: json['title'] as String,
        content: (json['content'] as String?) ?? '',
        publisher: (json['publisher'] as String?) ?? '社长办公室',
        publishTime: _toDate(json['publishTime']) ?? DateTime.now(),
        isRead: (json['isRead'] as bool?) ?? false,
        isImportant: (json['isImportant'] as bool?) ?? false,
        orgId: (json['orgId'] as String?) ?? '',
        code: (json['code'] as String?) ?? '',
        status: (json['status'] as String?) ?? 'active',
        createdAt: _toDate(json['createdAt']),
        createdBy: (json['createdBy'] as String?) ?? '',
        updatedBy: (json['updatedBy'] as String?) ?? '',
        version: (json['version'] as num?)?.toInt() ?? 1,
        sourceType: (json['sourceType'] as String?) ?? 'manual',
        sourceId: (json['sourceId'] as String?) ?? '',
        updatedAt: _toDate(json['updatedAt']),
      );
}

/// 兼容 int（epoch 毫秒）/ String（ISO 或数字）两种云端日期形态。
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
