import 'package:flutter/material.dart';

import 'app_theme.dart';

/// 成员头像：品牌渐变底 + 白色首字（钉钉/飞书风格）
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

  @override
  Widget build(BuildContext context) {
    final appTheme = Theme.of(context).extension<AppTheme>() ?? AppTheme();
    final letter = name.isEmpty ? '?' : name.characters.first;
    final gradients = appTheme.avatarGradients;
    final colors = gradients[colorIndex % gradients.length];
    return CircleAvatar(
      radius: radius,
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: colors,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          letter,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: radius * 0.85,
          ),
        ),
      ),
    );
  }
}
