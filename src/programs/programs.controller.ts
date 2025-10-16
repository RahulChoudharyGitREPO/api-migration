import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';
import { CreateProgramDto, UpdateProgramDto, ProgramListDto } from './dto/program.dto';

@Controller(':companyName/api/program')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  async getHealth() {
    return 'Program api is listening successfully :)';
  }

  @Post('create')
  async createProgram(
    @DatabaseConnection() dbConnection: Connection,
    @Body() createProgramDto: CreateProgramDto,
  ) {
    try {
      const result = await this.programsService.createProgram(dbConnection, createProgramDto);

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

  @Put('update')
  async updateProgram(
    @DatabaseConnection() dbConnection: Connection,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    try {
      const result = await this.programsService.updateProgram(dbConnection, updateProgramDto);

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
  async listPrograms(
    @DatabaseConnection() dbConnection: Connection,
    @Body() programListDto: ProgramListDto,
  ) {
    try {
      const result = await this.programsService.listPrograms(dbConnection, programListDto);

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
  async getProgramDetails(
    @DatabaseConnection() dbConnection: Connection,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.programsService.getProgramDetails(dbConnection, id);

      return { data };
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
