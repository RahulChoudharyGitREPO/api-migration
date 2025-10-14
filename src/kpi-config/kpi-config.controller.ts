import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { KpiConfigService } from './kpi-config.service';
import { CreateKpiConfigDto, UpdateKpiConfigDto, ListKpiConfigDto } from './dto/kpi-config.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/kpi-config')
@UseGuards(DynamicDbGuard)
export class KpiConfigController {
  constructor(private readonly kpiConfigService: KpiConfigService) {}

  @Get()
  healthCheck() {
    return 'KpiConfig api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreateKpiConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.kpiConfigService.create(dbConnection, createDto, userId);
  }

  @Post('update')
  async update(@Body() updateDto: UpdateKpiConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.kpiConfigService.update(dbConnection, updateDto, userId);
  }

  @Post('list')
  async list(@Body() listDto: ListKpiConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.kpiConfigService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.kpiConfigService.getDetails(dbConnection, id);
  }
}
