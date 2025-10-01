import { IsMongoId, IsNotEmpty, IsBoolean, IsOptional } from "class-validator";

export class DeleteUserDto {
  @IsMongoId()
  @IsNotEmpty()
  Id: string;

  @IsBoolean()
  @IsOptional()
  isRemove?: boolean = true;
}
