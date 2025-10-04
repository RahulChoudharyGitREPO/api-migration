import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Project, ProjectSchema } from './project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectListDto } from './dto/project-list.dto';

@Injectable()
export class ProjectsService {
  constructor() {}

  private getProjectModel(dbConnection: Connection): Model<any> {
    // Register schemas if not already registered
    this.registerSchemas(dbConnection);

    if (dbConnection.models.Project) {
      return dbConnection.models.Project;
    }
    return dbConnection.model('Project', ProjectSchema);
  }

  private registerSchemas(dbConnection: Connection): void {
    // Import User schema
    const { UserSchema } = require('../auth/schemas/user.schema');

    // Register User schema if not already registered (Express pattern)
    if (!dbConnection.models.users) {
      dbConnection.model('users', UserSchema, 'users');
    }

    // Register Form schema if not already registered
    if (!dbConnection.models.Form) {
      const { FormSchema } = require('../forms/schemas/form.schema');
      dbConnection.model('Form', FormSchema);
    }
  }

  async create(dbConnection: Connection, createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    try {
      const ProjectModel = this.getProjectModel(dbConnection);

      const project = new ProjectModel({
        ...createProjectDto,
        projectManager: new Types.ObjectId(createProjectDto.projectManager),
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
        forms: createProjectDto.forms?.map(id => new Types.ObjectId(id)) || [],
      });

      const savedProject = await project.save();
      return savedProject;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) =>
          err.message.replace('Path', 'Field')
        );
        throw new BadRequestException(messages.join(', '));
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        throw new BadRequestException(
          `${field} must be unique. '${error.keyValue[field]}' is already in use.`
        );
      }

      throw error;
    }
  }

  async update(dbConnection: Connection, id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    try {
      const ProjectModel = this.getProjectModel(dbConnection);

      const updateData: any = {
        ...updateProjectDto,
        updatedBy: new Types.ObjectId(userId),
      };

      if (updateProjectDto.projectManager) {
        updateData.projectManager = new Types.ObjectId(updateProjectDto.projectManager);
      }

      if (updateProjectDto.forms) {
        updateData.forms = updateProjectDto.forms.map(id => new Types.ObjectId(id));
      }

      const updatedProject = await ProjectModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProject) {
        throw new NotFoundException('Project not found');
      }

      return updatedProject;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) =>
          err.message.replace('Path', 'Field')
        );
        throw new BadRequestException(messages.join(', '));
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        throw new BadRequestException(
          `${field} must be unique. '${error.keyValue[field]}' is already in use.`
        );
      }

      throw error;
    }
  }

  async findById(dbConnection: Connection, id: string): Promise<Project> {
    const ProjectModel = this.getProjectModel(dbConnection);

    const project = await ProjectModel.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('projectManager', 'name')
      .populate('forms');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async list(dbConnection: Connection, projectListDto: ProjectListDto) {
    const ProjectModel = this.getProjectModel(dbConnection);

    const { page = 1, limit = 10, all = false } = projectListDto;
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const fetchAll = all === true;

    if (fetchAll) {
      const projects = await ProjectModel.find({})
        .sort({ createdAt: -1 });

      return {
        data: projects,
        pagination: null,
      };
    }

    // Normal pagination flow
    const totalCounts = await ProjectModel.countDocuments({});
    const totalPages = Math.ceil(totalCounts / limitNum);

    const projects = await ProjectModel.find({})
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    return {
      data: projects,
      pagination: {
        totalCounts,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    };
  }
}