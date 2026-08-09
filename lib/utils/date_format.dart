import 'package:intl/intl.dart';

String formatDate(DateTime dt) => DateFormat('yyyy-MM-dd').format(dt);

String formatDateTime(DateTime dt) => DateFormat('yyyy-MM-dd HH:mm').format(dt);

String formatTime(DateTime dt) => DateFormat('HH:mm').format(dt);

/// 友好时间：今天/昨天/本周内显示相对描述，更早显示日期。
String formatRelative(DateTime dt) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(dt.year, dt.month, dt.day);
  final diff = today.difference(day).inDays;

  if (diff <= 0) {
    return '今天 ${formatTime(dt)}';
  }
  if (diff == 1) {
    return '昨天 ${formatTime(dt)}';
  }
  if (diff < 7) {
    return '$diff天前';
  }
  return formatDate(dt);
}
