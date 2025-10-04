import { Test, TestingModule } from '@nestjs/testing';
import { PhcController } from './phc.controller';

describe('PhcController', () => {
  let controller: PhcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhcController],
    }).compile();

    controller = module.get<PhcController>(PhcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
