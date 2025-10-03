import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Types } from "mongoose";

export class RegisterUserDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(["SuperAdmin", "ProjectAdmin", "FieldOfficer"])
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
  species?: Types.ObjectId[];

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
  @IsArray()
  projects?: Types.ObjectId[];

  @IsOptional()
  @IsString()
  hostURL?: string;
}
