import { Module } from "@nestjs/common";
import { UserAccessController } from "./user-access.controller";
import { UsersModule } from "../users/users.module";
import { DynamicDbModule } from "../database/dynamic-db.module";

@Module({
  imports: [UsersModule, DynamicDbModule],
  controllers: [UserAccessController],
})
export class UserAccessModule {}
