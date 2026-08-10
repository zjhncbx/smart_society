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
  });

  final String id;
  final String title;
  final String content;
  final String publisher;
  final DateTime publishTime;
  bool isRead;
  final bool isImportant;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'publisher': publisher,
        'publishTime': publishTime.millisecondsSinceEpoch,
        'isRead': isRead,
        'isImportant': isImportant,
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
      );
}
