import { Module } from '@nestjs/common';
import { PartnerConfigController } from './partner-config.controller';
import { PartnerConfigService } from './partner-config.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [PartnerConfigController],
  providers: [PartnerConfigService],
  exports: [PartnerConfigService],
})
export class PartnerConfigModule {}
