/// 活动报名记录
class ActivityParticipant {
  ActivityParticipant({required this.memberId, required this.joinedAt});

  final String memberId;
  final DateTime joinedAt;

  Map<String, dynamic> toJson() => {
        'memberId': memberId,
        'joinedAt': joinedAt.millisecondsSinceEpoch,
      };

  factory ActivityParticipant.fromJson(Map<String, dynamic> json) =>
      ActivityParticipant(
        memberId: json['memberId'] as String,
        joinedAt: DateTime.fromMillisecondsSinceEpoch(
          (json['joinedAt'] as int?) ??
              DateTime.now().millisecondsSinceEpoch,
        ),
      );
}

/// 社团活动
class SocietyActivity {
  SocietyActivity({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.startTime,
    required this.endTime,
    required this.capacity,
    required this.organizer,
    this.participants = const [],
    required this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String location;
  final DateTime startTime;
  final DateTime endTime;
  final int capacity;
  final String organizer;
  final List<ActivityParticipant> participants;
  final DateTime createdAt;

  /// 活动状态：0 未开始 / 1 进行中 / 2 已结束
  int get status {
    final now = DateTime.now();
    if (now.isBefore(startTime)) return 0;
    if (now.isAfter(endTime)) return 2;
    return 1;
  }

  String get statusLabel => switch (status) {
        0 => '未开始',
        1 => '进行中',
        _ => '已结束',
      };

  int get participantCount => participants.length;

  bool get isFull => participants.length >= capacity;

  bool contains(String memberId) =>
      participants.any((p) => p.memberId == memberId);

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'location': location,
        'startTime': startTime.millisecondsSinceEpoch,
        'endTime': endTime.millisecondsSinceEpoch,
        'capacity': capacity,
        'organizer': organizer,
        'participants': participants.map((p) => p.toJson()).toList(),
        'createdAt': createdAt.millisecondsSinceEpoch,
      };

  factory SocietyActivity.fromJson(Map<String, dynamic> json) =>
      SocietyActivity(
        id: json['id'] as String,
        title: json['title'] as String,
        description: (json['description'] as String?) ?? '',
        location: (json['location'] as String?) ?? '',
        startTime: DateTime.fromMillisecondsSinceEpoch(
          (json['startTime'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
        ),
        endTime: DateTime.fromMillisecondsSinceEpoch(
          (json['endTime'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
        ),
        capacity: (json['capacity'] as int?) ?? 0,
        organizer: (json['organizer'] as String?) ?? '',
        participants: ((json['participants'] as List?) ?? const [])
            .map((e) => ActivityParticipant.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.fromMillisecondsSinceEpoch(
          (json['createdAt'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
        ),
      );
}
