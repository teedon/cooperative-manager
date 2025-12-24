const light = {
  primary: {
    main: '#4f46e5',
    contrast: '#ffffff',
    light: '#eef2ff',
    dark: '#3730a3',
  },
  secondary: {
    main: '#06b6d4',
    contrast: '#ffffff',
    light: '#ecfeff',
    dark: '#0e7490',
  },
  neutral: {
    100: '#f8fafc',
    200: '#eef2f7',
    300: '#e2e8f0',
    500: '#64748b',
    700: '#334155',
    900: '#0f172a',
  },
  success: { main: '#16a34a', light: '#ecfdf5', contrast: '#ffffff' },
  warning: { main: '#f59e0b', light: '#fff7ed', contrast: '#000000' },
  error: { main: '#ef4444', light: '#fff1f2', contrast: '#ffffff' },
  info: { main: '#0ea5e9', light: '#ecfeff', contrast: '#ffffff' },
  background: { default: '#ffffff', surface: '#f8fafc' },
  text: { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
};

const dark = {
  primary: {
    main: '#6366f1',
    contrast: '#0f172a',
    light: '#eef2ff',
    dark: '#3730a3',
  },
  secondary: { main: '#06b6d4', contrast: '#0f172a', light: '#0f172a', dark: '#0891b2' },
  neutral: {
    100: '#0b1220',
    200: '#0f172a',
    300: '#1f2937',
    500: '#94a3b8',
    700: '#cbd5e1',
    900: '#f8fafc',
  },
  success: { main: '#16a34a', light: '#052e17', contrast: '#ffffff' },
  warning: { main: '#f59e0b', light: '#3a2b00', contrast: '#000000' },
  error: { main: '#ef4444', light: '#3b0b0b', contrast: '#ffffff' },
  info: { main: '#0ea5e9', light: '#062a34', contrast: '#ffffff' },
  background: { default: '#071022', surface: '#0b1220' },
  text: { primary: '#f8fafc', secondary: '#cbd5e1', disabled: '#6b7280' },
};

/**
 * Centralized color scheme for the Cooperative Manager app
 * Primary: Blue - Trust, reliability, community
 * Secondary: Soft neutrals - Clean, professional look
 * Accent: Teal - Fresh, modern highlight color
 */

export const colors = {
  // Primary colors - Blue shades
  primary: {
    main: '#1E88E5', // Main blue
    light: '#42A5F5',
    dark: '#1565C0',
    contrast: '#FFFFFF',
  },

  // Secondary colors - Soft neutrals
  secondary: {
    main: '#F5F5F5', // Light gray background
    light: '#FAFAFA',
    dark: '#E0E0E0',
    text: '#9E9E9E',
  },

  // Accent colors - Teal
  accent: {
    main: '#26A69A', // Teal
    light: '#4DB6AC',
    dark: '#00897B',
    contrast: '#FFFFFF',
  },

  // Background colors
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#0F172A', // Dark slate
    secondary: '#64748B', // Slate gray
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Status colors
  success: {
    main: '#22C55E',
    light: '#DCFCE7',
    dark: '#16A34A',
    text: '#16A34A',
  },

  warning: {
    main: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
    text: '#D97706',
  },

  error: {
    main: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
    text: '#DC2626',
  },

  info: {
    main: '#0EA5E9',
    light: '#E0F2FE',
    dark: '#0284C7',
    text: '#0284C7',
  },

  // Border colors
  border: {
    light: '#E2E8F0',
    main: '#CBD5E1',
    dark: '#94A3B8',
  },

  // Common colors
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export { light, dark };
export default colors;
