import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { DonorsService } from './donors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateDonorDto, UpdateDonorDto, UpdateDonorFeaturesDto, DonorListDto } from './dto/donor.dto';

@Controller(':companyName/api/donor')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Get()
  async getHealth() {
    return { message: 'Donor api is working!!!' };
  }

  @Post('create')
  async createDonor(
    @DatabaseConnection() dbConnection: Connection,
    @Body() createDonorDto: CreateDonorDto,
    @Req() req: any,
    @Param('companyName') companyName: string,
  ) {
    try {
      const userId = req.user?.user_id;

      if (!createDonorDto.code || !createDonorDto.name) {
        throw new HttpException(
          {
            success: false,
            message: 'donor name, donor code are required!',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.donorsService.createDonor(
        dbConnection,
        createDonorDto,
        userId,
        companyName,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create donor',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update')
  async updateDonor(
    @DatabaseConnection() dbConnection: Connection,
    @Body() updateDonorDto: UpdateDonorDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.donorsService.updateDonor(dbConnection, updateDonorDto, userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update donor',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('features/update')
  async updateDonorFeatures(
    @DatabaseConnection() dbConnection: Connection,
    @Body() updateFeaturesDto: UpdateDonorFeaturesDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.donorsService.updateDonorFeatures(
        dbConnection,
        updateFeaturesDto,
        userId,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update donor features',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('features/bulk-update')
  async updateMultipleDonorFeatures(
    @DatabaseConnection() dbConnection: Connection,
    @Body() donors: UpdateDonorFeaturesDto[],
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      if (!Array.isArray(donors) || donors.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'An array of donors is required!',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.donorsService.updateMultipleDonorFeatures(
        dbConnection,
        donors,
        userId,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to bulk update donor features',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('list')
  async getAllDonors(
    @DatabaseConnection() dbConnection: Connection,
    @Body() donorListDto: DonorListDto,
  ) {
    try {
      const result = await this.donorsService.getAllDonors(dbConnection, donorListDto);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get donors list',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('access/list')
  async getAllDonorsAccessList(
    @DatabaseConnection() dbConnection: Connection,
    @Body() donorListDto: DonorListDto,
  ) {
    try {
      const result = await this.donorsService.getAllDonorsAccessList(dbConnection, donorListDto);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get donors access list',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('details')
  async getDonorDetails(
    @DatabaseConnection() dbConnection: Connection,
    @Query('id') id?: string,
    @Query('donorCode') donorCode?: string,
  ) {
    try {
      const result = await this.donorsService.getDonorDetails(dbConnection, id, donorCode);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get donor details',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete')
  async deleteDonor(
    @DatabaseConnection() dbConnection: Connection,
    @Query('id') id: string,
  ) {
    try {
      const result = await this.donorsService.deleteDonor(dbConnection, id);

      return {
        success: true,
        data: result,
        message: 'Donor deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete donor',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
