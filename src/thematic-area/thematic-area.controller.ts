import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ThematicAreaService } from './thematic-area.service';
import { CreateThematicAreaDto, ListThematicAreaDto } from './dto/thematic-area.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/thematic-area')
@UseGuards(DynamicDbGuard)
export class ThematicAreaController {
  constructor(private readonly thematicAreaService: ThematicAreaService) {}

  @Get()
  healthCheck() {
    return 'Thematic area api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreateThematicAreaDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    const userId = req.user?.user_id || req.user?._id;
    return this.thematicAreaService.create(dbConnection, createDto, userId);
  }

  @Post('list')
  async list(@Body() listDto: ListThematicAreaDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.thematicAreaService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.thematicAreaService.getDetails(dbConnection, id);
  }
}
