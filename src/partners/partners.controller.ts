import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection, Types } from 'mongoose';
import { CreatePartnerDto, PartnerListDto } from './dto/partner.dto';

@Controller(':companyName/api/partner')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  async getHealth() {
    return 'Partner api is listening successfully :)';
  }

  @Post('create')
  async createPartner(
    @DatabaseConnection() dbConnection: Connection,
    @Body() createPartnerDto: CreatePartnerDto,
  ) {
    try {
      const { name, partnerCode, email, contactNumber, type, status, schema } = createPartnerDto;

      if (!(name && partnerCode && email && contactNumber && type && status && schema)) {
        throw new BadRequestException(
          'name, partnerCode, email, contactNumber, type, status, schema are required!',
        );
      }

      const result = await this.partnersService.createPartner(dbConnection, createPartnerDto);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
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
  async listPartners(
    @DatabaseConnection() dbConnection: Connection,
    @Body() partnerListDto: PartnerListDto,
  ) {
    try {
      const result = await this.partnersService.listPartners(dbConnection, partnerListDto);

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
  async getPartnerDetails(
    @DatabaseConnection() dbConnection: Connection,
    @Param('id') id: string,
  ) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format!');
      }

      const data = await this.partnersService.getPartnerDetails(dbConnection, id);

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
