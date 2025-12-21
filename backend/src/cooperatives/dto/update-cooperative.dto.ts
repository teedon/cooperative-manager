import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { GRADIENT_PRESETS, GradientPreset } from './create-cooperative.dto';

export class UpdateCooperativeDto {
  @IsOptional()
  @IsString()
  name?: string;

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
