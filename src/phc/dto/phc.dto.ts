import { IsString, IsOptional, IsBoolean, IsObject, IsNumber, IsArray } from 'class-validator';

export class LocationDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  taluk?: string;

  @IsOptional()
  @IsString()
  panchayat?: string;

  @IsOptional()
  @IsString()
  village?: string;
}

export class CreatePhcDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  location?: LocationDto;
}

export class UpdatePhcDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PhcListDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  taluk?: string;

  @IsOptional()
  @IsString()
  panchayat?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  sortDirection?: string;
}

export class PhcListV2Dto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsBoolean()
  showDetails?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  sortOrder?: number;
}
