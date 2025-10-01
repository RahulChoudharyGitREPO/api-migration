import { IsMongoId, IsNotEmpty } from "class-validator";

export class UpdateUserSimpleDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}