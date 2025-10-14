import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AssistantV2Dto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async assistantV2(dto: AssistantV2Dto): Promise<any> {
    const { userPrompt } = dto;

    if (!userPrompt) {
      throw new BadRequestException('userPrompt is required');
    }

    // Generate query using OpenAI
    const prompt = `
    Given the following key:value pairs:
    "How many schools are there in the dataset?":"9",
		"What is the total number of students across all schools?":"500",
		"What is the average number of students per school?":"55.56",
		"What is the total number of teachers across all schools?":"25",
		"What is the overall student–teacher ratio?":"19.28",
		"How many students are there in Rajpur ?":"Govt Primary School – Rajpur (55)",
		"How many schools have mid-day meal facilities?":"5",
		"How many schools have toilets and drinking water facilities?":"5",
		"How many schools have libraries or smart classrooms?":"Data not collected.",
		"What is the average attendance percentage across all schools?":"85.57",


		"How many girls are there in the dataset?":"750",
		"What is the average age of the girls in the program?":"14.33",
		"What is the average number of months girls have been in the program?":"8.66",
		"What is the average haemoglobin improvement (g/dl) among girls who completed all expected van visits?":"2.7",
		"What percentage of girls improved from Severe or Moderate anaemia to Normal?":"73.47 %",
		"What is the average IFA consumption rate among girls with High adherence levels?":"72.81 %",
		"What is the correlation between BMI and haemoglobin levels?":"0.35",
		"How many girls currently enrolled in school have a Normal anaemia status?":"637",
		"What is the average menstrual hygiene score among school-enrolled girls?":"86.79",
		"Which block reports the highest average nutrition knowledge score?":"Patraatu (62.38)",



only return value based on ${userPrompt} and parse values as numbers where applicable
    `;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are good with answering questions form prompt.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const generatedPrompt = completion.choices[0].message.content?.trim() || '';

    return { generatedPrompt, userPrompt };
  }
}
