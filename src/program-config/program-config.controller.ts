import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProgramConfigService } from './program-config.service';
import { CreateProgramConfigDto, UpdateProgramConfigDto, ListProgramConfigDto } from './dto/program-config.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/program-config')
@UseGuards(DynamicDbGuard)
export class ProgramConfigController {
  constructor(private readonly programConfigService: ProgramConfigService) {}

  @Get()
  healthCheck() {
    return 'ProgramConfig api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreateProgramConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.programConfigService.create(dbConnection, createDto, userId);
  }

  @Post('update')
  async update(@Body() updateDto: UpdateProgramConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.programConfigService.update(dbConnection, updateDto, userId);
  }

  @Post('list')
  async list(@Body() listDto: ListProgramConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.programConfigService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.programConfigService.getDetails(dbConnection, id);
  }
}
