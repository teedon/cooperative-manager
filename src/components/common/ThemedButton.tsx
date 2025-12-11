import React from 'react';
import styled, { useTheme as useStyledTheme } from 'styled-components/native';
import { TouchableOpacityProps } from 'react-native';
import defaultTheme from '../../theme';
import logger from '../../utils/logger';

const ButtonContainer = styled.TouchableOpacity`
  background-color: ${(p: any) => (p.theme?.primary?.main ?? defaultTheme.primary.main)};
  padding-vertical: 12px;
  padding-horizontal: 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const ButtonText = styled.Text`
  color: ${(p: any) => (p.theme?.primary?.contrast ?? defaultTheme.primary.contrast)};
  font-size: ${(p: any) => (p.theme?.typography?.button?.fontSize ?? defaultTheme.typography.button.fontSize)}px;
  font-weight: 600;
`;

export default function ThemedButton({
  children,
  ...props
}: TouchableOpacityProps & { children: React.ReactNode }) {
  const theme = useStyledTheme() as any;
  if (!theme) {
    logger.warn('ThemedButton', 'theme is undefined — using defaults');
  }

  return (
    <ButtonContainer accessibilityRole="button" activeOpacity={0.8} {...props}>
      <ButtonText>{children}</ButtonText>
    </ButtonContainer>
  );
}
