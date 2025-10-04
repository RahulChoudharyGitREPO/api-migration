import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ProfessionService } from './profession.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateProfessionDto, UpdateProfessionDto, ProfessionListDto, ProfessionListV2Dto } from './dto/profession.dto';

@Controller(':companyName/api/profession')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class ProfessionController {
  constructor(private readonly professionService: ProfessionService) {}

  @Post('create')
  async create(@DatabaseConnection() dbConnection: Connection, @Body() createDto: CreateProfessionDto) {
    try {
      return await this.professionService.create(dbConnection, createDto);
    } catch (error) {
      throw new HttpException({ message: error.message || 'Error creating profession', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('list')
  async list(@DatabaseConnection() dbConnection: Connection) {
    try {
      return await this.professionService.list(dbConnection);
    } catch (error) {
      throw new HttpException({ message: 'Error fetching professions', error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('details/:id')
  async getDetails(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.professionService.getDetails(dbConnection, id);
    } catch (error) {
      throw new HttpException({ message: error.message || 'Error fetching profession details', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list')
  async listWithPagination(@DatabaseConnection() dbConnection: Connection, @Body() listDto: ProfessionListDto) {
    try {
      return await this.professionService.listWithPagination(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ message: 'Error fetching professions', error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('v2/list')
  async listV2(@DatabaseConnection() dbConnection: Connection, @Body() listDto: ProfessionListV2Dto) {
    try {
      return await this.professionService.listV2(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('update/:id')
  async update(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string, @Body() updateDto: UpdateProfessionDto) {
    try {
      return await this.professionService.update(dbConnection, id, updateDto);
    } catch (error) {
      throw new HttpException({ message: error.message || 'Error updating profession', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async delete(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.professionService.delete(dbConnection, id);
    } catch (error) {
      throw new HttpException({ message: error.message || 'Error deleting profession', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('edit/:id')
  async edit(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string, @Body() updateDto: UpdateProfessionDto) {
    try {
      return await this.professionService.edit(dbConnection, id, updateDto);
    } catch (error) {
      throw new HttpException({ message: error.message || 'Error editing profession', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
