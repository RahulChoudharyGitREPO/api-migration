import { Module } from '@nestjs/common';
import { ProgramConfigController } from './program-config.controller';
import { ProgramConfigService } from './program-config.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [ProgramConfigController],
  providers: [ProgramConfigService],
  exports: [ProgramConfigService],
})
export class ProgramConfigModule {}
