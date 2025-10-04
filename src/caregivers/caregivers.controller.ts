import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateCaregiverDto, UpdateCaregiverDto, CaregiverListDto, CaregiverListV2Dto } from './dto/caregiver.dto';

@Controller(':companyName/api/caregivers')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Post('create')
  async create(@DatabaseConnection() dbConnection: Connection, @Body() createDto: CreateCaregiverDto) {
    try {
      return await this.caregiversService.create(dbConnection, createDto);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new HttpException({ message: `Caregiver with this ${field} already exists` }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('details/:id')
  async getDetails(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.caregiversService.getDetails(dbConnection, id);
    } catch (error) {
      throw new HttpException({ error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list')
  async list(@DatabaseConnection() dbConnection: Connection, @Body() listDto: CaregiverListDto) {
    try {
      return await this.caregiversService.list(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('v2/list')
  async listV2(@DatabaseConnection() dbConnection: Connection, @Body() listDto: CaregiverListV2Dto) {
    try {
      return await this.caregiversService.listV2(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('update/:id')
  async update(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string, @Body() updateDto: UpdateCaregiverDto) {
    try {
      return await this.caregiversService.update(dbConnection, id, updateDto);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new HttpException({ message: `Caregiver with this ${field} already exists` }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async delete(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.caregiversService.delete(dbConnection, id);
    } catch (error) {
      throw new HttpException({ error: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('dashboard/stats')
  async getDashboardStats(@DatabaseConnection() dbConnection: Connection) {
    try {
      return await this.caregiversService.getDashboardStats(dbConnection);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('dashboard/simple-stats')
  async getSimpleStats(@DatabaseConnection() dbConnection: Connection) {
    try {
      return await this.caregiversService.getSimpleStats(dbConnection);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
