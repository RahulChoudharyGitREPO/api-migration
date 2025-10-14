import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePartnerConfigDto {
  @IsArray()
  staticFields: string[];

  @IsArray()
  schema: any[];
}

export class UpdatePartnerConfigDto {
  @IsString()
  id: string;

  @IsArray()
  schema: any[];
}

export class ListPartnerConfigDto {
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
