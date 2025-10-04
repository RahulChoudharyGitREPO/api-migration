import { IsString, IsOptional, IsEmail, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DonorFeaturesDto {
  @IsArray()
  @IsString({ each: true })
  dashboard: string[];

  @IsArray()
  @IsString({ each: true })
  reports: string[];
}

export class CreateDonorDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  gstNo?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DonorFeaturesDto)
  features?: DonorFeaturesDto;
}

export class UpdateDonorDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  gstNo?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateDonorFeaturesDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => DonorFeaturesDto)
  @IsNotEmpty()
  features: DonorFeaturesDto;
}

export class BulkUpdateDonorFeaturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDonorFeaturesDto)
  donors: UpdateDonorFeaturesDto[];
}

export class DonorListDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  sortby?: string;
}
