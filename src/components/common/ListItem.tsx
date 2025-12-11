import React from 'react';
import styled, { useTheme as useStyledTheme } from 'styled-components/native';
import Avatar from './Avatar';
import defaultTheme from '../../theme';
import logger from '../../utils/logger';

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${(p: any) => (p.theme?.spacing?.sm ?? defaultTheme.spacing.sm)}px;
`;

const Content = styled.View`
  flex: 1;
  margin-left: ${(p: any) => (p.theme?.spacing?.md ?? defaultTheme.spacing.md)}px;
`;

const Title = styled.Text`
  color: ${(p: any) => (p.theme?.text?.primary ?? defaultTheme.text.primary)};
  font-weight: 600;
`;

const Subtitle = styled.Text`
  color: ${(p: any) => (p.theme?.text?.secondary ?? defaultTheme.text.secondary)};
  margin-top: 2px;
  font-size: 13px;
`;

export default function ListItem({
  title,
  subtitle,
  avatarName,
}: {
  title: string;
  subtitle?: string;
  avatarName?: string;
}) {
  const theme = useStyledTheme() as any;
  if (!theme) logger.warn('ListItem', 'theme undefined — using defaults');

  return (
    <Row>
      <Avatar name={avatarName} />
      <Content>
        <Title>{title}</Title>
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </Content>
    </Row>
  );
}
