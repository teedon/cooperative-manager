import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { StaffPermission } from '../enums/staff-permissions.enum';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  role!: string; // 'admin' | 'supervisor' | 'field_agent' | 'accountant'

  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];

  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission?: number;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission?: number;
}

export class AssignStaffToGroupDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  cooperativeIds!: string[];

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
