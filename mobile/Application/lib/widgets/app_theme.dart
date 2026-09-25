import 'package:flutter/material.dart';

import '../config/theme_config.dart';

/// 设计令牌：钉钉/飞书风格（浅灰画布、白色卡片、极浅边框、语义化功能色）。
/// 色彩/圆角/阴影基准统一取自 DesignTokens（与 Web 端 tokens.ts 同源）。
class AppTheme extends ThemeExtension<AppTheme> {
  final double cardRadius;
  final double controlRadius;
  final double badgeRadius;
  final Color scaffoldBackground;
  final Color cardColor;
  final Color cardBorderColor;
  final Color dividerColor;
  final Color textSecondary;
  final Color brandColor;
  final List<BoxShadow> cardShadow;
  final List<BoxShadow> floatingShadow;
  final List<List<Color>> avatarGradients;

  const AppTheme({
    this.cardRadius = DesignTokens.radiusLarge,
    this.controlRadius = DesignTokens.radiusCard,
    this.badgeRadius = 20,
    this.scaffoldBackground = DesignTokens.scaffoldLight,
    this.cardColor = DesignTokens.cardLight,
    this.cardBorderColor = DesignTokens.borderLight,
    this.dividerColor = DesignTokens.dividerLight,
    this.textSecondary = DesignTokens.textSecondary,
    this.brandColor = DesignTokens.primary,
    this.cardShadow = const [DesignTokens.shadowCard],
    this.floatingShadow = const [DesignTokens.shadowFloating],
    this.avatarGradients = _defaultGradients,
  });

  static const List<List<Color>> _defaultGradients = [
    [Color(0xFF4096FF), Color(0xFF1677FF)],
    [Color(0xFF7C6FE0), Color(0xFF5B4FCE)],
    [Color(0xFF4FB3A6), Color(0xFF2E8B7E)],
    [Color(0xFFE8A33D), Color(0xFFD47E16)],
    [Color(0xFFE06B6B), Color(0xFFC94F4F)],
    [Color(0xFF6BA8E0), Color(0xFF3D7EC2)],
    [Color(0xFF9B6FE0), Color(0xFF7A4FC2)],
    [Color(0xFF5FAE6B), Color(0xFF3E8F4B)],
  ];

  factory AppTheme.fromColorScheme(ColorScheme cs) {
    final dark = cs.brightness == Brightness.dark;
    return AppTheme(
      // 深色模式为黑色画布 + 深灰卡片（钉钉/飞书深色风格）
      scaffoldBackground:
          dark ? DesignTokens.scaffoldDark : DesignTokens.scaffoldLight,
      cardColor: dark ? DesignTokens.cardDark : DesignTokens.cardLight,
      cardBorderColor:
          dark ? DesignTokens.borderDark : DesignTokens.borderLight,
      dividerColor: dark ? const Color(0xFF26262A) : DesignTokens.dividerLight,
      textSecondary: dark ? const Color(0xFF9A9AA0) : DesignTokens.textSecondary,
      brandColor: cs.primary,
    );
  }

  @override
  ThemeExtension<AppTheme> copyWith({
    double? cardRadius,
    double? controlRadius,
    double? badgeRadius,
    Color? scaffoldBackground,
    Color? cardColor,
    Color? cardBorderColor,
    Color? dividerColor,
    Color? textSecondary,
    Color? brandColor,
    List<BoxShadow>? cardShadow,
    List<BoxShadow>? floatingShadow,
    List<List<Color>>? avatarGradients,
  }) =>
      AppTheme(
        cardRadius: cardRadius ?? this.cardRadius,
        controlRadius: controlRadius ?? this.controlRadius,
        badgeRadius: badgeRadius ?? this.badgeRadius,
        scaffoldBackground: scaffoldBackground ?? this.scaffoldBackground,
        cardColor: cardColor ?? this.cardColor,
        cardBorderColor: cardBorderColor ?? this.cardBorderColor,
        dividerColor: dividerColor ?? this.dividerColor,
        textSecondary: textSecondary ?? this.textSecondary,
        brandColor: brandColor ?? this.brandColor,
        cardShadow: cardShadow ?? this.cardShadow,
        floatingShadow: floatingShadow ?? this.floatingShadow,
        avatarGradients: avatarGradients ?? this.avatarGradients,
      );

  @override
  ThemeExtension<AppTheme> lerp(
    covariant ThemeExtension<AppTheme>? other,
    double t,
  ) =>
      other ?? this;
}

extension AppThemeExtension on BuildContext {
  AppTheme get appTheme =>
      Theme.of(this).extension<AppTheme>() ?? const AppTheme();
}
