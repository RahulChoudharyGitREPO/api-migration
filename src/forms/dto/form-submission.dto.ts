import { IsString, IsObject, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class SubmitFormDto {
  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsObject()
  data: any;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;
}

export class UpdateFormEntryDto {
  @IsObject()
  data: any;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsNumber()
  @IsOptional()
  stepNo?: number;

  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @IsString()
  @IsOptional()
  projectName?: string;
}

export class GetEntriesDto {
  @IsString()
  slug: string; // Required field from request body

  @IsOptional()
  page?: any; // Accept both string and number

  @IsOptional()
  limit?: any; // Accept both string and number

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  filters?: any;

  @IsString()
  @IsOptional()
  sortField?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsString()
  @IsOptional()
  projectName?: string;
}

export class UpdateWorkflowStepDto {
  @IsString()
  approvalStatus: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  triggerStatus?: boolean;
}

export class GetEntriesOldDto {
  @IsOptional()
  page?: any; // Accept both string and number

  @IsOptional()
  limit?: any; // Accept both string and number

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  filters?: any;

  @IsString()
  @IsOptional()
  projectName?: string;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  steps: any[];

  @IsObject()
  @IsOptional()
  triggers?: any;
}

export class UpdateLayoutDto {
  @IsObject()
  layout: any;
}