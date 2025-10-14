import { Module } from '@nestjs/common';
import { FrameworkController } from './framework.controller';
import { FrameworkService } from './framework.service';
import { DynamicDbModule } from '../database/dynamic-db.module';

@Module({
  imports: [DynamicDbModule],
  controllers: [FrameworkController],
  providers: [FrameworkService],
  exports: [FrameworkService],
})
export class FrameworkModule {}
