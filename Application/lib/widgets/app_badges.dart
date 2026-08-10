import 'package:flutter/material.dart';

enum BadgeVariant { info, success, warning, error, neutral }

class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeVariant variant;

  const StatusBadge({
    super.key,
    required this.label,
    this.variant = BadgeVariant.info,
  });

  Color _color(ColorScheme cs) => switch (variant) {
        BadgeVariant.info => cs.primary,
        BadgeVariant.success => cs.tertiary,
        BadgeVariant.warning => cs.error,
        BadgeVariant.error => cs.error,
        BadgeVariant.neutral => cs.outline,
      };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = _color(cs);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: color),
      ),
    );
  }
}
