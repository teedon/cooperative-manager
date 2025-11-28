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

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export default colors;
