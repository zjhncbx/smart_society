/**
 * 设计 Token 唯一基准（对标钉钉/飞书设计语言）
 *
 * 全站视觉（AntD theme、CSS 变量、自绘样式）只允许从这里取值，
 * 禁止页面内散落硬编码色值/圆角/阴影。
 */

/** 品牌与功能色（钉钉蓝 #1677FF 系） */
export const colors = {
  primary: '#1677FF',
  primaryHover: '#4096FF',
  primaryActive: '#0958D9',
  primaryBg: '#E6F4FF',
  success: '#52C41A',
  successBg: '#F6FFED',
  warning: '#FAAD14',
  warningBg: '#FFFBE6',
  error: '#FF4D4F',
  errorBg: '#FFF2F0',
  info: '#1677FF',
  infoBg: '#E6F4FF',
  /** 文本层级 */
  text: 'rgba(0, 0, 0, 0.88)',
  textSecondary: 'rgba(0, 0, 0, 0.65)',
  textTertiary: 'rgba(0, 0, 0, 0.45)',
  /** 边框与背景 */
  border: '#D9D9D9',
  borderSecondary: '#F0F0F0',
  split: '#F0F0F0',
  fillTertiary: '#F5F5F5',
  bgLayout: '#F5F7FA',
  bgContainer: '#FFFFFF',
  bgSpotlight: '#E6F4FF',
} as const;

/** 圆角阶梯 */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

/** 间距阶梯（4 的倍数制） */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** 阴影阶梯（两档：卡片常驻 / 悬浮层） */
export const shadows = {
  card: '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02)',
  cardHover: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
} as const;

/** 字号层级（12/14/16/20/24） */
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

/** 字重层级 */
export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** 控件高度 */
export const controlHeight = 36;

/** 字体族 */
export const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif";

/** 布局尺寸 */
export const layout = {
  headerHeight: 56,
  siderWidth: 216,
  siderCollapsedWidth: 64,
  contentPadding: 24,
} as const;
