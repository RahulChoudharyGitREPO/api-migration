import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateKpiDto, KpiListDto } from './dto/kpi.dto';

@Controller(':companyName/api/kpi')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  async getHealth() {
    return 'Kpi api is listening successfully :)';
  }

  @Post('create')
  async createKpi(
    @DatabaseConnection() dbConnection: Connection,
    @Body() createKpiDto: CreateKpiDto,
  ) {
    try {
      const result = await this.kpiService.createKpi(dbConnection, createKpiDto);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.status === 409) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
            field: 'name',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: error.message || 'Internal Server Error',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('list')
  async listKpis(
    @DatabaseConnection() dbConnection: Connection,
    @Body() kpiListDto: KpiListDto,
  ) {
    try {
      const result = await this.kpiService.listKpis(dbConnection, kpiListDto);

      return result;
    } catch (error) {
      throw new HttpException(
        {
          error: error.message || 'Internal Server Error',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('details/:id')
  async getKpiDetails(
    @DatabaseConnection() dbConnection: Connection,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.kpiService.getKpiDetails(dbConnection, id);

      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: error.message || 'Internal Server Error',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
