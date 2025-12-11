import { light, dark } from './colors';
import typography from './typography';
import spacing from './spacing';

const lightTheme = { ...light, typography, spacing };
const darkTheme = { ...dark, typography, spacing };

export type Theme = typeof lightTheme;

export const tokens = { colors: light, typography, spacing };

export { lightTheme, darkTheme };
export default lightTheme;
// Compatibility exports for existing code
export { default as colors } from './colors';
export { spacing, borderRadius, shadows } from './spacing';
