import { Module } from '@nestjs/common';
import { KpiConfigController } from './kpi-config.controller';
import { KpiConfigService } from './kpi-config.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [KpiConfigController],
  providers: [KpiConfigService],
  exports: [KpiConfigService],
})
export class KpiConfigModule {}
