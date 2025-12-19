import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['admin', 'moderator', 'member'])
  role!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateMemberPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
