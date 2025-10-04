import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Program, ProgramSchema } from './schemas/program.schema';
import { CreateProgramDto, ProgramListDto } from './dto/program.dto';
import { validateSchemaFormat } from '../common/utils/schema-validator';

@Injectable()
export class ProgramsService {

  private getProgramModel(dbConnection: Connection): Model<Program> {
    if (dbConnection.models.programs) {
      return dbConnection.models.programs;
    }
    return dbConnection.model<Program>('programs', ProgramSchema, 'programs');
  }

  async createProgram(dbConnection: Connection, createProgramDto: CreateProgramDto): Promise<Program> {
    const ProgramModel = this.getProgramModel(dbConnection);

    const { name, budget, budgetUtilisation, thematicAreas, partnerName, status, description, schemaValues = {}, schema = [] } = createProgramDto;

    if (!(name && budget && budgetUtilisation && thematicAreas && partnerName && status && description && schema)) {
      throw new BadRequestException('name, budget, budgetUtilisation, thematicAreas, partnerName, status, description, schema are required!');
    }

    if (typeof budget !== 'number' || typeof budgetUtilisation !== 'number') {
      throw new BadRequestException('Budget, budget utilisation should be number!');
    }

    const { isValid, error } = validateSchemaFormat(schema);

    if (!isValid) {
      throw new BadRequestException(`Schema validation failed: ${error}`);
    }

    try {
      const result = await ProgramModel.create({
        name,
        budget,
        budgetUtilisation,
        thematicAreas,
        partnerName,
        status,
        description,
        schemaValues,
        schema,
      });

      return result;
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new ConflictException('Program name already exists.');
      }
      throw err;
    }
  }

  async listPrograms(dbConnection: Connection, programListDto: ProgramListDto): Promise<any> {
    const ProgramModel = this.getProgramModel(dbConnection);
    const { page = 1, limit = 10, sort = 'updatedAt', sortby = 'desc', status, search } = programListDto;

    const query: any[] = [];
    const matchCriteria: any = {};

    if (status) {
      matchCriteria.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchCriteria.$or = [
        { name: { $regex: searchRegex } },
        { partnerName: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    if (Object.keys(matchCriteria).length > 0) {
      query.push({ $match: matchCriteria });
    }

    const totalCountPipeline = [...query, { $count: 'totalItems' }];

    const countResult = await ProgramModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    const sorts: any = {};
    sorts[sort] = sortby === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const result = await ProgramModel.aggregate([
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

  async getProgramDetails(dbConnection: Connection, id: string): Promise<Program> {
    const ProgramModel = this.getProgramModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format!');
    }

    const program = await ProgramModel.findById(id);

    if (!program) {
      throw new NotFoundException('Program not found!');
    }

    return program;
  }
}
