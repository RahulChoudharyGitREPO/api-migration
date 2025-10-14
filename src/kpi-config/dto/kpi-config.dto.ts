import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateKpiConfigDto {
  @IsArray()
  staticFields: string[];

  @IsArray()
  schema: any[];
}

export class UpdateKpiConfigDto {
  @IsString()
  id: string;

  @IsArray()
  schema: any[];
}

export class ListKpiConfigDto {
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
