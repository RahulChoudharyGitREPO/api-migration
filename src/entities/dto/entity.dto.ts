import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

export class FeatureDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateEntityDto {
  @IsNumber()
  entityCode: number;

  @IsString()
  @Matches(/^\/[a-z0-9-]{3,}$/, {
    message:
      "Path name is not a valid basePath! It must start with a forward slash (/) and be at least 4 characters long, containing only lowercase letters, numbers, and hyphens (-).",
  })
  basePath: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  serviceUrl?: string;

  @IsOptional()
  @IsString()
  info?: string;

  @IsString()
  email: string;

  @IsNumber()
  phone: number;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  gst?: string;

  @IsString()
  adminEmail: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEntityDto extends CreateEntityDto {
  @IsString()
  id: string;
}

export class ConfigEntityDto {
  @IsString()
  id: string;

  @IsNumber()
  entityCode: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features: FeatureDto[];
}

export class EntityListDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  sortby?: string;

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}

export class VerifyEntityDto {
  @IsNumber()
  entityCode: number;
}
