import 'package:flutter/material.dart';

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
    final card = Card(
      elevation: 1,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: accentColor != null
            ? BorderSide(color: accentColor!, width: 0)
            : BorderSide.none,
      ),
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Padding(
        padding: padding ?? const EdgeInsets.all(14),
        child: child,
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: card,
      );
    }
    return card;
  }
}
