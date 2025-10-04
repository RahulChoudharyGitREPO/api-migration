import { Module } from '@nestjs/common';
import { PhcController } from './phc.controller';
import { PhcService } from './phc.service';

@Module({
  controllers: [PhcController],
  providers: [PhcService]
})
export class PhcModule {}
