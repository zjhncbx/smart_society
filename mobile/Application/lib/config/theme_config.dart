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

  ThemeConfig copyWithBrightness(Brightness b) =>
      ThemeConfig(name: name, seedColor: seedColor, brightness: b);

  static const campus = ThemeConfig(
    name: '校园风',
    seedColor: Color(0xFF3370FF),
  );
  static const youth = ThemeConfig(
    name: '青年风',
    seedColor: Color(0xFF7B61FF),
  );
  static const welfare = ThemeConfig(
    name: '公益红',
    seedColor: Color(0xFFE64545),
  );

  /// 主题色列表（志愿风与政务风已合并为公益红）
  static const List<ThemeConfig> all = [campus, youth, welfare];
}
