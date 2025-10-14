import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateThematicAreaDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  schema: any[];

  @IsOptional()
  schemaValues?: any;
}

export class ListThematicAreaDto {
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
