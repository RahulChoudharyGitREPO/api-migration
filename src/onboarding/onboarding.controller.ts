import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateOnboardingDto, UpdateOnboardingDto, OnboardingListDto, OnboardingListV2Dto } from './dto/onboarding.dto';

@Controller(':companyName/api/onboarding')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('create')
  async create(@DatabaseConnection() dbConnection: Connection, @Body() createDto: CreateOnboardingDto, @Req() req: any) {
    try {
      const loggedInUserId = req.user?.userId || req.user?.id;
      return await this.onboardingService.create(dbConnection, createDto, loggedInUserId);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new HttpException({ message: error.message }, HttpStatus.BAD_REQUEST);
      }
      if (error.code === 11000) {
        throw new HttpException({ message: 'Duplicate SL#', details: error.keyValue }, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException({ message: error.message || 'Server Error' }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list')
  async list(@DatabaseConnection() dbConnection: Connection, @Body() listDto: OnboardingListDto) {
    try {
      return await this.onboardingService.list(dbConnection, listDto);
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new HttpException({ message: 'Invalid ID format in filters' }, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException({ message: 'Server Error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('list/v2')
  async listV2(@DatabaseConnection() dbConnection: Connection, @Body() listDto: OnboardingListV2Dto) {
    try {
      return await this.onboardingService.listV2(dbConnection, listDto);
    } catch (error) {
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('details/:id')
  async getDetails(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.onboardingService.getDetails(dbConnection, id);
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new HttpException({ message: 'Invalid Registration ID' }, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException({ message: error.message || 'Server Error' }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('edit/:id')
  async update(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string, @Body() updateDto: UpdateOnboardingDto, @Req() req: any) {
    try {
      const loggedInUserId = req.user?.userId || req.user?.id;
      return await this.onboardingService.update(dbConnection, id, updateDto, loggedInUserId);
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new HttpException({ message: 'Invalid Registration ID' }, HttpStatus.BAD_REQUEST);
      }
      if (error.name === 'ValidationError') {
        throw new HttpException({ message: error.message }, HttpStatus.BAD_REQUEST);
      }
      if (error.code === 11000) {
        throw new HttpException({ message: 'Duplicate SL#', details: error.keyValue }, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException({ message: error.message || 'Server Error' }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('delete/:id')
  async delete(@DatabaseConnection() dbConnection: Connection, @Param('id') id: string) {
    try {
      return await this.onboardingService.delete(dbConnection, id);
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new HttpException({ message: 'Invalid Registration ID' }, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException({ message: error.message || 'Server Error' }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getStats(@DatabaseConnection() dbConnection: Connection) {
    try {
      return await this.onboardingService.getStats(dbConnection);
    } catch (error) {
      throw new HttpException({ message: 'Failed to fetch dashboard statistics', error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
