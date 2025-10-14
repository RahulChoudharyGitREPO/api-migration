import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { ThematicArea, ThematicAreaSchema } from './thematic-area.schema';
import { CreateThematicAreaDto, ListThematicAreaDto } from './dto/thematic-area.dto';
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
export class ThematicAreaService {
  private getThematicAreaModel(dbConnection: Connection): Model<ThematicArea> {
    // Register User model for population
    if (!dbConnection.models['users']) {
      dbConnection.model('users', UserSchema, 'users');
    }
    return dbConnection.model<ThematicArea>('thematicareas', ThematicAreaSchema, 'thematicareas');
  }

  async create(dbConnection: Connection, createDto: CreateThematicAreaDto, userId: string): Promise<any> {
    const ThematicAreaModel = this.getThematicAreaModel(dbConnection);

    // Validate schema
    const { isValid, error } = validateSchemaFormat(createDto.schema);
    if (!isValid) {
      throw new ConflictException(`Schema validation failed: ${error}`);
    }

    try {
      const result = await ThematicAreaModel.create({
        ...createDto,
        createdBy: userId,
      });

      return { success: true, data: result };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('ThematicArea name already exists.');
      }
      throw error;
    }
  }

  async list(dbConnection: Connection, listDto: ListThematicAreaDto): Promise<any> {
    const ThematicAreaModel = this.getThematicAreaModel(dbConnection);
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
    ];

    const matchCriteria: any = {};

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      matchCriteria.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    if (Object.keys(matchCriteria).length > 0) {
      query.push({ $match: matchCriteria });
    }

    // Get total count
    const totalCountPipeline = [...query, { $count: 'totalItems' }];
    const countResult = await ThematicAreaModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Build sort
    const sorts: any = {};
    sorts[sort] = sortby === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Get paginated results
    const result = await ThematicAreaModel.aggregate([
      ...query,
      { $sort: sorts },
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data: result,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages,
      },
    };
  }

  async getDetails(dbConnection: Connection, id: string): Promise<any> {
    const ThematicAreaModel = this.getThematicAreaModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new ConflictException('Invalid ID format!');
    }

    const data = await ThematicAreaModel.findById(id);

    if (!data) {
      throw new NotFoundException('ThematicArea not found!');
    }

    return { success: true, data };
  }
}
