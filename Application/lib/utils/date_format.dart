import 'package:intl/intl.dart';

String formatDate(DateTime dt) => DateFormat('yyyy-MM-dd').format(dt);

String formatDateTime(DateTime dt) => DateFormat('yyyy-MM-dd HH:mm').format(dt);

String formatTime(DateTime dt) => DateFormat('HH:mm').format(dt);

/// 友好时间：今天/昨天/本周内显示相对描述，更早显示日期。
String formatRelative(DateTime dt, {
  String today = '今天',
  String yesterday = '昨天',
  String daysAgo = '天前',
}) {
  final now = DateTime.now();
  final todayStart = DateTime(now.year, now.month, now.day);
  final day = DateTime(dt.year, dt.month, dt.day);
  final diff = todayStart.difference(day).inDays;

  if (diff <= 0) {
    return '$today ${formatTime(dt)}';
  }
  if (diff == 1) {
    return '$yesterday ${formatTime(dt)}';
  }
  if (diff < 7) {
    return '$diff$daysAgo';
  }
  return formatDate(dt);
}
