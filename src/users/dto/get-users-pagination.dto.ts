import { IsOptional, IsNumber, IsObject, IsString, IsBoolean } from "class-validator";

export class GetUsersPaginationDto {
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any> = {};

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  showRemovedUser?: boolean = false;

  @IsString()
  @IsOptional()
  sortField?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}