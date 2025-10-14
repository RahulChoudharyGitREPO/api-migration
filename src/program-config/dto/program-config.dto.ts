import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateProgramConfigDto {
  @IsArray()
  staticFields: string[];

  @IsArray()
  schema: any[];
}

export class UpdateProgramConfigDto {
  @IsString()
  id: string;

  @IsArray()
  schema: any[];
}

export class ListProgramConfigDto {
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
