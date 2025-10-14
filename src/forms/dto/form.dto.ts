import { IsString, IsArray, IsOptional, IsBoolean, IsObject, IsEnum, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class ConditionDto {
  @IsString()
  field: string;

  @IsEnum(['=', '>', '<', '>=', '<=', '!='])
  operation: string;

  value: any;
}

export class StepDto {
  @IsEnum(['email', 'whatsapp', 'notification'])
  action: string;

  @IsArray()
  @IsOptional()
  users?: string[];

  @IsString()
  message: string;

  @IsBoolean()
  @IsOptional()
  notifyCreator?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyManager?: boolean;

  @IsObject()
  @IsOptional()
  notifyChannels?: {
    email: boolean;
    whatsapp: boolean;
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  triggers?: ConditionDto[];

  @IsOptional()
  creatorMessage?: any;

  @IsArray()
  @IsOptional()
  selectedFields?: string[];
}

export class WorkflowDto {
  @IsString()
  name: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  triggers?: ConditionDto[];

  @IsEnum(['AND', 'OR'])
  @IsOptional()
  logicOperator?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  steps?: StepDto[];
}

export class LayoutSelectionDto {
  @IsEnum(['vertical', 'horizontal'])
  @IsOptional()
  layout?: string;

  @IsArray()
  @IsOptional()
  fields?: any[];
}

export class SharedWithDto {
  @IsString()
  user: string;

  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;
}

export class CreateFormDto {
  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  title?: string;

  @Transform(({ value }) => value, { toClassOnly: true })
  @IsOptional()
  schema?: any[];

  @Transform(({ value }) => value, { toClassOnly: true })
  @IsOptional()
  columnsPerPage?: any;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  favorite?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LayoutSelectionDto)
  layoutSelections?: LayoutSelectionDto[];

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkflowDto)
  workflows?: WorkflowDto[];

  @IsArray()
  @IsOptional()
  projects?: string[];

  @IsObject()
  @IsOptional()
  _properties?: any;
}

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  title?: string;

  @Transform(({ value }) => value, { toClassOnly: true })
  @IsOptional()
  schema?: any[];

  @Transform(({ value }) => value, { toClassOnly: true })
  @IsOptional()
  columnsPerPage?: any;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  favorite?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LayoutSelectionDto)
  layoutSelections?: LayoutSelectionDto[];

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkflowDto)
  workflows?: WorkflowDto[];

  @IsArray()
  @IsOptional()
  projects?: string[];

  @IsObject()
  @IsOptional()
  _properties?: any;
}

export class GenerateFormDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  title?: string;
}