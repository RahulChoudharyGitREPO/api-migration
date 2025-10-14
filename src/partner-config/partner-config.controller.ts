import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PartnerConfigService } from './partner-config.service';
import { CreatePartnerConfigDto, UpdatePartnerConfigDto, ListPartnerConfigDto } from './dto/partner-config.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/partner-config')
@UseGuards(DynamicDbGuard)
export class PartnerConfigController {
  constructor(private readonly partnerConfigService: PartnerConfigService) {}

  @Get()
  healthCheck() {
    return 'PartnerConfig api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreatePartnerConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.partnerConfigService.create(dbConnection, createDto, userId);
  }

  @Post('update')
  async update(@Body() updateDto: UpdatePartnerConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.partnerConfigService.update(dbConnection, updateDto, userId);
  }

  @Post('list')
  async list(@Body() listDto: ListPartnerConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.partnerConfigService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.partnerConfigService.getDetails(dbConnection, id);
  }
}
