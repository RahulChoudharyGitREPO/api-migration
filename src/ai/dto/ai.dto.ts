import { IsString } from 'class-validator';

export class AssistantV2Dto {
  @IsString()
  userPrompt: string;
}
