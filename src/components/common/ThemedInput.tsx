import React from 'react';
import styled, { useTheme as useStyledTheme } from 'styled-components/native';
import { TextInputProps } from 'react-native';
import defaultTheme from '../../theme';
import logger from '../../utils/logger';

const Input = styled.TextInput`
  background-color: ${(p: any) => p.theme?.background?.surface ?? defaultTheme.background.surface};
  color: ${(p: any) => p.theme?.text?.primary ?? defaultTheme.text.primary};
  padding: 12px 14px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${(p: any) => (p.theme?.neutral?.[300] ?? defaultTheme.neutral[300])};
`;

export default function ThemedInput(props: TextInputProps) {
  const theme = useStyledTheme() as any;
  if (!theme) logger.warn('ThemedInput', 'theme is undefined — using defaults');

  return (
    <Input placeholderTextColor={(props as any).placeholderTextColor ?? defaultTheme.text.disabled} {...props} />
  );
}
