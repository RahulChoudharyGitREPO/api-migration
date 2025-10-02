import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { Form } from './schemas/form.schema';
import { CreateFormDto, UpdateFormDto, GenerateFormDto } from './dto/form.dto';
import { GetEntriesDto, UpdateWorkflowStepDto } from './dto/form-submission.dto';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class FormsService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  private getFormModel(dbConnection: Connection): Model<Form> {
    // Register schemas if not already registered
    this.registerSchemas(dbConnection);
    return dbConnection.model<Form>('Form', require('./schemas/form.schema').FormSchema);
  }

  private registerSchemas(dbConnection: Connection): void {
    // Register User schema if not already registered
    if (!dbConnection.models.User) {
      const userSchema = require('../auth/schemas/user.schema').UserSchema;
      dbConnection.model('User', userSchema);
    }

    // Register Project schema if not already registered
    if (!dbConnection.models.Project) {
      const projectSchema = require('../projects/projects.schema').ProjectSchema || new dbConnection.base.Schema({
        name: String,
        description: String,
      });
      dbConnection.model('Project', projectSchema);
    }
  }

  async saveForm(dbConnection: Connection, createFormDto: CreateFormDto, userId: string): Promise<Form> {
    const FormModel = this.getFormModel(dbConnection);

    // Check if slug already exists
    const existingForm = await FormModel.findOne({ slug: createFormDto.slug });
    if (existingForm) {
      throw new ConflictException('Form with this slug already exists');
    }

    const form = new FormModel({
      ...createFormDto,
      createdBy: userId,
    });

    return await form.save();
  }

  async generateForm(dbConnection: Connection, generateFormDto: GenerateFormDto): Promise<any> {
    try {
      const prompt = `Create a form schema based on this description: "${generateFormDto.prompt}".
      Return a JSON array of form fields with properties like:
      {
        "key": "field_name",
        "type": "text|number|email|select|radio|checkbox|textarea",
        "label": "Field Label",
        "required": true/false,
        "options": [] // for select/radio fields
      }`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      const generatedSchema = JSON.parse(completion.choices[0].message.content || '[]');

      return {
        title: generateFormDto.title || 'Generated Form',
        schema: generatedSchema,
        slug: this.generateSlug(generateFormDto.title || 'generated-form'),
      };
    } catch (error) {
      throw new Error(`Failed to generate form: ${error.message}`);
    }
  }

  async loadForm(dbConnection: Connection, slug: string): Promise<Form> {
    const FormModel = this.getFormModel(dbConnection);
    const form = await FormModel.findOne({ slug }).populate('sharedWith.user projects');

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Transform formSchema to schema for Express compatibility
    const formObj = form.toObject();
    return {
      ...formObj,
      schema: formObj.formSchema
    } as any;
  }

  async getFormsList(dbConnection: Connection, userId: string): Promise<Form[]> {
    const FormModel = this.getFormModel(dbConnection);

    // Get forms where user is creator or shared with user
    const forms = await FormModel.find({
      $or: [
        { createdBy: userId },
        { 'sharedWith.user': userId }
      ]
    })
    .populate('sharedWith.user projects')
    .sort({ updatedAt: -1 });

    return forms;
  }

  async getFormsListWithPagination(
    dbConnection: Connection,
    userId: string,
    options: {
      status?: string;
      favoriteOnly?: boolean;
      sharedOnly?: boolean;
      filledOnly?: boolean;
      draftsOnly?: boolean;
      search?: string;
      projectId?: string;
    } = {}
  ): Promise<{
    data: any[];
    total: number;
    sidebar: any[];
    filters: any;
  }> {
    const {
      status,
      favoriteOnly = false,
      sharedOnly = false,
      filledOnly = false,
      draftsOnly = false,
      search,
      projectId
    } = options;

    // Get user info
    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findById(userId);
    const userRole = user?.role;
    const isSuperAdmin = userRole === 'SuperAdmin';

    // Build basic query for forms
    const query: any = {};

    // Permissions: only show forms shared with or created by user (if not superadmin and no filters)
    if (!isSuperAdmin && !favoriteOnly && !sharedOnly && !filledOnly && !draftsOnly && !status) {
      query.$or = [
        { 'sharedWith.user': userId },
        { createdBy: userId }
      ];
    }

    if (projectId) {
      query.projects = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (favoriteOnly) {
      query.favorite = { $in: [userId] };
    }

    if (sharedOnly) {
      query.sharedWith = {
        $elemMatch: { user: userId }
      };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Get forms using aggregation to populate projects
    const forms = await dbConnection.collection('forms').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'projects',
          localField: 'projects',
          foreignField: '_id',
          as: 'projectDetails'
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    // Process forms and add computed fields
    const processedForms = await Promise.all(forms.map(async (form) => {
      // Calculate page count
      const pageCount = form.formSchema ? form.formSchema.length : 1;

      // Check if user has favorited this form
      const isFavorite = form.favorite && form.favorite.some((fav: any) => fav.toString() === userId);
      const favoriteCount = form.favorite ? form.favorite.length : 0;
      const favoriteIds = form.favorite || [];

      // Check if shared with user
      const isSharedWithMe = form.sharedWith && form.sharedWith.some((item: any) => {
        if (typeof item === 'object' && item.user) {
          return item.user.toString() === userId;
        }
        return item.toString() === userId;
      });
      const sharedWithCount = form.sharedWith ? form.sharedWith.length : 0;
      const sharedWithIds = form.sharedWith || [];

      // Check if form has entries (simplified for now)
      let isFilled = false;
      try {
        const entryCount = await dbConnection.collection(form.slug).countDocuments();
        isFilled = entryCount > 0;
      } catch (error) {
        // Collection might not exist, isFilled remains false
      }

      // Project info
      const projectInfo = form.projectDetails && form.projectDetails.length > 0
        ? {
            projectId: form.projectDetails[0]._id,
            projectName: form.projectDetails[0].projectName,
            isProjectActive: form.projectDetails[0].isActive ? "true" : "false"
          }
        : {
            projectId: null,
            projectName: "Not assigned",
            isProjectActive: null
          };

      return {
        _id: form._id,
        slug: form.slug,
        title: form.title,
        schema: form.formSchema, // Transform formSchema to schema for Express compatibility
        status: form.status,
        pageCount,
        ...projectInfo,
        isFavorite,
        favoriteCount,
        favoriteIds,
        isSharedWithMe,
        sharedWithCount,
        sharedWithIds,
        isFilled,
        isDraft: form.isDraft || false,
        published: form.published || false,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    }));

    // Build sidebar counts (simplified for now)
    const sidebarCounts = {
      all: processedForms.length,
      favorites: processedForms.filter(f => f.isFavorite).length,
      shared: processedForms.filter(f => f.isSharedWithMe).length,
      filled: processedForms.filter(f => f.isFilled).length,
      drafts: processedForms.filter(f => f.isDraft).length
    };

    const sidebarData = [
      { label: "All forms", count: sidebarCounts.all },
      { label: "Favorites", count: sidebarCounts.favorites },
      { label: "Shared", count: sidebarCounts.shared },
      { label: "Filled", count: sidebarCounts.filled },
      { label: "Drafts", count: sidebarCounts.drafts }
    ];

    return {
      data: processedForms,
      total: processedForms.length,
      sidebar: sidebarData,
      filters: {
        status: status || "all",
        favoriteOnly,
        sharedOnly,
        filledOnly,
        draftsOnly,
        search: search || null
      }
    };
  }

  private getUserModel(dbConnection: Connection): any {
    if (!dbConnection.models.User) {
      const userSchema = require('../auth/schemas/user.schema').UserSchema;
      return dbConnection.model('User', userSchema);
    }
    return dbConnection.model('User');
  }

  async deleteForm(dbConnection: Connection, slug: string, userId: string): Promise<void> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check if user has permission to delete (creator or has edit permission)
    const hasPermission = form.createdBy?.toString() === userId ||
      form.sharedWith.some(shared =>
        shared.user.toString() === userId && shared.canEdit
      );

    if (!hasPermission) {
      throw new ConflictException('You do not have permission to delete this form');
    }

    await FormModel.deleteOne({ slug });
  }

  async toggleFavorite(dbConnection: Connection, slug: string, userId: string): Promise<Form> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const isFavorite = form.favorite.includes(userId as any);

    if (isFavorite) {
      form.favorite = form.favorite.filter(id => id.toString() !== userId);
    } else {
      form.favorite.push(userId as any);
    }

    return await form.save();
  }

  async shareForm(
    dbConnection: Connection,
    slug: string,
    shareData: { userIds: string[]; canCreate: boolean; canEdit: boolean },
    userId: string
  ): Promise<Form> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check if user is creator
    if (form.createdBy?.toString() !== userId) {
      throw new ConflictException('Only form creator can share the form');
    }

    // Remove existing shared users and add new ones
    form.sharedWith = shareData.userIds.map(userId => ({
      user: userId as any,
      canCreate: shareData.canCreate,
      canEdit: shareData.canEdit,
    }));

    return await form.save();
  }

  async getFormEntries(
    dbConnection: Connection,
    slug: string,
    getEntriesDto: GetEntriesDto,
    userId: string,
  ): Promise<{ entries: any[]; total: number; page: number; totalPages: number }> {
    const { page = '1', limit = '10', search, filters, sortBy, sortOrder, projectName } = getEntriesDto;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const slugName = projectName && projectName.trim() !== 'null'
      ? `${slug}_${this.sanitize(projectName)}`
      : slug;

    const collection = dbConnection.collection(slugName);

    // Build query
    let query: any = {};

    if (search) {
      // Simple text search across all fields
      query.$or = [
        { 'createdBy': { $regex: search, $options: 'i' } },
        // Add more searchable fields as needed
      ];
    }

    if (filters) {
      Object.assign(query, filters);
    }

    // Build sort options
    let sortOptions: any = { createdAt: -1 }; // Default sort
    if (sortBy) {
      sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const [entries, total] = await Promise.all([
      collection.find(query).sort(sortOptions).skip(skip).limit(limitNum).toArray(),
      collection.countDocuments(query),
    ]);

    return {
      entries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async updateWorkflowStep(
    dbConnection: Connection,
    slug: string,
    entryId: string,
    stepNo: number,
    updates: UpdateWorkflowStepDto,
    projectName?: string,
    userId?: string,
  ): Promise<any> {
    if (!ObjectId.isValid(entryId)) {
      throw new Error('Invalid entry ID format');
    }

    const slugName = projectName && projectName.trim() !== 'null'
      ? `${slug}_${this.sanitize(projectName)}`
      : slug;

    const collection = dbConnection.collection(slugName);

    // Check entry exists
    const entry = await collection.findOne({
      _id: new ObjectId(entryId),
    });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Build update object
    const updateFields: any = {};
    const pushFields: any = {};

    if (updates.triggerStatus !== undefined) {
      updateFields[`workFlowSteps.${stepNo}.triggerStatus`] = updates.triggerStatus;
    }

    if (updates.approvalStatus !== undefined) {
      updateFields[`workFlowSteps.${stepNo}.approvalStatus`] = updates.approvalStatus;

      // Add timestamps based on approval status
      if (updates.approvalStatus === 'Approved') {
        updateFields[`workFlowSteps.${stepNo}.approvedAt`] = new Date();
        updateFields[`workFlowSteps.${stepNo}.approvedBy`] = userId;
      }

      if (updates.triggerStatus === true && !updateFields[`workFlowSteps.${stepNo}.triggeredAt`]) {
        updateFields[`workFlowSteps.${stepNo}.triggeredAt`] = new Date();
      }
    }

    // Handle rejection data
    if (updates.reason && updates.approvalStatus === 'Rejected') {
      const rejection = {
        rejectedBy: userId,
        rejectedAt: new Date(),
        reason: updates.reason || '',
        stepIndex: stepNo,
      };
      pushFields[`workFlowSteps.${stepNo}.rejections`] = rejection;
    }

    if (Object.keys(updateFields).length === 0 && Object.keys(pushFields).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    // Build the update operation
    const updateOperation: any = {};
    if (Object.keys(updateFields).length > 0) {
      updateOperation.$set = updateFields;
    }
    if (Object.keys(pushFields).length > 0) {
      updateOperation.$push = pushFields;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(entryId) },
      updateOperation,
      { returnDocument: 'after' }
    );

    return result?.value;
  }

  private sanitize(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9-_]/g, '');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9-_]/g, '');
  }

  // Phase 3 Methods - High Priority

  async getUsersList(dbConnection: Connection): Promise<any[]> {
    // Register User schema if not already registered
    this.registerSchemas(dbConnection);
    const UserModel = dbConnection.model('User');

    const users = await UserModel.find({ isActive: true })
      .select('name email role profilePic')
      .sort({ name: 1 });

    return users;
  }

  async checkFormPermissions(dbConnection: Connection, slug: string, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);
    const form = await FormModel.findOne({ slug });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const isCreator = form.createdBy?.toString() === userId;
    const sharedAccess = form.sharedWith.find(shared => shared.user.toString() === userId);

    return {
      canView: isCreator || !!sharedAccess,
      canEdit: isCreator || (sharedAccess?.canEdit || false),
      canCreate: isCreator || (sharedAccess?.canCreate || false),
      isOwner: isCreator
    };
  }

  async getEntriesOld(
    dbConnection: Connection,
    slug: string,
    getEntriesDto: any,
    userId: string,
  ): Promise<{ entries: any[]; total: number; page: number; totalPages: number }> {
    const { page = '1', limit = '10', search, filters, projectName } = getEntriesDto;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const slugName = projectName && projectName.trim() !== 'null'
      ? `${slug}_${this.sanitize(projectName)}`
      : slug;

    const collection = dbConnection.collection(slugName);

    // Build legacy query structure
    let query: any = {};

    if (search) {
      query.$or = [
        { 'createdBy': { $regex: search, $options: 'i' } },
      ];
    }

    if (filters) {
      Object.assign(query, filters);
    }

    const [entries, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
      collection.countDocuments(query),
    ]);

    return {
      entries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async createWorkflow(dbConnection: Connection, slug: string, workflowData: any, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId ||
      form.sharedWith.some(shared => shared.user.toString() === userId && shared.canEdit);

    if (!hasPermission) {
      throw new ConflictException('You do not have permission to create workflows for this form');
    }

    // Add workflow to form
    if (!form.workflows) {
      form.workflows = [];
    }

    const workflow = {
      id: new Date().getTime().toString(),
      name: workflowData.name,
      description: workflowData.description || '',
      steps: workflowData.steps,
      triggers: workflowData.triggers || {},
      logicOperator: workflowData.logicOperator || 'AND',
      createdBy: userId,
      createdAt: new Date(),
    };

    form.workflows.push(workflow);
    await form.save();

    return workflow;
  }

  async updateLayout(dbConnection: Connection, slug: string, layoutData: any, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId ||
      form.sharedWith.some(shared => shared.user.toString() === userId && shared.canEdit);

    if (!hasPermission) {
      throw new ConflictException('You do not have permission to update layout for this form');
    }

    // Update layout selections
    form.layoutSelections = layoutData.layout;
    await form.save();

    return form;
  }

  async migrateForm(dbConnection: Connection, slug: string, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId;
    if (!hasPermission) {
      throw new ConflictException('Only form owner can migrate the form');
    }

    // Perform migration logic (placeholder for now)
    // This would involve transforming legacy data structures
    const migrationResult = {
      migrated: true,
      timestamp: new Date(),
      migratedBy: userId,
      changes: []
    };

    return migrationResult;
  }

  async migrateSharedWith(dbConnection: Connection, slug: string, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);

    const form = await FormModel.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId;
    if (!hasPermission) {
      throw new ConflictException('Only form owner can migrate sharing permissions');
    }

    // Migrate sharing permissions (placeholder logic)
    const migrationResult = {
      migrated: true,
      affectedUsers: form.sharedWith.length,
      timestamp: new Date(),
      migratedBy: userId
    };

    return migrationResult;
  }

  async migrateAllSharedWith(dbConnection: Connection, userId: string): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);

    // Get all forms owned by the user
    const forms = await FormModel.find({ createdBy: userId });

    const migrationResults: any[] = [];
    for (const form of forms) {
      const result = await this.migrateSharedWith(dbConnection, form.slug, userId);
      migrationResults.push({
        slug: form.slug,
        ...result
      });
    }

    return {
      totalForms: forms.length,
      migratedForms: migrationResults.length,
      results: migrationResults,
      timestamp: new Date()
    };
  }

  // Excel Export/Import Methods

  async downloadExcel(dbConnection: Connection, slug: string, res: Response, userId: string): Promise<void> {
    const FormModel = this.getFormModel(dbConnection);
    const form = await FormModel.findOne({ slug });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId ||
      form.sharedWith.some(shared => shared.user.toString() === userId);

    if (!hasPermission) {
      throw new ConflictException('You do not have permission to access this form');
    }

    // Get form entries
    const collection = dbConnection.collection(slug);
    const entries = await collection.find({}).toArray();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Form Data');

    // Get field headers from form schema
    const allFields = (form.formSchema || form.formSchema || []).flatMap((page: any) => page.elements || []);
    const headers = ['ID', 'Created At', 'Updated At', 'Created By', 'Is Draft'];

    // Add form fields to headers
    allFields.forEach(field => {
      if (field.properties?.label) {
        headers.push(field.properties.label);
      }
    });

    // Add headers to worksheet
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    entries.forEach(entry => {
      const row = [
        entry._id?.toString() || '',
        entry.createdAt || '',
        entry.updatedAt || '',
        entry.createdBy?.toString() || '',
        entry.isDraft || false
      ];

      // Add field values
      allFields.forEach(field => {
        if (field.properties?.label) {
          const fieldKey = this.sanitize(field.properties.label);
          row.push(entry[fieldKey] || '');
        }
      });

      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}_data.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
  }

  async uploadExcel(
    dbConnection: Connection,
    slug: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<any> {
    const FormModel = this.getFormModel(dbConnection);
    const form = await FormModel.findOne({ slug });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check permissions
    const hasPermission = form.createdBy?.toString() === userId ||
      form.sharedWith.some(shared =>
        shared.user.toString() === userId && (shared.canCreate || shared.canEdit)
      );

    if (!hasPermission) {
      throw new ConflictException('You do not have permission to upload data to this form');
    }

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    const buffer = file.buffer as any;
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });

    // Get form fields mapping
    const allFields = (form.formSchema || form.formSchema || []).flatMap((page: any) => page.elements || []);
    const fieldMapping: { [key: string]: string } = {};

    allFields.forEach(field => {
      if (field.properties?.label) {
        const fieldKey = this.sanitize(field.properties.label);
        fieldMapping[field.properties.label] = fieldKey;
      }
    });

    const insertedRecords: any[] = [];
    const errors: any[] = [];

    // Process data rows
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData: any = {};

      // Map row data to form fields
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        const fieldKey = fieldMapping[header];

        if (fieldKey) {
          rowData[fieldKey] = cell.value;
        }
      });

      // Skip empty rows
      if (Object.keys(rowData).length === 0) {
        continue;
      }

      try {
        // Process the row data through form processor
        const response = await this.formProcessorService.processFormData({
          dbConnection,
          slug,
          rawData: rowData,
          isDraft: false,
          loggedInUserId: userId,
        });

        insertedRecords.push({
          row: rowNumber,
          id: response._id || response.insertedId,
          data: rowData
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message,
          data: rowData
        });
      }
    }

    return {
      totalRows: worksheet.rowCount - 1, // Exclude header
      successfulInserts: insertedRecords.length,
      errorCount: errors.length,
      insertedRecords,
      errors
    };
  }

  // Streaming Methods (placeholders for now)

  async streamForms(res: Response, userId: string): Promise<void> {
    // Placeholder for streaming forms implementation
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    res.write('Streaming forms functionality - placeholder\n');
    res.end();
  }

  async streamEntries(dbConnection: Connection, slug: string, res: Response, userId: string): Promise<void> {
    // Placeholder for streaming entries implementation
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    res.write('Streaming entries functionality - placeholder\n');
    res.end();
  }

  async getEntryDetailed(
    dbConnection: Connection,
    slug: string,
    entryId: string,
    project: string,
    userId: string
  ): Promise<any> {
    if (!ObjectId.isValid(entryId)) {
      throw new Error('Invalid entry ID format');
    }

    const slugName = project && project.trim() !== 'null'
      ? `${slug}_${this.sanitize(project)}`
      : slug;

    const collection = dbConnection.collection(slugName);

    // Get the specific entry
    const entry = await collection.findOne({ _id: new ObjectId(entryId) });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Get position in collection for navigation
    const allEntries = await collection.find({})
      .sort({ createdAt: 1 })
      .project({ _id: 1 })
      .toArray();

    const currentIndex = allEntries.findIndex(e => e._id.toString() === entryId);
    const previousEntry = currentIndex > 0 ? allEntries[currentIndex - 1] : null;
    const nextEntry = currentIndex < allEntries.length - 1 ? allEntries[currentIndex + 1] : null;

    return {
      entry,
      navigation: {
        current: currentIndex + 1,
        total: allEntries.length,
        previous: previousEntry?._id,
        next: nextEntry?._id
      }
    };
  }

  // Need to inject FormProcessorService for Excel upload
  private formProcessorService: any;

  setFormProcessorService(formProcessorService: any) {
    this.formProcessorService = formProcessorService;
  }
}