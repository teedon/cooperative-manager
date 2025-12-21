import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export const GRADIENT_PRESETS = [
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'coral',
  'midnight',
  'emerald',
  'rose',
  'slate',
  'amber',
] as const;

export type GradientPreset = (typeof GRADIENT_PRESETS)[number];

export class CreateCooperativeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  useGradient?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(GRADIENT_PRESETS)
  gradientPreset?: GradientPreset;

  @IsOptional()
  @IsString()
  status?: string;
}
