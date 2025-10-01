import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DynamicDbService } from "./dynamic-db.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DynamicDbService],
  exports: [DynamicDbService],
})
export class DynamicDbModule {}