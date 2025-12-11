import React from 'react';
import styled, { useTheme as useStyledTheme } from 'styled-components/native';
import { ImageSourcePropType } from 'react-native';
import defaultTheme from '../../theme';
import logger from '../../utils/logger';

const Wrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  background-color: ${(p: any) => p.theme?.neutral?.[200] ?? defaultTheme.neutral[200]};
  align-items: center;
  justify-content: center;
`;

const Img = styled.Image`
  width: 48px;
  height: 48px;
`;

const Initial = styled.Text`
  color: ${(p: any) => p.theme?.text?.primary ?? defaultTheme.text.primary};
  font-weight: 700;
`;

export default function Avatar({ source, name }: { source?: ImageSourcePropType; name?: string }) {
  const theme = useStyledTheme() as any;
  if (!theme) logger.warn('Avatar', 'theme undefined — using defaults');

  const initials = name
    ? name
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <Wrapper>
      {source ? <Img source={source} resizeMode="cover" /> : <Initial>{initials}</Initial>}
    </Wrapper>
  );
}
