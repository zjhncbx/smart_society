import 'package:flutter/material.dart';

/// 主题配置（用户可选的三套品牌色）
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
    seedColor: Color(0xFF1677FF),
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

/// 设计 Token 阶梯（与 Web 端 web/src/theme/tokens.ts 同源映射）。
///
/// 全局视觉基准：功能色、中性色、圆角、阴影、字号、间距集中于此，
/// 组件与页面只读引用，禁止散落硬编码。
class DesignTokens {
  DesignTokens._();

  // ── 功能色（与 Web 同源：#1677FF 系） ──────────────────────
  static const Color primary = Color(0xFF1677FF);
  static const Color primaryHover = Color(0xFF4096FF);
  static const Color primaryActive = Color(0xFF0958D9);
  static const Color primaryBg = Color(0xFFE6F4FF);
  static const Color success = Color(0xFF52C41A);
  static const Color successBg = Color(0xFFF6FFED);
  static const Color warning = Color(0xFFFAAD14);
  static const Color warningBg = Color(0xFFFFFBE6);
  static const Color error = Color(0xFFFF4D4F);
  static const Color errorBg = Color(0xFFFFF2F0);

  // ── 中性色 ────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1F2329);
  static const Color textSecondary = Color(0xFF646A73);
  static const Color textTertiary = Color(0xFF8F959E);
  static const Color borderLight = Color(0xFFE5E6EB);
  static const Color dividerLight = Color(0xFFF0F0F3);
  static const Color fillLight = Color(0xFFF2F3F5);
  static const Color scaffoldLight = Color(0xFFF5F6F7);
  static const Color cardLight = Colors.white;
  static const Color scaffoldDark = Colors.black;
  static const Color cardDark = Color(0xFF1C1C1E);
  static const Color borderDark = Color(0xFF2C2C2E);

  // ── 扩展色板（快捷入口/事件流等场景的分类色） ─────────────
  static const Color accentPurple = Color(0xFF7B61FF);
  static const Color accentCyan = Color(0xFF13C2C2);
  static const Color accentDeepBlue = Color(0xFF1F5FBF);

  // ── 圆角阶梯（8/12/16） ───────────────────────────────────
  static const double radiusControl = 8;
  static const double radiusCard = 12;
  static const double radiusLarge = 16;
  static const double radiusPill = 999;

  // ── 阴影两档（卡片常驻 / 悬浮层） ─────────────────────────
  static const BoxShadow shadowCard = BoxShadow(
    color: Color(0x0A000000),
    offset: Offset(0, 1),
    blurRadius: 4,
  );
  static const BoxShadow shadowFloating = BoxShadow(
    color: Color(0x14000000),
    offset: Offset(0, 6),
    blurRadius: 16,
  );

  // ── 字号五级（与 Web 12/14/16/20/24 同源映射） ────────────
  static const double fontSizeXs = 12;
  static const double fontSizeSm = 14;
  static const double fontSizeMd = 16;
  static const double fontSizeLg = 20;
  static const double fontSizeXl = 24;

  // ── 字重层级 ──────────────────────────────────────────────
  static const FontWeight weightRegular = FontWeight.w400;
  static const FontWeight weightMedium = FontWeight.w500;
  static const FontWeight weightSemibold = FontWeight.w600;
  static const FontWeight weightBold = FontWeight.w700;

  // ── 间距阶梯（4 的倍数制，与 Web 同源） ────────────────────
  static const double spaceXs = 4;
  static const double spaceSm = 8;
  static const double spaceMd = 12;
  static const double spaceLg = 16;
  static const double spaceXl = 24;
  static const double spaceXxl = 32;

  // ── 布局尺寸 ──────────────────────────────────────────────
  static const double bottomNavHeight = 64;
  static const double pagePadding = 16;
}
