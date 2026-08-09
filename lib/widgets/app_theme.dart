import 'package:flutter/material.dart';

class AppTheme extends ThemeExtension<AppTheme> {
  final double cardRadius;
  final double badgeRadius;
  final double chipRadius;

  const AppTheme({
    this.cardRadius = 14,
    this.badgeRadius = 10,
    this.chipRadius = 10,
  });

  factory AppTheme.fromColorScheme(ColorScheme cs) => const AppTheme();

  @override
  ThemeExtension<AppTheme> copyWith({
    double? cardRadius,
    double? badgeRadius,
    double? chipRadius,
  }) =>
      AppTheme(
        cardRadius: cardRadius ?? this.cardRadius,
        badgeRadius: badgeRadius ?? this.badgeRadius,
        chipRadius: chipRadius ?? this.chipRadius,
      );

  @override
  ThemeExtension<AppTheme> lerp(covariant ThemeExtension<AppTheme>? other, double t) =>
      other ?? this;
}
