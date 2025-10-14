import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Form } from './schemas/form.schema';
import { CreateFormDto, UpdateFormDto, GenerateFormDto } from './dto/form.dto';
import { GetEntriesDto, UpdateWorkflowStepDto } from './dto/form-submission.dto';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { defaults, normalizeSchema } from './utils/elements';

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

  async saveForm(dbConnection: Connection, createFormDto: CreateFormDto, userId: string): Promise<any> {
    // Use native MongoDB collection to bypass Mongoose property mapping issues
    const collection = dbConnection.collection('forms');

    // Build update object with exact database field names
    const updateData: any = {
      slug: createFormDto.slug,
      title: createFormDto.title,
      schema: createFormDto.schema,  // Direct DB field name
      columnsPerPage: createFormDto.columnsPerPage,
      status: createFormDto.status || 'active',
      favorite: createFormDto.favorite || [],
      sharedWith: createFormDto.sharedWith || [],
      layoutSelections: createFormDto.layoutSelections || [],
      published: createFormDto.published !== undefined ? createFormDto.published : false,
      isDraft: createFormDto.isDraft !== undefined ? createFormDto.isDraft : false,
      workflows: createFormDto.workflows || [],
      projects: createFormDto.projects || [],
      _properties: createFormDto._properties || {},
      createdBy: userId,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    // Use native findOneAndUpdate to ensure schema field is saved correctly
    const result = await collection.findOneAndUpdate(
      { slug: createFormDto.slug },
      {
        $set: updateData,
        $setOnInsert: { createdAt: new Date() },
        $unset: { formSchema: "" }  // Remove old formSchema field if it exists
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    // Clean up response - remove formSchema if it exists
    if (result && result.formSchema !== undefined) {
      delete result.formSchema;
    }

    return result;
  }

  async generateForm(dbConnection: Connection, generateFormDto: GenerateFormDto): Promise<any> {
    try {
      const { prompt } = generateFormDto;

      if (!prompt) {
        throw new Error('Missing prompt');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
You are a form generator.
Generate a JSON array of form elements based on the user's requirements. Each element should be an object with a "type" and "properties". Use the following default properties for each type:
${JSON.stringify(defaults, null, 2)}

Rules:
- The response MUST be a JSON array: [ { ... }, { ... } ].
- You are free to change text, lable, name, required and defaultValue properties as per the user's requirement.
        `,
          },
          {
            role: 'user',
            content: `Generate a form with the following requirement: ${prompt}`,
          },
        ],
        temperature: 0.2,
      });

      const formSchema = response.choices[0]?.message?.content;
      if (!formSchema) {
        throw new Error('No schema generated');
      }

      // Try parsing JSON (ChatGPT might wrap it in markdown)
      const parsedSchema = JSON.parse(
        formSchema.replace(/```json|```/g, '').trim()
      );

      const cleanSchema = normalizeSchema(parsedSchema);

      return { cleanSchema, parsedSchema };
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error(`Invalid JSON schema generated: ${error.message}`);
      }
      throw new Error(`Failed to generate form: ${error.message}`);
    }
  }

  async loadForm(dbConnection: Connection, slug: string): Promise<any> {
    // Use native MongoDB collection to bypass Mongoose property mapping
    const collection = dbConnection.collection('forms');

    // Find form by slug
    const form = await collection.findOne({ slug });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Clean up response - remove formSchema if it exists
    if (form.formSchema !== undefined) {
      delete form.formSchema;
    }

    return form;
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

    console.log('Forms List Debug - User ID:', userId);
    console.log('Forms List Debug - Options:', options);

    // Get user info
    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findById(userId);
    const userRole = user?.role;
    const isSuperAdmin = userRole === 'SuperAdmin';

    console.log('Forms List Debug - User Role:', userRole, 'Is SuperAdmin:', isSuperAdmin);

    // Convert userId to ObjectId like Express does
    const userObjectId = new Types.ObjectId(userId);

    // Build basic query for forms - Match Express logic exactly
    const query: any = {};

    // Match Express permission logic exactly
    if (favoriteOnly) {
      // Express: query.favorite = { $in: [userObjectId] };
      query.favorite = { $in: [userObjectId] };
    } else if (sharedOnly) {
      // Express: query.sharedWith = { $in: [userObjectId] };
      // But sharedWith has nested structure: [{user: ObjectId, canEdit: bool, canCreate: bool}]
      query['sharedWith.user'] = { $in: [userObjectId] };
    } else if (!isSuperAdmin && !filledOnly && !draftsOnly && !status) {
      // Express: apply normal permissions only when no specific filters
      query.$or = [
        { createdBy: userObjectId },
        { 'sharedWith.user': userObjectId }
      ];
    }

    if (projectId) {
      query.projects = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ]
      };

      if (query.$or) {
        // Combine with existing $or
        query.$and = [
          { $or: query.$or },
          searchQuery
        ];
        delete query.$or;
      } else {
        Object.assign(query, searchQuery);
      }
    }

    console.log('Forms List Debug - Final Query:', JSON.stringify(query, null, 2));

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

    console.log('Forms List Debug - Found forms count:', forms.length);
    if (forms.length > 0) {
      console.log('Forms List Debug - First form sample:', {
        _id: forms[0]._id,
        title: forms[0].title,
        slug: forms[0].slug,
        createdBy: forms[0].createdBy,
        status: forms[0].status
      });
    }

    // Process forms and add computed fields
    const processedForms = await Promise.all(forms.map(async (form) => {
      // Calculate page count
      const pageCount = form.formSchema ? form.formSchema.length : 1;

      // Check if user has favorited this form - match Express logic
      const isFavorite = form.favorite && form.favorite.some((fav: any) => {
        const favId = fav._id || fav;
        return favId.toString() === userId;
      });
      const favoriteCount = form.favorite ? form.favorite.length : 0;
      const favoriteIds = form.favorite || [];

      // Check if shared with user - handle nested structure
      const isSharedWithMe = form.sharedWith && form.sharedWith.some((item: any) => {
        if (typeof item === 'object' && item.user) {
          // Handle populated user object or ObjectId
          const itemUserId = item.user._id || item.user;
          return itemUserId.toString() === userId;
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
        schema: form.formSchema,
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
    // Check if model already exists with the correct name
    if (dbConnection.models['users']) {
      return dbConnection.models['users'];
    }

    // Create the model with the same pattern as other services (matching Express)
    const userSchema = require('../auth/schemas/user.schema').UserSchema;
    return dbConnection.model('users', userSchema, 'users');
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
  ): Promise<any> {
    const { page = '1', limit = '10', search, filters, sortField, sortOrder, isDraft, projectName } = getEntriesDto;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get form with project details using aggregation (matches Express)
    const result = await dbConnection.collection('forms').aggregate([
      { $match: { slug } },
      {
        $lookup: {
          from: 'projects',
          localField: 'projects',
          foreignField: '_id',
          as: 'projectDetails',
        },
      },
    ]).toArray();

    const form = result[0];

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const slugName = projectName && projectName.trim() !== 'null'
      ? `${slug}_${this.sanitize(projectName)}`
      : slug;

    const collection = dbConnection.collection(slugName);

    // Build MongoDB query (match Express)
    const mongoQuery: any = {};

    if (isDraft) {
      mongoQuery.isDraft = true;
    } else {
      mongoQuery.isDraft = { $in: [false, null] };
    }

    // Apply filters (match Express)
    if (filters) {
      Object.entries(filters).forEach(([key, condition]: [string, any]) => {
        const { value, matchMode } = condition;
        if (value === null || value === undefined || value === '') return;

        switch (matchMode) {
          case 'contains':
          case 'startsWith':
          case 'endsWith': {
            let regexPattern = value;
            if (matchMode === 'startsWith') regexPattern = `^${value}`;
            else if (matchMode === 'endsWith') regexPattern = `${value}$`;
            mongoQuery[key] = { $regex: regexPattern, $options: 'i' };
            break;
          }
          case 'equals':
          case 'dateIs':
            mongoQuery[key] = value;
            break;
          default:
            break;
        }
      });
    }

    const sortOptions = sortField ? { [sortField]: parseInt(sortOrder || '1') } : {};

    // Build history lookups (match Express)
    const historyLookups: any[] = [];
    if (form.schema && Array.isArray(form.schema)) {
      form.schema.forEach((page: any) => {
        if (!Array.isArray(page.elements)) return;

        page.elements.forEach((field: any) => {
          if (field.type === 'History' && field.properties?.label) {
            const originalFieldKey = field.properties.label;
            const transformedFieldKey = field.properties.label
              .replace(/\s+/g, '_')
              .toLowerCase();

            const refCollection = `${slugName}_${transformedFieldKey}`;

            historyLookups.push(
              {
                $lookup: {
                  from: refCollection,
                  localField: originalFieldKey,
                  foreignField: '_id',
                  as: `${originalFieldKey}_populated`,
                },
              },
              {
                $addFields: {
                  [originalFieldKey]: {
                    $map: {
                      input: `$${originalFieldKey}_populated`,
                      as: 'historyItem',
                      in: {
                        $mergeObjects: [
                          '$$historyItem',
                          {
                            _displayValue: {
                              $concat: [
                                'Created: ',
                                {
                                  $dateToString: {
                                    date: '$$historyItem.createdAt',
                                    format: '%Y-%m-%d %H:%M',
                                  },
                                },
                                ' | ID: ',
                                { $toString: '$$historyItem._id' },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unset: `${originalFieldKey}_populated`,
              }
            );
          }
        });
      });
    }

    // Use aggregation pipeline (match Express)
    const pipeline = [
      { $match: mongoQuery },
      ...historyLookups,
      ...(Object.keys(sortOptions).length > 0 ? [{ $sort: sortOptions }] : []),
      { $skip: skip },
      { $limit: limitNum },
    ];

    const [data, total] = await Promise.all([
      collection.aggregate(pipeline).toArray(),
      collection.countDocuments(mongoQuery),
    ]);

    // Generate columns schema (match Express exactly)
    const columns = form.schema.flatMap((page: any) => {
      if (!Array.isArray(page.elements)) return [];

      return page.elements.flatMap((field: any) => {
        if (!field) return [];

        const processField = (f: any) => {
          const label = f?.properties?.label;
          const fieldKey = label
            ? label.replace(/\s+/g, '_').toLowerCase()
            : `field_${f.id}`;

          const baseColumn = {
            field: fieldKey,
            type: f.type || 'text',
            page: page.page || 1,
            label: label || `Field ${f.id}`,
            id: f.id,
            ...f.properties,
          };

          // Add cascade labelFields as extra columns
          const cascadeColumns: any[] = [];
          const optsSrc = f.properties?.optionsSource;
          if (optsSrc?.isCascade && Array.isArray(optsSrc.labelFields)) {
            optsSrc.labelFields.forEach((labelField: string) => {
              const cascadeFieldKey = labelField
                .replace(/\s+/g, '_')
                .toLowerCase();
              cascadeColumns.push({
                field: cascadeFieldKey,
                type: 'text',
                page: page.page || 1,
                label: labelField,
                isCascade: true,
              });
            });
          }

          return [baseColumn, ...cascadeColumns];
        };

        // Handle Box type with children
        if (field.type === 'Box' && Array.isArray(field.children)) {
          return field.children
            .filter((child: any) => child.type !== 'Title' && child.type !== 'Spacer')
            .flatMap(processField);
        }

        // Skip title and spacer fields
        if (field.type === 'Title' || field.type === 'Spacer') return [];

        return processField(field);
      });
    });

    // Get project status (match Express)
    const project = Array.isArray(form?.projectDetails) &&
      form?.projectDetails?.length !== 0 &&
      form?.projectDetails.find((p: any) => p.projectName === projectName);

    const status = project?.status;

    // Match Express response format exactly
    return {
      data,
      schema: columns,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
      },
      projectStatus: status?.toString(),
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
    // Use native MongoDB collection
    const collection = dbConnection.collection('forms');

    const form = await collection.findOne({ slug });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // In Express, workflowData is the entire workflows array, not a single workflow
    // Update form by replacing the entire workflows array
    const result = await collection.findOneAndUpdate(
      { slug },
      { $set: { workflows: workflowData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new NotFoundException('Form not found');
    }

    return result;
  }

  async updateLayout(dbConnection: Connection, identifier: string, layoutSelections: any[], userId: string): Promise<any> {
    // Use native MongoDB collection
    const collection = dbConnection.collection('forms');

    // Determine if identifier is an ObjectId or slug
    let query: any = {};

    if (Types.ObjectId.isValid(identifier)) {
      query._id = new Types.ObjectId(identifier);
    } else {
      query.slug = identifier;
    }

    // Update layout selections using native MongoDB
    const result = await collection.findOneAndUpdate(
      query,
      { $set: { layoutSelections, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new NotFoundException('Form not found');
    }

    return {
      _id: result._id,
      slug: result.slug,
      title: result.title,
      layoutSelections: result.layoutSelections,
      updatedAt: result.updatedAt,
    };
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
    const allFields = (form.formSchema || []).flatMap((page: any) => page.elements || []);
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
    const allFields = (form.formSchema || []).flatMap((page: any) => page.elements || []);
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

    // Get form with project details using aggregation (matches Express)
    const result = await dbConnection.collection('forms').aggregate([
      { $match: { slug } },
      {
        $lookup: {
          from: 'projects',
          localField: 'projects',
          foreignField: '_id',
          as: 'projectDetails',
        },
      },
    ]).toArray();

    const form = result[0];

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Get project status
    const projectObj = Array.isArray(form?.projectDetails) &&
      form?.projectDetails?.length !== 0 &&
      form?.projectDetails.find((p: any) => p.projectName === project);

    const status = projectObj?.status;

    // Build history lookups (match Express)
    const historyLookups: any[] = [];
    if (form.schema && Array.isArray(form.schema)) {
      form.schema.forEach((page: any) => {
        if (!Array.isArray(page.elements)) return;

        page.elements.forEach((field: any) => {
          if (field.type === 'History' && field.properties?.label) {
            const originalFieldKey = field.properties.label;
            const transformedFieldKey = field.properties.label
              .replace(/\s+/g, '_')
              .toLowerCase();

            const refCollection = `${slugName}_${transformedFieldKey}`;

            historyLookups.push(
              {
                $lookup: {
                  from: refCollection,
                  localField: originalFieldKey,
                  foreignField: '_id',
                  as: `${originalFieldKey}_populated`,
                },
              },
              {
                $addFields: {
                  [originalFieldKey]: {
                    $map: {
                      input: `$${originalFieldKey}_populated`,
                      as: 'historyItem',
                      in: {
                        $mergeObjects: [
                          '$$historyItem',
                          {
                            _displayValue: {
                              $concat: [
                                'Created: ',
                                {
                                  $dateToString: {
                                    date: '$$historyItem.createdAt',
                                    format: '%Y-%m-%d %H:%M',
                                  },
                                },
                                ' | ID: ',
                                { $toString: '$$historyItem._id' },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unset: `${originalFieldKey}_populated`,
              }
            );
          }
        });
      });
    }

    // Get entry with history fields populated
    const entryPipeline = [
      { $match: { _id: new ObjectId(entryId) } },
      ...historyLookups,
    ];

    const collection = dbConnection.collection(slugName);
    const entryResult = await collection.aggregate(entryPipeline).toArray();
    const entry = entryResult[0];

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Create flattened schema (match Express)
    const flattenedSchema: any[] = [];
    form.schema.forEach((page: any, pageIndex: number) => {
      if (page.elements && Array.isArray(page.elements)) {
        page.elements.forEach((element: any) => {
          if (element.type === 'Box' && Array.isArray(element.children)) {
            element.children.forEach((child: any) => {
              flattenedSchema.push({
                ...child,
                page: pageIndex + 1,
              });
            });
          } else {
            flattenedSchema.push({
              ...element,
              page: pageIndex + 1,
            });
          }
        });
      }
    });

    // Create field schema map
    const fieldSchemaMap: any = {};
    flattenedSchema.forEach((field: any) => {
      if (!field) return;

      const label = field?.properties?.label;
      if (label) {
        fieldSchemaMap[label] = {
          type: field.type,
          schemaType: field.schemaType,
          fieldId: field.id,
          required: field.required || field.properties?.required || false,
          properties: field.properties || {},
          page: field.page || 1,
        };

        // Also map variations of the field name
        const normalizedLabel = label.toLowerCase().replace(/\s+/g, '_');
        fieldSchemaMap[normalizedLabel] = fieldSchemaMap[label];
      }
    });

    // Process entry and add type information
    const processedEntry: any = { ...entry };

    Object.keys(processedEntry).forEach((fieldName) => {
      if (
        fieldName !== '_id' &&
        fieldName !== 'createdAt' &&
        fieldName !== 'updatedAt' &&
        fieldName !== '__v'
      ) {
        const schemaInfo = fieldSchemaMap[fieldName];

        if (schemaInfo) {
          // If the field value is an object, preserve it but add metadata
          if (
            typeof processedEntry[fieldName] === 'object' &&
            processedEntry[fieldName] !== null &&
            !Array.isArray(processedEntry[fieldName])
          ) {
            processedEntry[fieldName] = {
              ...processedEntry[fieldName],
              _metadata: {
                type: schemaInfo.type,
                schemaType: schemaInfo.schemaType,
                fieldId: schemaInfo.fieldId,
                required: schemaInfo.required,
                page: schemaInfo.page,
                label: fieldName,
              },
            };
          } else {
            // For primitive values, create an object with value and metadata
            processedEntry[fieldName] = {
              value: processedEntry[fieldName],
              type: schemaInfo.type,
              schemaType: schemaInfo.schemaType,
              fieldId: schemaInfo.fieldId,
              required: schemaInfo.required,
              page: schemaInfo.page,
              label: fieldName,
              properties: schemaInfo.properties,
            };

            // Handle cascade fields
            if (
              schemaInfo.properties?.optionsSource?.isCascade &&
              schemaInfo.properties?.optionsSource?.labelFields?.length
            ) {
              schemaInfo.properties.optionsSource.labelFields.forEach(
                (labelField: string) => {
                  if (entry[labelField] !== undefined) {
                    processedEntry[labelField] = {
                      value: entry[labelField],
                      type: 'Input',
                      schemaType: 'text',
                      fieldId: schemaInfo.fieldId,
                      required: false,
                      page: schemaInfo.page,
                      label: labelField,
                      properties: {},
                    };
                  }
                }
              );
            }
          }
        }
      }
    });

    // Extract titles from schema
    const titlesFromSchema: any = {};
    let titleCounter = 0;

    form.schema.forEach((page: any, pageIndex: number) => {
      const pageNumber = pageIndex + 1;

      if (page.elements && Array.isArray(page.elements)) {
        page.elements.forEach((element: any, elementIndex: number) => {
          if (element.type === 'Title') {
            titleCounter++;
            const titleKey = titleCounter === 1 ? 'title' : `title_${titleCounter}`;

            titlesFromSchema[titleKey] = {
              value: element.properties?.text || 'Untitled',
              type: 'Title',
              schemaType: null,
              fieldId: element.id,
              required: false,
              page: pageNumber,
              label: `Title ${titleCounter}`,
              order: titleCounter,
              elementIndex: elementIndex,
              properties: {
                text: element.properties?.text || 'Untitled',
                alignment: element.properties?.alignment || 'left',
                color: element.properties?.color || '#000000',
                fontSize: element.properties?.fontSize || 16,
                fontWeight: element.properties?.fontWeight || 'normal',
              },
            };
          }
        });
      }
    });

    // Create ordered entry (match Express)
    const orderedEntry: any = {};

    // First add system fields
    orderedEntry._id = processedEntry._id;

    // Then add fields in schema order (including titles)
    form.schema.forEach((page: any) => {
      if (page.elements && Array.isArray(page.elements)) {
        page.elements.forEach((element: any) => {
          if (element.type === 'Title') {
            // Add title in order
            const titleKey = Object.keys(titlesFromSchema).find(
              (key) => titlesFromSchema[key].fieldId === element.id
            );
            if (titleKey && titlesFromSchema[titleKey]) {
              orderedEntry[titleKey] = titlesFromSchema[titleKey];
            }
          } else if (element.type !== 'Spacer' && element.type !== 'Button') {
            // Add regular fields in order
            const label = element?.properties?.label;
            if (label && processedEntry[label]) {
              orderedEntry[label] = processedEntry[label];
            }
            const isCascade =
              element?.properties?.optionsSource?.isCascade &&
              element?.properties?.optionsSource?.labelFields?.length;
            if (isCascade) {
              // Include cascade label fields if they exist in the entry
              element.properties.optionsSource.labelFields.forEach(
                (labelField: string) => {
                  if (processedEntry[labelField]) {
                    orderedEntry[labelField] = processedEntry[labelField];
                  }
                }
              );
            }
          }
        });
      }
    });

    // Finally add remaining system fields
    orderedEntry.createdAt = processedEntry.createdAt;
    orderedEntry.updatedAt = processedEntry.updatedAt;
    orderedEntry.createdBy = processedEntry.createdBy;
    orderedEntry.updatedBy = processedEntry.updatedBy;
    orderedEntry.workFlowSteps = processedEntry.workFlowSteps;
    orderedEntry.__v = processedEntry.__v;

    // Get navigation info
    const allEntries = await collection.find({})
      .sort({ createdAt: 1 })
      .project({ _id: 1 })
      .toArray();

    const currentIndex = allEntries.findIndex(e => e._id.toString() === entryId);
    const nextEntry = currentIndex < allEntries.length - 1 ? allEntries[currentIndex + 1] : null;

    return {
      entry: orderedEntry,
      navigation: {
        current: currentIndex + 1,
        total: allEntries.length,
        next: nextEntry?._id
      },
      status: status?.toString() || null,
    };
  }

  // Need to inject FormProcessorService for Excel upload
  private formProcessorService: any;

  setFormProcessorService(formProcessorService: any) {
    this.formProcessorService = formProcessorService;
  }
}