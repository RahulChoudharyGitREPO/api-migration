import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PhcService } from './phc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreatePhcDto, UpdatePhcDto, PhcListDto, PhcListV2Dto } from './dto/phc.dto';

@Controller(':companyName/api/phc')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class PhcController {
  constructor(private readonly phcService: PhcService) {}

  @Post('create')
  async createPhc(@DatabaseConnection() dbConnection: Connection, @Body() createPhcDto: CreatePhcDto) {
    try {
      return await this.phcService.createPhc(dbConnection, createPhcDto);
    } catch (error) {
      throw new HttpException({ success: false, message: error.message || 'Error creating Phc Center', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list')
  async listPhcs(@DatabaseConnection() dbConnection: Connection, @Body() listDto: PhcListDto) {
    try {
      return await this.phcService.listPhcs(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ success: false, message: 'Error fetching PHP Centers', error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list/v2')
  async listPhcsV2(@DatabaseConnection() dbConnection: Connection, @Body() listDto: PhcListV2Dto) {
    try {
      return await this.phcService.listPhcsV2(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('details/:id')
  async getPhcDetails(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.phcService.getPhcDetails(dbConnection, id);
    } catch (error) {
      throw new HttpException({ success: false, message: error.message || 'Error fetching PHP Center', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('delete/:id')
  async deletePhc(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.phcService.deletePhc(dbConnection, id);
    } catch (error) {
      throw new HttpException({ success: false, message: error.message || 'Error deleting PHP Center', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('hard-delete/:id')
  async hardDeletePhc(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.phcService.hardDeletePhc(dbConnection, id);
    } catch (error) {
      throw new HttpException({ success: false, message: error.message || 'Error deleting Phc Center permanently', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('edit/:id')
  async updatePhc(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string, @Body() updateDto: UpdatePhcDto) {
    try {
      return await this.phcService.updatePhc(dbConnection, id, updateDto);
    } catch (error) {
      throw new HttpException({ success: false, message: error.message || 'Error updating PHC Center', error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
