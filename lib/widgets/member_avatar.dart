import 'package:flutter/material.dart';

/// 成员首字母头像（颜色由索引稳定映射）
class MemberAvatar extends StatelessWidget {
  const MemberAvatar({
    super.key,
    required this.name,
    required this.colorIndex,
    this.radius = 22,
  });

  final String name;
  final int colorIndex;
  final double radius;

  static const List<Color> _palette = [
    Color(0xFF5B8DEF),
    Color(0xFF7C6FE0),
    Color(0xFF4FB3A6),
    Color(0xFFE8A33D),
    Color(0xFFE06B6B),
    Color(0xFF6BA8E0),
    Color(0xFF9B6FE0),
    Color(0xFF5FAE6B),
  ];

  @override
  Widget build(BuildContext context) {
    final letter = name.isEmpty ? '?' : name.characters.first;
    final color = _palette[colorIndex % _palette.length];
    return CircleAvatar(
      radius: radius,
      backgroundColor: color.withValues(alpha: 0.15),
      child: Text(
        letter,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: radius * 0.9,
        ),
      ),
    );
  }
}
