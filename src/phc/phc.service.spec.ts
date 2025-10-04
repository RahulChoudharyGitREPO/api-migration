import { Test, TestingModule } from '@nestjs/testing';
import { PhcService } from './phc.service';

describe('PhcService', () => {
  let service: PhcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhcService],
    }).compile();

    service = module.get<PhcService>(PhcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
