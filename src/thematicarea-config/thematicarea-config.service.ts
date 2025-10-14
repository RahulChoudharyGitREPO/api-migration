import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { ThematicareaConfig, ThematicareaConfigSchema } from './thematicarea-config.schema';
import { CreateThematicareaConfigDto, UpdateThematicareaConfigDto, ListThematicareaConfigDto } from './dto/thematicarea-config.dto';
import { UserSchema } from '../auth/schemas/user.schema';

// Schema validation utility
function validateSchemaFormat(schema: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(schema)) {
    return { isValid: false, error: 'Schema must be an array' };
  }

  for (const item of schema) {
    if (!item.key || typeof item.key !== 'string') {
      return { isValid: false, error: 'Each schema item must have a "key" property' };
    }
    if (!item.type || typeof item.type !== 'string') {
      return { isValid: false, error: 'Each schema item must have a "type" property' };
    }
  }

  return { isValid: true };
}

@Injectable()
export class ThematicareaConfigService {
  private getThematicareaConfigModel(dbConnection: Connection): Model<ThematicareaConfig> {
    // Register User model for population
    if (!dbConnection.models['users']) {
      dbConnection.model('users', UserSchema, 'users');
    }
    return dbConnection.model<ThematicareaConfig>('thematicareaconfigurations', ThematicareaConfigSchema, 'thematicareaconfigurations');
  }

  async create(dbConnection: Connection, createDto: CreateThematicareaConfigDto, userId: string): Promise<any> {
    const ThematicareaConfigModel = this.getThematicareaConfigModel(dbConnection);

    // Validate schema
    const { isValid, error } = validateSchemaFormat(createDto.schema);
    if (!isValid) {
      throw new ConflictException(`Schema validation failed: ${error}`);
    }

    const result = await ThematicareaConfigModel.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return { success: true, data: result };
  }

  async update(dbConnection: Connection, updateDto: UpdateThematicareaConfigDto, userId: string): Promise<any> {
    const ThematicareaConfigModel = this.getThematicareaConfigModel(dbConnection);

    // Validate schema
    const { isValid, error } = validateSchemaFormat(updateDto.schema);
    if (!isValid) {
      throw new ConflictException(`Schema validation failed: ${error}`);
    }

    const result = await ThematicareaConfigModel.findByIdAndUpdate(
      updateDto.id,
      { schema: updateDto.schema, updatedBy: userId },
      { new: true }
    );

    if (!result) {
      throw new NotFoundException('ThematicareaConfig not found!');
    }

    return { success: true, data: result };
  }

  async list(dbConnection: Connection, listDto: ListThematicareaConfigDto): Promise<any> {
    const ThematicareaConfigModel = this.getThematicareaConfigModel(dbConnection);
    const {
      page = 1,
      limit = 10,
      search,
      sort = 'updatedAt',
      sortby = 'desc',
    } = listDto;

    const query: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'updatedBy',
          foreignField: '_id',
          as: 'updatedBy',
        },
      },
      { $unwind: { path: '$updatedBy', preserveNullAndEmptyArrays: true } },
    ];

    const matchCriteria: any = {};

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      matchCriteria.$or = [{ name: { $regex: searchRegex } }];
    }

    if (Object.keys(matchCriteria).length > 0) {
      query.push({ $match: matchCriteria });
    }

    // Get total count
    const totalCountPipeline = [...query, { $count: 'totalItems' }];
    const countResult = await ThematicareaConfigModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Build sort
    const sorts: any = {};
    sorts[sort] = sortby === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Get paginated results
    const result = await ThematicareaConfigModel.aggregate([
      ...query,
      { $sort: sorts },
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data: result,
      pagination: { page, limit, total: totalItems, totalPages },
    };
  }

  async getDetails(dbConnection: Connection, id: string): Promise<any> {
    const ThematicareaConfigModel = this.getThematicareaConfigModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new ConflictException('Invalid ID format!');
    }

    const result = await ThematicareaConfigModel.findById(id).populate(['createdBy', 'updatedBy']);

    if (!result) {
      throw new NotFoundException('ThematicareaConfig not found!');
    }

    return { data: result };
  }
}
