import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { Profession, ProfessionSchema } from './schemas/profession.schema';
import { CreateProfessionDto, UpdateProfessionDto, ProfessionListDto, ProfessionListV2Dto } from './dto/profession.dto';
import { generateSearchRegex } from '../common/utils/search-regex';

@Injectable()
export class ProfessionService {
  private getProfessionModel(dbConnection: Connection): Model<Profession> {
    if (dbConnection.models.professions) {
      return dbConnection.models.professions;
    }
    return dbConnection.model<Profession>('professions', ProfessionSchema, 'professions');
  }

  async create(dbConnection: Connection, createDto: CreateProfessionDto): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const { name, description } = createDto;

    if (!name) {
      throw new BadRequestException('Profession name is required');
    }

    // Case-insensitive duplicate check
    const existing = await ProfessionModel.findOne({ name }).collation({ locale: 'en', strength: 2 });
    if (existing) {
      throw new ConflictException('Profession with this name already exists');
    }

    const newProfession = new ProfessionModel({ name, description });
    const savedProfession = await newProfession.save();

    return {
      message: 'Profession created successfully',
      data: savedProfession,
    };
  }

  async list(dbConnection: Connection): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const professions = await ProfessionModel.find({});
    return { data: professions };
  }

  async getDetails(dbConnection: Connection, id: string): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const profession = await ProfessionModel.findById(id);

    if (!profession) {
      throw new NotFoundException('Profession not found');
    }

    return {
      message: 'Profession details fetched successfully',
      data: profession,
    };
  }

  async listWithPagination(dbConnection: Connection, listDto: ProfessionListDto): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const { page = 1, limit = 10, search, sort = 'createdAt', sortby = 'desc' } = listDto;

    const filters: any[] = [];
    const sorts: any = {};

    if (search) {
      filters.push({ $match: { name: { $regex: search, $options: 'i' } } });
    }

    sorts[sort] = sortby === 'desc' ? -1 : 1;
    filters.push({ $sort: sorts });

    const totalPipeline = [...filters, { $count: 'total' }];
    const totalResult = await ProfessionModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    filters.push({ $skip: (page - 1) * limit });
    filters.push({ $limit: parseInt(limit as any) });

    const professions = await ProfessionModel.aggregate(filters);

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    };

    return { data: professions, pagination };
  }

  async listV2(dbConnection: Connection, listDto: ProfessionListV2Dto): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const { page = 1, limit = 10, filters = {}, search } = listDto;
    const sortField = listDto.sortField || 'createdAt';
    const sortOrder = listDto.sortOrder === 1 ? 1 : -1;

    const searchFilters: any[] = [];

    if (search) {
      const searchRegex = generateSearchRegex(search);
      searchFilters.push({ $match: { $or: [{ name: searchRegex }] } });
    }

    const matchStage: any = {};

    Object.keys(filters).forEach((field) => {
      const filter = filters[field];
      if (!filter.value) return;

      switch (filter.matchMode) {
        case 'startsWith':
          matchStage[field] = { $regex: `^${filter.value}`, $options: 'i' };
          break;
        case 'contains':
          matchStage[field] = { $regex: filter.value, $options: 'i' };
          break;
        case 'equals':
          matchStage[field] = filter.value;
          break;
        case 'dateIs':
          const date = new Date(filter.value);
          matchStage[field] = {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
          };
          break;
        default:
          break;
      }
    });

    const pipeline = [
      ...searchFilters,
      { $match: matchStage },
      { $sort: { [sortField]: sortOrder } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const totalRecords = await ProfessionModel.countDocuments(matchStage);
    const professions = await ProfessionModel.aggregate(pipeline);

    return {
      data: professions,
      pagination: {
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit),
        current: page,
        perPage: limit,
      },
    };
  }

  async update(dbConnection: Connection, id: string, updateDto: UpdateProfessionDto): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const { name } = updateDto;

    if (!name) {
      throw new BadRequestException('Profession name is required');
    }

    const updatedProfession = await ProfessionModel.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

    if (!updatedProfession) {
      throw new NotFoundException('Profession not found');
    }

    return {
      message: 'Profession updated successfully',
      data: updatedProfession,
    };
  }

  async delete(dbConnection: Connection, id: string): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const deletedProfession = await ProfessionModel.findByIdAndDelete(id);

    if (!deletedProfession) {
      throw new NotFoundException('Profession not found');
    }

    return {
      message: 'Profession deleted successfully',
      data: deletedProfession,
    };
  }

  async edit(dbConnection: Connection, id: string, updateDto: UpdateProfessionDto): Promise<any> {
    const ProfessionModel = this.getProfessionModel(dbConnection);
    const { name, description } = updateDto;

    const profession = await ProfessionModel.findById(id);
    if (!profession) {
      throw new NotFoundException('Profession not found');
    }

    if (name && name !== profession.name) {
      const existing = await ProfessionModel.findOne({ name }).collation({ locale: 'en', strength: 2 });
      if (existing) {
        throw new ConflictException('Profession with this name already exists');
      }
      profession.name = name;
    }

    if (description !== undefined) {
      profession.description = description;
    }

    const updatedProfession = await profession.save();

    return {
      message: 'Profession updated successfully',
      data: updatedProfession,
    };
  }
}
