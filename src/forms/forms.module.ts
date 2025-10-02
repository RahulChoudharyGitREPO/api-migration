import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormProcessorService } from './form-processor.service';
import { DynamicDbModule } from '../database/dynamic-db.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DynamicDbModule,
    AuthModule,
  ],
  controllers: [FormsController],
  providers: [FormsService, FormProcessorService],
  exports: [FormsService, FormProcessorService],
})
export class FormsModule {
  constructor(
    private readonly formsService: FormsService,
    private readonly formProcessorService: FormProcessorService,
  ) {
    // Inject FormProcessorService into FormsService for Excel upload functionality
    this.formsService.setFormProcessorService(this.formProcessorService);
  }
}