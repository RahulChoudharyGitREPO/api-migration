import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Framework, FrameworkSchema } from './framework.schema';
import { CreateFrameworkDto, UpdateFrameworkDto, ListFrameworkDto } from './dto/framework.dto';

// Schema validation utility (reused from partners/programs)
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
export class FrameworkService {
  private getFrameworkModel(dbConnection: Connection): Model<Framework> {
    return dbConnection.model<Framework>('frameworks', FrameworkSchema, 'frameworks');
  }

  async create(dbConnection: Connection, createDto: CreateFrameworkDto): Promise<any> {
    const FrameworkModel = this.getFrameworkModel(dbConnection);

    // Sort hierarchy by id
    if (createDto.hierarchy && Array.isArray(createDto.hierarchy)) {
      createDto.hierarchy.sort((a, b) => a.id - b.id);
    }

    // Validate schema if provided
    if (createDto.schema && createDto.schema.length > 0) {
      const { isValid, error } = validateSchemaFormat(createDto.schema);
      if (!isValid) {
        throw new ConflictException(`Schema validation failed: ${error}`);
      }
    }

    try {
      const result = await FrameworkModel.create(createDto);
      return { success: true, data: result };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Framework name already exists.');
      }
      throw error;
    }
  }

  async update(dbConnection: Connection, updateDto: UpdateFrameworkDto): Promise<any> {
    const FrameworkModel = this.getFrameworkModel(dbConnection);

    // Sort hierarchy by id
    if (updateDto.hierarchy && Array.isArray(updateDto.hierarchy)) {
      updateDto.hierarchy.sort((a, b) => a.id - b.id);
    }

    // Validate schema if provided
    if (updateDto.schema && updateDto.schema.length > 0) {
      const { isValid, error } = validateSchemaFormat(updateDto.schema);
      if (!isValid) {
        throw new ConflictException(`Schema validation failed: ${error}`);
      }
    }

    try {
      const result = await FrameworkModel.findByIdAndUpdate(
        updateDto.id,
        {
          name: updateDto.name,
          hierarchy: updateDto.hierarchy,
          schema: updateDto.schema,
          schemaValues: updateDto.schemaValues,
        },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('Framework not found!');
      }

      return { success: true, data: result };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Framework name already exists.');
      }
      throw error;
    }
  }

  async list(dbConnection: Connection, listDto: ListFrameworkDto): Promise<any> {
    const FrameworkModel = this.getFrameworkModel(dbConnection);
    const {
      page = 1,
      limit = 10,
      sort = 'updatedAt',
      sortby = 'desc',
      search,
    } = listDto;

    const query: any[] = [];
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
    const countResult = await FrameworkModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Build sort
    const sorts: any = {};
    sorts[sort] = sortby === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Get paginated results
    const result = await FrameworkModel.aggregate([
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
    const FrameworkModel = this.getFrameworkModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new ConflictException('Invalid ID format!');
    }

    const result = await FrameworkModel.findById(id);

    if (!result) {
      throw new NotFoundException('Framework not found!');
    }

    return { data: result };
  }
}
