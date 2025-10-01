import { IsMongoId, IsNotEmpty } from "class-validator";

export class ResendPasswordDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}