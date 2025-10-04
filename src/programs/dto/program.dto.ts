import { IsString, IsNumber, IsOptional, IsArray, IsObject, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  budget: number;

  @IsNumber()
  @IsNotEmpty()
  budgetUtilisation: number;

  @IsString()
  @IsNotEmpty()
  thematicAreas: string;

  @IsString()
  @IsNotEmpty()
  partnerName: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsArray()
  @IsNotEmpty()
  schema: any[];

  @IsObject()
  @IsOptional()
  schemaValues?: any;

  @IsOptional()
  kpi?: string;
}

export class ProgramListDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  sortby?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
