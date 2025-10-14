import { Module } from '@nestjs/common';
import { ThematicAreaController } from './thematic-area.controller';
import { ThematicAreaService } from './thematic-area.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [ThematicAreaController],
  providers: [ThematicAreaService],
  exports: [ThematicAreaService],
})
export class ThematicAreaModule {}
