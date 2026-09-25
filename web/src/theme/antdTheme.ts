import type { ThemeConfig } from 'antd';

import {
  colors,
  controlHeight,
  fontFamily,
  fontSizes,
  layout,
  radius,
  shadows,
} from './tokens';

/**
 * Token → AntD v5 theme 映射。
 * 消费方只读引用 tokens.ts，保证 Token 单一信息源；
 * 自绘样式请使用 global.css 中同名导出的 CSS 变量。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorInfo: colors.info,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorLink: colors.primary,
    colorLinkHover: colors.primaryHover,
    colorLinkActive: colors.primaryActive,
    colorText: colors.text,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textTertiary,
    colorBorder: colors.border,
    colorBorderSecondary: colors.borderSecondary,
    colorSplit: colors.split,
    colorBgLayout: colors.bgLayout,
    colorBgContainer: colors.bgContainer,
    colorBgSpotlight: colors.bgSpotlight,
    borderRadius: radius.md,
    borderRadiusLG: radius.lg,
    borderRadiusSM: radius.sm,
    controlHeight,
    fontSize: fontSizes.sm,
    fontSizeSM: fontSizes.xs,
    fontSizeLG: fontSizes.md,
    fontFamily,
    boxShadow: shadows.card,
    boxShadowSecondary: shadows.cardHover,
  },
  components: {
    Layout: {
      headerHeight: layout.headerHeight,
      headerBg: colors.bgContainer,
      headerPadding: '0 16px',
      siderBg: colors.bgContainer,
      bodyBg: colors.bgLayout,
    },
    Menu: {
      itemHeight: 40,
      itemMarginInline: 8,
      itemBorderRadius: radius.md,
      itemSelectedBg: colors.primaryBg,
      itemSelectedColor: colors.primary,
      iconSize: 16,
      collapsedIconSize: 16,
    },
    Card: {
      paddingLG: 20,
    },
    Table: {
      headerBg: colors.fillTertiary,
      headerSplitColor: 'transparent',
      headerBorderRadius: radius.md,
    },
    Button: {
      fontWeight: 500,
    },
    Tabs: {
      horizontalItemPadding: '12px 4px',
    },
  },
};
