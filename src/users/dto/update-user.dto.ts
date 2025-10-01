import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from "class-validator";
import { Types } from "mongoose";

export class UpdateUserDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsEnum(["SuperAdmin", "ProjectAdmin", "FieldOfficer", "Staff", "Caregiver"])
  @IsNotEmpty()
  role: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsOptional()
  @IsArray()
  crops?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  companies?: Types.ObjectId[];

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  labMaster?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  entities?: Types.ObjectId[];

  @IsOptional()
  area?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  species?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  projects?: Types.ObjectId[];
}