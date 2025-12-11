import React from 'react';
import { ActivityIndicator, TextStyle } from 'react-native';
import ThemedButton from './ThemedButton';
import { useTheme } from 'styled-components/native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: TextStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const theme: any = useTheme();

  const loaderColor = theme?.primary?.contrast ?? '#ffffff';

  return (
    <ThemedButton onPress={onPress} disabled={disabled || loading} style={style} testID={testID}>
      {loading ? <ActivityIndicator color={loaderColor} /> : title}
    </ThemedButton>
  );
};

export default Button;
