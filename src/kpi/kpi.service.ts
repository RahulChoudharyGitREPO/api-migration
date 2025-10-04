import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Kpi, KpiSchema } from './schemas/kpi.schema';
import { CreateKpiDto, KpiListDto } from './dto/kpi.dto';
import { validateSchemaFormat } from '../common/utils/schema-validator';

@Injectable()
export class KpiService {

  private getKpiModel(dbConnection: Connection): Model<Kpi> {
    if (dbConnection.models.kpis) {
      return dbConnection.models.kpis;
    }
    return dbConnection.model<Kpi>('kpis', KpiSchema, 'kpis');
  }

  async createKpi(dbConnection: Connection, createKpiDto: CreateKpiDto): Promise<Kpi> {
    const KpiModel = this.getKpiModel(dbConnection);

    const { name, category, progress, status, description, schema = [] } = createKpiDto;

    if (!(name && category && progress && status && description && schema)) {
      throw new BadRequestException('name, category, progress, status, description, schema are required!');
    }

    if (typeof progress !== 'number') {
      throw new BadRequestException('progress should be number!');
    }

    const { isValid, error } = validateSchemaFormat(schema);

    if (!isValid) {
      throw new BadRequestException(`Schema validation failed: ${error}`);
    }

    try {
      const result = await KpiModel.create(createKpiDto);
      return result;
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new ConflictException('Kpi name already exists.');
      }
      throw err;
    }
  }

  async listKpis(dbConnection: Connection, kpiListDto: KpiListDto): Promise<any> {
    const KpiModel = this.getKpiModel(dbConnection);
    const { page = 1, limit = 10, status, category, search } = kpiListDto;

    const query: any[] = [];
    const matchCriteria: any = {};

    if (status) matchCriteria.status = status;
    if (category) matchCriteria.category = category;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchCriteria.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    if (Object.keys(matchCriteria).length > 0) {
      query.push({ $match: matchCriteria });
    }

    const totalCountPipeline = [...query, { $count: 'totalItems' }];

    const countResult = await KpiModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    const skip = (page - 1) * limit;

    const result = await KpiModel.aggregate([
      ...query,
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data: result,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async getKpiDetails(dbConnection: Connection, id: string): Promise<Kpi> {
    const KpiModel = this.getKpiModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format!');
    }

    const data = await KpiModel.findById(id);

    if (!data) {
      throw new NotFoundException('Kpi not found!');
    }

    return data;
  }
}
