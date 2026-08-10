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
    this.updatedAt,
  });

  final String id;
  final String title;
  final String content;
  final String publisher;
  final DateTime publishTime;
  bool isRead;
  final bool isImportant;
  final String orgId;
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
        if (updatedAt != null) 'updatedAt': updatedAt!.millisecondsSinceEpoch,
      };

  factory Notice.fromJson(Map<String, dynamic> json) => Notice(
        id: json['id'] as String,
        title: json['title'] as String,
        content: (json['content'] as String?) ?? '',
        publisher: (json['publisher'] as String?) ?? '社长办公室',
        publishTime: DateTime.fromMillisecondsSinceEpoch(
          (json['publishTime'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
        ),
        isRead: (json['isRead'] as bool?) ?? false,
        isImportant: (json['isImportant'] as bool?) ?? false,
        orgId: (json['orgId'] as String?) ?? '',
        updatedAt: (json['updatedAt'] as int?) != null
            ? DateTime.fromMillisecondsSinceEpoch(json['updatedAt'] as int)
            : null,
      );
}
