import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HierarchyDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  @IsOptional()
  checked?: boolean;

  @IsString()
  inputValue: string;

  @IsString()
  color: string;

  @IsString()
  @IsOptional()
  placeholder?: string;
}

export class CreateFrameworkDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HierarchyDto)
  hierarchy: HierarchyDto[];

  @IsArray()
  @IsOptional()
  schema?: any[];

  @IsOptional()
  schemaValues?: any;
}

export class UpdateFrameworkDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HierarchyDto)
  hierarchy: HierarchyDto[];

  @IsArray()
  @IsOptional()
  schema?: any[];

  @IsOptional()
  schemaValues?: any;
}

export class ListFrameworkDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  sortby?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
