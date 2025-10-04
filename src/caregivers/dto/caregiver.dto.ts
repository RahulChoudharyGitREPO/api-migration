import { IsString, IsNumber, IsDate, IsOptional, IsEnum, IsBoolean, IsArray, IsObject, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class EducationDto {
  @IsOptional()
  @IsString()
  highestEducation?: string;

  @IsOptional()
  @IsString()
  subjectExpertise?: string;

  @IsOptional()
  @IsString()
  institutionName?: string;

  @IsOptional()
  @IsArray()
  languagesKnown?: string[];
}

export class WorkExperienceDto {
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  organisationName?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}

export class DocumentsDto {
  @IsOptional()
  @IsString()
  resumeCvUrl?: string;

  @IsOptional()
  @IsArray()
  certificateUrls?: string[];

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class CreateCaregiverDto {
  @IsString()
  fullName: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsEmail()
  email: string;

  @IsEnum(['Male', 'Female', 'Other'])
  gender: string;

  @IsNumber()
  phoneNumber: number;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  educationDetails?: EducationDto[];

  @IsOptional()
  @IsArray()
  workExperience?: WorkExperienceDto[];

  @IsOptional()
  @IsObject()
  documents?: DocumentsDto;
}

export class UpdateCaregiverDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: string;

  @IsOptional()
  @IsNumber()
  phoneNumber?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  educationDetails?: EducationDto[];

  @IsOptional()
  @IsArray()
  workExperience?: WorkExperienceDto[];

  @IsOptional()
  @IsObject()
  documents?: DocumentsDto;
}

export class CaregiverListDto {
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
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  phoneNumber?: number;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @IsBoolean()
  showDetails?: boolean;
}

export class CaregiverListV2Dto {
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
  @IsNumber()
  sortOrder?: number;
}
