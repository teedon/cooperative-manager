import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum PostType {
  ANNOUNCEMENT = 'announcement',
  MEMBER_POST = 'member_post',
  SYSTEM = 'system',
}

export class CreatePostDto {
  @IsString()
  cooperativeId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
