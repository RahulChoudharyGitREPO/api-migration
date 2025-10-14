import { IsBoolean, IsOptional, IsString } from "class-validator";

export class GetAllUsersDto {
  @IsBoolean()
  @IsOptional()
  showRemovedUser?: boolean = false;

  @IsString()
  @IsOptional()
  Id?: string;
}
