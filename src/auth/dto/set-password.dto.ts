import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
