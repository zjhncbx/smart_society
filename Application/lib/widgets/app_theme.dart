import 'package:flutter/material.dart';

/// 设计令牌：钉钉/飞书风格（浅灰画布、白色卡片、极浅边框、语义化功能色）
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
  final List<List<Color>> avatarGradients;

  const AppTheme({
    this.cardRadius = 16,
    this.controlRadius = 12,
    this.badgeRadius = 20,
    this.scaffoldBackground = const Color(0xFFF5F6F7),
    this.cardColor = Colors.white,
    this.cardBorderColor = const Color(0xFFECECEF),
    this.dividerColor = const Color(0xFFF0F0F3),
    this.textSecondary = const Color(0xFF8A9099),
    this.brandColor = const Color(0xFF3370FF),
    this.avatarGradients = _defaultGradients,
  });

  static const List<List<Color>> _defaultGradients = [
    [Color(0xFF5B8DEF), Color(0xFF3370FF)],
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
      scaffoldBackground: dark ? cs.surface : const Color(0xFFF5F6F7),
      cardColor: dark ? cs.surfaceContainerLow : Colors.white,
      cardBorderColor: dark ? cs.outlineVariant : const Color(0xFFECECEF),
      dividerColor: dark ? cs.outlineVariant : const Color(0xFFF0F0F3),
      textSecondary: dark ? cs.onSurfaceVariant : const Color(0xFF8A9099),
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
