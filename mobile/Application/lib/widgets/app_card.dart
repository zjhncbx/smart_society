import 'package:flutter/material.dart';

import 'app_theme.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final Color? accentColor;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const AppCard({
    super.key,
    required this.child,
    this.accentColor,
    this.onTap,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    final card = Card(
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.04),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(appTheme.cardRadius),
        side: accentColor != null
            ? BorderSide(color: accentColor!, width: 1.2)
            : BorderSide(color: appTheme.cardBorderColor),
      ),
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      color: appTheme.cardColor,
      child: Padding(
        padding: padding ?? const EdgeInsets.all(14),
        child: child,
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(appTheme.cardRadius),
        child: card,
      );
    }
    return card;
  }
}
