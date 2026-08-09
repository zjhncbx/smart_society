import 'package:flutter/material.dart';

class ThemeConfig {
  final String name;
  final Color seedColor;
  final Brightness brightness;

  const ThemeConfig({
    required this.name,
    required this.seedColor,
    this.brightness = Brightness.light,
  });

  static const campus = ThemeConfig(
    name: '校园风',
    seedColor: Color(0xFF3D6BD6),
  );
  static const volunteer = ThemeConfig(
    name: '志愿风',
    seedColor: Color(0xFFE06B3D),
  );
  static const youth = ThemeConfig(
    name: '青年风',
    seedColor: Color(0xFF2E7D32),
  );
  static const government = ThemeConfig(
    name: '政务风',
    seedColor: Color(0xFFC41E3A),
  );

  static const List<ThemeConfig> all = [campus, volunteer, youth, government];
}
