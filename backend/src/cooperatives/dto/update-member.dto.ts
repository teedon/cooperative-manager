import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['admin', 'moderator', 'member'])
  role!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['president', 'vice_president', 'secretary', 'financial_secretary', 'treasurer', 'pro', 'auditor', 'welfare_officer', null])
  roleTitle?: string | null;
}

export class UpdateMemberPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
