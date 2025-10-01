import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";
import { Types } from "mongoose";

export class UpdateUserDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @Transform(({ value }) => value === "" ? undefined : value)
  @IsString()
  @IsOptional()
  name?: string;

  @Transform(({ value }) => value === "" ? undefined : value)
  @IsEmail()
  @IsOptional()
  email?: string;

  @Transform(({ value }) => value === "" ? undefined : value)
  @IsString()
  @IsOptional()
  mobile?: string;

  @Transform(({ value }) => value === "" ? undefined : value)
  @IsEnum(["SuperAdmin", "ProjectAdmin", "FieldOfficer", "Staff", "Caregiver"])
  @IsOptional()
  role?: string;

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
