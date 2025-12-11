import { TextStyle } from 'react-native';
import colors from './colors';

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const typography = {
  // Headings
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  } as TextStyle,

  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  } as TextStyle,

  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  } as TextStyle,

  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    lineHeight: fontSizes.xl * lineHeights.tight,
  } as TextStyle,

  // Body text
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.text.primary,
    lineHeight: fontSizes.md * lineHeights.normal,
  } as TextStyle,

  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    color: colors.text.primary,
    lineHeight: fontSizes.lg * lineHeights.normal,
  } as TextStyle,

  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: colors.text.secondary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } as TextStyle,

  // Labels and captions
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    lineHeight: fontSizes.md * lineHeights.normal,
  } as TextStyle,

  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: colors.text.secondary,
    lineHeight: fontSizes.xs * lineHeights.normal,
  } as TextStyle,

  // Button text
  button: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
  } as TextStyle,

  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.sm * lineHeights.tight,
  } as TextStyle,
};

export default typography;
