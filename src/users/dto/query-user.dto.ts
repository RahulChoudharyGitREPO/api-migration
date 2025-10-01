import { IsObject } from "class-validator";

export class QueryUserDto {
  @IsObject()
  dbQuery: Record<string, any>;
}