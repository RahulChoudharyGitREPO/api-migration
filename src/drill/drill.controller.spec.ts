import { Test, TestingModule } from '@nestjs/testing';
import { DrillController } from './drill.controller';

describe('DrillController', () => {
  let controller: DrillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrillController],
    }).compile();

    controller = module.get<DrillController>(DrillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
