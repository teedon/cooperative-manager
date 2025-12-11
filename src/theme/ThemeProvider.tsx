import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { lightTheme, darkTheme } from './index';
import logger from '../utils/logger';

type ThemeMode = 'light' | 'dark';

const ThemeContext = createContext({ mode: 'light' as ThemeMode, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  useEffect(() => {
    logger.info('[Theme]', 'mounted', { mode });
    return () => {
      logger.info('[Theme]', 'unmounted');
    };
  }, []);

  useEffect(() => {
    logger.info('[Theme]', 'mode changed', { mode });
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
