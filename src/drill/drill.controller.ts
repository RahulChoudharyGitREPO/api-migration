import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { DrillService } from './drill.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(':companyName/api/drill')
@UseGuards(JwtAuthGuard)
export class DrillController {
  constructor(private readonly drillService: DrillService) {}

  @Post('create')
  async create(@Body() body: { dbName: string }) {
    try {
      return await this.drillService.create(body.dbName);
    } catch (error) {
      throw new HttpException({ error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
