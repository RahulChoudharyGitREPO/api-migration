import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AssistantV2Dto } from './dto/ai.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/ai')
@UseGuards(DynamicDbGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  healthCheck() {
    return 'AI api is listening successfully :)';
  }

  @Post('assistant-v2')
  async assistantV2(@Body() dto: AssistantV2Dto) {
    return this.aiService.assistantV2(dto);
  }
}
