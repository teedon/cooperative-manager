import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
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
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    backgroundColor: '#f1f5f9',
  },
  defaultText: {
    color: '#64748b',
  },
  successBg: {
    backgroundColor: '#dcfce7',
  },
  successText: {
    color: '#16a34a',
  },
  warningBg: {
    backgroundColor: '#fef3c7',
  },
  warningText: {
    color: '#d97706',
  },
  errorBg: {
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
  },
  infoBg: {
    backgroundColor: '#e0f2fe',
  },
  infoText: {
    color: '#0284c7',
  },
});

export default Badge;
