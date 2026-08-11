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
    seedColor: Color(0xFF3370FF),
  );
  static const volunteer = ThemeConfig(
    name: '志愿风',
    seedColor: Color(0xFF00B96B),
  );
  static const youth = ThemeConfig(
    name: '青年风',
    seedColor: Color(0xFF7B61FF),
  );
  static const government = ThemeConfig(
    name: '政务风',
    seedColor: Color(0xFFC41E3A),
  );

  static const List<ThemeConfig> all = [campus, volunteer, youth, government];
}
