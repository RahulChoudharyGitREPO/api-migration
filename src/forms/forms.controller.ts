import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FormsService } from './forms.service';
import { FormProcessorService } from './form-processor.service';
import { CreateFormDto, UpdateFormDto, GenerateFormDto } from './dto/form.dto';
import { SubmitFormDto, UpdateFormEntryDto, GetEntriesDto, UpdateWorkflowStepDto, GetEntriesOldDto, CreateWorkflowDto, UpdateLayoutDto } from './dto/form-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import { DatabaseConnection } from '../common/decorators/dynamic-db.decorator';
import { Connection } from 'mongoose';

@Controller(':companyName/api/form')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly formProcessorService: FormProcessorService,
  ) {}

  @Post('save')
  async saveForm(
    @DatabaseConnection() dbConnection: Connection,
    @Body() createFormDto: CreateFormDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      // // Handle frontend compatibility: map 'schema' to 'formSchema'
      // if (createFormDto.schema && !createFormDto.formSchema) {
      //   createFormDto.formSchema = createFormDto.schema;
      // }

      const form = await this.formsService.saveForm(dbConnection, createFormDto, userId);

      return {
        success: true,
        message: 'Form saved successfully',
        data: form,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to save form',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate_form')
  async generateForm(
    @DatabaseConnection() dbConnection: Connection,
    @Body() generateFormDto: GenerateFormDto,
  ) {
    try {
      const generatedForm = await this.formsService.generateForm(dbConnection, generateFormDto);

      return {
        success: true,
        message: 'Form generated successfully',
        data: generatedForm,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to generate form',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('load')
  async loadForm(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug: string,
  ) {
    try {
      if (!slug) {
        throw new HttpException(
          { success: false, message: 'Slug parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const form = await this.formsService.loadForm(dbConnection, slug);

      return {
        success: true,
        message: 'Form loaded successfully',
        data: form,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to load form',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list')
  async getFormsList(
    @DatabaseConnection() dbConnection: Connection,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const forms = await this.formsService.getFormsList(dbConnection, userId);

      return {
        success: true,
        message: 'Forms list retrieved successfully',
        data: forms,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve forms list',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('forms-list')
  async getFormsListPaginated(
    @DatabaseConnection() dbConnection: Connection,
    @Query('status') status: string,
    @Query('favoriteOnly') favoriteOnly: string,
    @Query('sharedOnly') sharedOnly: string,
    @Query('filledOnly') filledOnly: string,
    @Query('draftsOnly') draftsOnly: string,
    @Query('search') search: string,
    @Query('projectId') projectId: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      const result = await this.formsService.getFormsListWithPagination(
        dbConnection,
        userId,
        {
          status: status || undefined,
          favoriteOnly: favoriteOnly === 'true',
          sharedOnly: sharedOnly === 'true',
          filledOnly: filledOnly === 'true',
          draftsOnly: draftsOnly === 'true',
          search: search || undefined,
          projectId: projectId || undefined,
        }
      );

      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve forms list',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('forms-list')
  async getFormsListPost(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      favoriteOnly?: boolean;
      sharedOnly?: boolean;
      filledOnly?: boolean;
      draftsOnly?: boolean;
      projectId?: string;
    },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const {
        page = 1,
        limit = 10,
        search,
        status,
        favoriteOnly,
        sharedOnly,
        filledOnly,
        draftsOnly,
        projectId
      } = body;

      const result = await this.formsService.getFormsListWithPagination(
        dbConnection,
        userId,
        {
          status: status || undefined,
          favoriteOnly: favoriteOnly || false,
          sharedOnly: sharedOnly || false,
          filledOnly: filledOnly || false,
          draftsOnly: draftsOnly || false,
          search: search || undefined,
          projectId: projectId || undefined,
        }
      );

      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve forms list',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete')
  async deleteForm(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug: string,
    @Req() req: any,
  ) {
    try {
      if (!slug) {
        throw new HttpException(
          { success: false, message: 'Slug parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.user_id;
      await this.formsService.deleteForm(dbConnection, slug, userId);

      return {
        success: true,
        message: 'Form deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete form',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('toggle-favorite')
  async toggleFavorite(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: { slug: string },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const form = await this.formsService.toggleFavorite(dbConnection, body.slug, userId);

      return {
        success: true,
        message: 'Favorite toggled successfully',
        data: form,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to toggle favorite',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('share')
  async shareForm(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: { slug: string; userIds: string[]; canCreate: boolean; canEdit: boolean },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const { slug, ...shareData } = body;

      const form = await this.formsService.shareForm(dbConnection, slug, shareData, userId);

      return {
        success: true,
        message: 'Form shared successfully',
        data: form,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to share form',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('submit')
  async submitForm(
    @DatabaseConnection() dbConnection: Connection,
    @Body() submitFormDto: SubmitFormDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      const response = await this.formProcessorService.processFormData({
        dbConnection,
        slug: submitFormDto.slug,
        projectName: submitFormDto.projectName,
        rawData: submitFormDto.data,
        isDraft: submitFormDto.isDraft || false,
        loggedInUserId: userId,
      });

      return {
        success: true,
        message: 'Form submitted successfully',
        data: { slug: submitFormDto.slug, id: response._id },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to submit form',
          details: error.details || null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update/:slug/:entryId')
  async updateFormEntry(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Param('entryId') entryId: string,
    @Body() updateFormEntryDto: UpdateFormEntryDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      const response = await this.formProcessorService.processFormData({
        dbConnection,
        slug,
        projectName: updateFormEntryDto.projectName,
        rawData: updateFormEntryDto.data,
        isDraft: updateFormEntryDto.isDraft || false,
        loggedInUserId: userId,
        entryId,
        stepNo: updateFormEntryDto.stepNo,
        approvalStatus: updateFormEntryDto.approvalStatus,
      });

      return {
        success: true,
        message: 'Form entry updated successfully',
        data: { slug, id: entryId, response },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update form entry',
          details: error.details || null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('entries')
  async getFormEntries(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug: string,
    @Body() getEntriesDto: GetEntriesDto,
    @Req() req: any,
  ) {
    try {
      if (!slug) {
        throw new HttpException(
          { success: false, message: 'Slug parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.user_id;
      const result = await this.formsService.getFormEntries(
        dbConnection,
        slug,
        getEntriesDto,
        userId,
      );

      return {
        success: true,
        message: 'Form entries retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve form entries',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-steps')
  async updateWorkflowSteps(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: {
      slug: string;
      entryId: string;
      stepNo: number;
      updates: UpdateWorkflowStepDto;
      projectName?: string;
    },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const { slug, entryId, stepNo, updates, projectName } = body;

      const result = await this.formsService.updateWorkflowStep(
        dbConnection,
        slug,
        entryId,
        stepNo,
        updates,
        projectName,
        userId,
      );

      return {
        success: true,
        message: 'Workflow step updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update workflow step',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Phase 3 Endpoints - High Priority

  @Get('users-list')
  async getUsersList(
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      const users = await this.formsService.getUsersList(dbConnection);

      return {
        success: true,
        message: 'Users list retrieved successfully',
        data: users,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve users list',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('permissions/:slug')
  async checkFormPermissions(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const permissions = await this.formsService.checkFormPermissions(dbConnection, slug, userId);

      return {
        success: true,
        message: 'Form permissions retrieved successfully',
        data: permissions,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to check form permissions',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('entries/old')
  async getFormEntriesOld(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug: string,
    @Body() getEntriesDto: any,
    @Req() req: any,
  ) {
    try {
      if (!slug) {
        throw new HttpException(
          { success: false, message: 'Slug parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.user_id;
      const result = await this.formsService.getEntriesOld(
        dbConnection,
        slug,
        getEntriesDto,
        userId,
      );

      return {
        success: true,
        message: 'Form entries retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve form entries',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('forms-list-old')
  async getFormsListOld(
    @DatabaseConnection() dbConnection: Connection,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const forms = await this.formsService.getFormsList(dbConnection, userId);

      return {
        success: true,
        message: 'Forms list retrieved successfully (legacy format)',
        data: forms,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve forms list',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('workflow/create')
  async createWorkflow(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: { slug: string; workflow: any },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const { slug, workflow } = body;

      const result = await this.formsService.createWorkflow(dbConnection, slug, workflow, userId);

      return {
        success: true,
        message: 'Workflow created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create workflow',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-layout')
  async updateLayout(
    @DatabaseConnection() dbConnection: Connection,
    @Body() body: { slug: string; layout: any },
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const { slug, layout } = body;

      const result = await this.formsService.updateLayout(dbConnection, slug, { layout }, userId);

      return {
        success: true,
        message: 'Layout updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update layout',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('migrate/:slug')
  async migrateForm(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.formsService.migrateForm(dbConnection, slug, userId);

      return {
        success: true,
        message: 'Form migrated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to migrate form',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('migrate-shared-with/:slug')
  async migrateSharedWith(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.formsService.migrateSharedWith(dbConnection, slug, userId);

      return {
        success: true,
        message: 'Sharing permissions migrated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to migrate sharing permissions',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('migrate-all-shared-with')
  async migrateAllSharedWith(
    @DatabaseConnection() dbConnection: Connection,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.formsService.migrateAllSharedWith(dbConnection, userId);

      return {
        success: true,
        message: 'All sharing permissions migrated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to migrate all sharing permissions',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Excel endpoints

  @Get(':slug/download-excel')
  async downloadExcel(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      await this.formsService.downloadExcel(dbConnection, slug, res, userId);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to download Excel file',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':slug/upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (!file) {
        throw new HttpException(
          { success: false, message: 'No file uploaded' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.user_id;
      const result = await this.formsService.uploadExcel(dbConnection, slug, file, userId);

      return {
        success: true,
        message: 'Excel file uploaded and processed successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to upload Excel file',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Streaming endpoints

  @Get('stream-forms')
  async streamForms(
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      await this.formsService.streamForms(res, userId);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to stream forms',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stream-entries')
  async streamEntries(
    @DatabaseConnection() dbConnection: Connection,
    @Query('slug') slug: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      if (!slug) {
        throw new HttpException(
          { success: false, message: 'Slug parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.user_id;
      await this.formsService.streamEntries(dbConnection, slug, res, userId);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to stream entries',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stream-load')
  async streamLoad(
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });
      res.write('Stream load functionality - placeholder\n');
      res.end();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to stream load',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('entry-detailed/:slug/:entryId/:project')
  async getEntryDetailed(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Param('entryId') entryId: string,
    @Param('project') project: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;
      const result = await this.formsService.getEntryDetailed(
        dbConnection,
        slug,
        entryId,
        project,
        userId
      );

      return {
        success: true,
        message: 'Entry details retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve entry details',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stream-entry/:slug/:entryId')
  async streamEntry(
    @DatabaseConnection() dbConnection: Connection,
    @Param('slug') slug: string,
    @Param('entryId') entryId: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.user_id;

      // Get the entry
      const collection = dbConnection.collection(slug);
      const entry = await collection.findOne({ _id: new (require('mongodb').ObjectId)(entryId) });

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
      });

      if (entry) {
        res.write(JSON.stringify(entry));
      } else {
        res.write(JSON.stringify({ error: 'Entry not found' }));
      }

      res.end();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to stream entry',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}