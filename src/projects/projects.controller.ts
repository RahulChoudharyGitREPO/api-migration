import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectListDto } from './dto/project-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';

@Controller(':companyName/api/project')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  async create(
    @DatabaseConnection() dbConnection: Connection,
    @Req() req,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const userId = req.user.user_id;

    const project = await this.projectsService.create(dbConnection, createProjectDto, userId);

    return {
      success: true,
      message: 'Project created successfully',
      data: project,
    };
  }

  @Put('edit/:id')
  async update(
    @DatabaseConnection() dbConnection: Connection,
    @Req() req,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const userId = req.user.user_id;

    const project = await this.projectsService.update(dbConnection, id, updateProjectDto, userId);

    return {
      success: true,
      message: 'Project updated successfully',
      data: project,
    };
  }

  @Get('details/:id')
  async findOne(
    @DatabaseConnection() dbConnection: Connection,
    @Param('id') id: string
  ) {
    const project = await this.projectsService.findById(dbConnection, id);

    return {
      success: true,
      message: 'Project fetched successfully',
      data: project,
    };
  }

  @Post('list')
  async list(
    @DatabaseConnection() dbConnection: Connection,
    @Body() projectListDto: ProjectListDto
  ) {
    const result = await this.projectsService.list(dbConnection, projectListDto);

    return {
      success: true,
      message: result.pagination
        ? 'Projects list fetched successfully'
        : 'All projects fetched successfully',
      ...result,
    };
  }

  @Get('view')
  async view(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug?: string,
    @Query('type') type?: string,
    @Query('project') project?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('all') all?: string,
  ) {
    // Convert query parameters to match ProjectListDto format
    const projectListDto: ProjectListDto = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      all: all === 'true' || type === 'all',
    };

    const result = await this.projectsService.list(dbConnection, projectListDto);

    return {
      success: true,
      message: result.pagination
        ? 'Projects list fetched successfully'
        : 'All projects fetched successfully',
      ...result,
    };
  }
}