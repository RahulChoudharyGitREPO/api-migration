import { Module } from "@nestjs/common";
import { EntitiesController } from "./entities.controller";
import { EntitiesService } from "./entities.service";
import { DynamicDbModule } from "../database/dynamic-db.module";

@Module({
  imports: [DynamicDbModule],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
