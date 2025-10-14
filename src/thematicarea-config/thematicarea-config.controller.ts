import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ThematicareaConfigService } from './thematicarea-config.service';
import { CreateThematicareaConfigDto, UpdateThematicareaConfigDto, ListThematicareaConfigDto } from './dto/thematicarea-config.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/thematicarea-config')
@UseGuards(DynamicDbGuard)
export class ThematicareaConfigController {
  constructor(private readonly thematicareaConfigService: ThematicareaConfigService) {}

  @Get()
  healthCheck() {
    return 'ThematicareaConfig api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreateThematicareaConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.thematicareaConfigService.create(dbConnection, createDto, userId);
  }

  @Post('update')
  async update(@Body() updateDto: UpdateThematicareaConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.thematicareaConfigService.update(dbConnection, updateDto, userId);
  }

  @Post('list')
  async list(@Body() listDto: ListThematicareaConfigDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.thematicareaConfigService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.thematicareaConfigService.getDetails(dbConnection, id);
  }
}
