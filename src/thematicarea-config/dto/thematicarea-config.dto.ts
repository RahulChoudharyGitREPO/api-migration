import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateThematicareaConfigDto {
  @IsArray()
  staticFields: string[];

  @IsArray()
  schema: any[];
}

export class UpdateThematicareaConfigDto {
  @IsString()
  id: string;

  @IsArray()
  schema: any[];
}

export class ListThematicareaConfigDto {
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
