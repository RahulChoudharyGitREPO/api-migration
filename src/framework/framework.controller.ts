import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FrameworkService } from './framework.service';
import { CreateFrameworkDto, UpdateFrameworkDto, ListFrameworkDto } from './dto/framework.dto';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/framework')
@UseGuards(DynamicDbGuard)
export class FrameworkController {
  constructor(private readonly frameworkService: FrameworkService) {}

  @Get()
  healthCheck() {
    return 'Framework api is listening successfully :)';
  }

  @Post('create')
  async create(@Body() createDto: CreateFrameworkDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.frameworkService.create(dbConnection, createDto);
  }

  @Post('update')
  async update(@Body() updateDto: UpdateFrameworkDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.frameworkService.update(dbConnection, updateDto);
  }

  @Post('list')
  async list(@Body() listDto: ListFrameworkDto, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.frameworkService.list(dbConnection, listDto);
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const dbConnection = req.dbConnection;
    return this.frameworkService.getDetails(dbConnection, id);
  }
}
