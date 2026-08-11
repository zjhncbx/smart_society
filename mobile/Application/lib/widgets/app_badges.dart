import 'package:flutter/material.dart';

enum BadgeVariant { info, success, warning, error, neutral }

const Color kBadgeInfo = Color(0xFF3370FF);
const Color kBadgeSuccess = Color(0xFF00B96B);
const Color kBadgeWarning = Color(0xFFFF8800);
const Color kBadgeError = Color(0xFFF54A45);
const Color kBadgeNeutral = Color(0xFF8A9099);

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
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: color),
      ),
    );
  }
}
