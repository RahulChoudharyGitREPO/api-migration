import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectListDto {
  @IsOptional()
  page?: any; // Accept both string and number

  @IsOptional()
  limit?: any; // Accept both string and number

  @IsOptional()
  all?: any; // Accept both boolean and string
}