import 'package:flutter/material.dart';

import 'app_theme.dart';

/// 统一卡片：白色圆角 + 极浅边框 + subtle 阴影（两档阴影取自 AppTheme.cardShadow）。
/// [accentColor] 不为空时在左侧渲染 3px 强调条（列表状态色场景）。
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
    final radius = BorderRadius.circular(appTheme.cardRadius);
    final body = DecoratedBox(
      decoration: BoxDecoration(
        color: appTheme.cardColor,
        borderRadius: radius,
        border: Border.all(color: appTheme.cardBorderColor),
        boxShadow: appTheme.cardShadow,
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: accentColor != null
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 3, color: accentColor),
                  Expanded(
                    child: Padding(
                      padding: padding ?? const EdgeInsets.all(14),
                      child: child,
                    ),
                  ),
                ],
              )
            : Padding(
                padding: padding ?? const EdgeInsets.all(14),
                child: child,
              ),
      ),
    );

    final card = Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: onTap != null
          ? Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                borderRadius: radius,
                child: body,
              ),
            )
          : body,
    );
    return card;
  }
}
