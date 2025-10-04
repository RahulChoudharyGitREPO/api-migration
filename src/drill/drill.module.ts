import { Module } from '@nestjs/common';
import { DrillController } from './drill.controller';
import { DrillService } from './drill.service';

@Module({
  controllers: [DrillController],
  providers: [DrillService]
})
export class DrillModule {}
