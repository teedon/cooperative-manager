import { GradientPreset } from '../models';

export interface GradientColors {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
  name: string;
  description: string;
}

/**
 * Professional gradient presets for cooperative backgrounds
 * Each preset includes colors, direction, and metadata
 */
export const GRADIENT_PRESETS_CONFIG: Record<GradientPreset, GradientColors> = {
  ocean: {
    colors: ['#0077B6', '#00B4D8', '#90E0EF'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Ocean',
    description: 'Deep blue to aqua gradient',
  },
  sunset: {
    colors: ['#F97316', '#FB923C', '#FCD34D'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Sunset',
    description: 'Warm orange to golden yellow',
  },
  forest: {
    colors: ['#166534', '#22C55E', '#86EFAC'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Forest',
    description: 'Deep green to fresh mint',
  },
  lavender: {
    colors: ['#7C3AED', '#A78BFA', '#DDD6FE'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Lavender',
    description: 'Rich purple to soft lavender',
  },
  coral: {
    colors: ['#DC2626', '#FB7185', '#FECDD3'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Coral',
    description: 'Vibrant red to soft pink',
  },
  midnight: {
    colors: ['#1E1B4B', '#3730A3', '#6366F1'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Midnight',
    description: 'Deep indigo to bright violet',
  },
  emerald: {
    colors: ['#047857', '#10B981', '#6EE7B7'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Emerald',
    description: 'Rich emerald to teal',
  },
  rose: {
    colors: ['#BE185D', '#EC4899', '#FBCFE8'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Rose',
    description: 'Deep pink to soft rose',
  },
  slate: {
    colors: ['#334155', '#64748B', '#CBD5E1'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Slate',
    description: 'Professional dark to light gray',
  },
  amber: {
    colors: ['#B45309', '#F59E0B', '#FDE68A'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    name: 'Amber',
    description: 'Rich amber to golden yellow',
  },
};

/**
 * Get gradient configuration for a given preset
 * @param preset The gradient preset name
 * @returns The gradient configuration
 */
export function getGradientConfig(preset: GradientPreset = 'ocean'): GradientColors {
  return GRADIENT_PRESETS_CONFIG[preset] || GRADIENT_PRESETS_CONFIG.ocean;
}

/**
 * Get all available gradient presets with their configurations
 * @returns Array of all gradient presets with their configs
 */
export function getAllGradientPresets(): Array<{ preset: GradientPreset; config: GradientColors }> {
  return Object.entries(GRADIENT_PRESETS_CONFIG).map(([preset, config]) => ({
    preset: preset as GradientPreset,
    config,
  }));
}

/**
 * Get the primary (first) color of a gradient preset
 * Useful for badges, icons, or accent colors
 * @param preset The gradient preset name
 * @returns The primary color hex code
 */
export function getGradientPrimaryColor(preset: GradientPreset = 'ocean'): string {
  return getGradientConfig(preset).colors[0];
}

/**
 * Get the secondary (last) color of a gradient preset
 * Useful for highlights or contrasts
 * @param preset The gradient preset name
 * @returns The secondary color hex code
 */
export function getGradientSecondaryColor(preset: GradientPreset = 'ocean'): string {
  const colors = getGradientConfig(preset).colors;
  return colors[colors.length - 1];
}

/**
 * Create CSS-like linear gradient string
 * Useful for web views or debugging
 * @param preset The gradient preset name
 * @returns CSS linear-gradient string
 */
export function getGradientCSSString(preset: GradientPreset = 'ocean'): string {
  const config = getGradientConfig(preset);
  return `linear-gradient(135deg, ${config.colors.join(', ')})`;
}
