import 'package:flutter/material.dart';

import '../config/theme_config.dart';

enum BadgeVariant { info, success, warning, error, neutral }

// 语义色与 Web 端 tokens.ts 同源（DesignTokens 为唯一基准）
const Color kBadgeInfo = DesignTokens.primary;
const Color kBadgeSuccess = DesignTokens.success;
const Color kBadgeWarning = DesignTokens.warning;
const Color kBadgeError = DesignTokens.error;
const Color kBadgeNeutral = DesignTokens.textTertiary;

class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeVariant variant;

  const StatusBadge({
    super.key,
    required this.label,
    this.variant = BadgeVariant.info,
  });

  Color _color(ColorScheme cs) => switch (variant) {
        BadgeVariant.info => kBadgeInfo,
        BadgeVariant.success => kBadgeSuccess,
        BadgeVariant.warning => kBadgeWarning,
        BadgeVariant.error => kBadgeError,
        BadgeVariant.neutral => kBadgeNeutral,
      };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = _color(cs);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(DesignTokens.radiusPill),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: DesignTokens.fontSizeSm,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
