import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';
import { StaffPermission } from '../enums/staff-permissions.enum';

export class InviteStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  role!: string; // 'admin' | 'supervisor' | 'field_agent' | 'accountant'

  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];

  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cooperativeIds?: string[];
}