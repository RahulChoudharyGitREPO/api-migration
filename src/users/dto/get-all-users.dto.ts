import { IsBoolean, IsOptional, IsNumber } from "class-validator";

export class GetAllUsersDto {
  @IsBoolean()
  @IsOptional()
  showRemovedUser?: boolean = false;

  @IsNumber()
  @IsOptional()
  Id?: number;
}