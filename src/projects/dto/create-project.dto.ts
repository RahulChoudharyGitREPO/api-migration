import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsEnum, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class DurationDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsEnum(['days', 'weeks', 'months', 'years'])
  unit?: 'days' | 'weeks' | 'months' | 'years';
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsString()
  @IsNotEmpty()
  projectManager: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  projectCategory?: string;

  @IsOptional()
  @IsString()
  tagOne?: string;

  @IsOptional()
  @IsString()
  tagTwo?: string;

  @IsOptional()
  @IsString()
  tagThree?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DurationDto)
  duration?: DurationDto;

  @IsOptional()
  forms?: string[];
}