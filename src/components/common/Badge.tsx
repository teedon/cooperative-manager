import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'accent';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  testID?: string;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'small',
  style,
  testID,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: styles.successBg, text: styles.successText };
      case 'warning':
        return { bg: styles.warningBg, text: styles.warningText };
      case 'error':
        return { bg: styles.errorBg, text: styles.errorText };
      case 'info':
        return { bg: styles.infoBg, text: styles.infoText };
      case 'primary':
        return { bg: styles.primaryBg, text: styles.primaryTextStyle };
      case 'accent':
        return { bg: styles.accentBg, text: styles.accentText };
      default:
        return { bg: styles.defaultBg, text: styles.defaultText };
    }
  };

  const variantStyles = getVariantStyle();
  const sizeStyle = size === 'medium' ? styles.medium : styles.small;
  const textSizeStyle = size === 'medium' ? styles.mediumText : styles.smallText;

  return (
    <View style={[styles.badge, variantStyles.bg, sizeStyle, style]} testID={testID}>
      <Text style={[styles.text, variantStyles.text, textSizeStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
  defaultBg: {
    backgroundColor: colors.secondary.main,
  },
  defaultText: {
    color: colors.text.secondary,
  },
  successBg: {
    backgroundColor: colors.success.light,
  },
  successText: {
    color: colors.success.text,
  },
  warningBg: {
    backgroundColor: colors.warning.light,
  },
  warningText: {
    color: colors.warning.text,
  },
  errorBg: {
    backgroundColor: colors.error.light,
  },
  errorText: {
    color: colors.error.text,
  },
  infoBg: {
    backgroundColor: colors.info.light,
  },
  infoText: {
    color: colors.info.text,
  },
  primaryBg: {
    backgroundColor: colors.primary.light,
  },
  primaryTextStyle: {
    color: colors.primary.dark,
  },
  accentBg: {
    backgroundColor: colors.accent.light,
  },
  accentText: {
    color: colors.accent.dark,
  },
});

export default Badge;
