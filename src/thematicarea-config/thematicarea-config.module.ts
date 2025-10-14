import { Module } from '@nestjs/common';
import { ThematicareaConfigController } from './thematicarea-config.controller';
import { ThematicareaConfigService } from './thematicarea-config.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [ThematicareaConfigController],
  providers: [ThematicareaConfigService],
  exports: [ThematicareaConfigService],
})
export class ThematicareaConfigModule {}
