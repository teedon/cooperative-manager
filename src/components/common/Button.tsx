import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.button];

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.sizeSmall);
        break;
      case 'large':
        baseStyles.push(styles.sizeLarge);
        break;
      default:
        baseStyles.push(styles.sizeMedium);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(styles.secondary);
        break;
      case 'danger':
        baseStyles.push(styles.danger);
        break;
      case 'outline':
        baseStyles.push(styles.outline);
        break;
      case 'accent':
        baseStyles.push(styles.accent);
        break;
      default:
        baseStyles.push(styles.primary);
    }

    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }

    return baseStyles;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.text];

    // Size text styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.textSmall);
        break;
      case 'large':
        baseStyles.push(styles.textLarge);
        break;
      default:
        baseStyles.push(styles.textMedium);
    }

    // Variant text styles
    if (variant === 'outline') {
      baseStyles.push(styles.outlineText);
    } else if (variant === 'secondary') {
      baseStyles.push(styles.secondaryText);
    } else {
      baseStyles.push(styles.primaryText);
    }

    return baseStyles;
  };

  const getLoaderColor = (): string => {
    if (variant === 'outline') return colors.primary.main;
    if (variant === 'secondary') return colors.text.primary;
    return colors.primary.contrast;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sizeMedium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sizeLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  primary: {
    backgroundColor: colors.primary.main,
  },
  secondary: {
    backgroundColor: colors.secondary.main,
  },
  danger: {
    backgroundColor: colors.error.main,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  accent: {
    backgroundColor: colors.accent.main,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  primaryText: {
    color: colors.primary.contrast,
  },
  secondaryText: {
    color: colors.text.primary,
  },
  outlineText: {
    color: colors.primary.main,
  },
});

export default Button;
