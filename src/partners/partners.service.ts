import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Partner, PartnerSchema } from './schemas/partner.schema';
import { CreatePartnerDto, UpdatePartnerDto, PartnerListDto } from './dto/partner.dto';
import { validateSchemaFormat } from '../common/utils/schema-validator';

@Injectable()
export class PartnersService {

  private getPartnerModel(dbConnection: Connection): Model<Partner> {
    if (dbConnection.models.partners) {
      return dbConnection.models.partners;
    }
    return dbConnection.model<Partner>('partners', PartnerSchema, 'partners');
  }

  async createPartner(dbConnection: Connection, createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const PartnerModel = this.getPartnerModel(dbConnection);

    const { schema = [] } = createPartnerDto;

    // Validate schema format
    const { isValid, error } = validateSchemaFormat(schema);
    if (!isValid) {
      throw new BadRequestException(`Schema validation failed: ${error}`);
    }

    try {
      const result = await PartnerModel.create(createPartnerDto);
      return result;
    } catch (err: any) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        if (err?.keyPattern?.partnerCode) {
          throw new ConflictException('Partner code already exists.');
        }
        throw new ConflictException('Partner name already exists.');
      }
      throw err;
    }
  }

  async listPartners(dbConnection: Connection, partnerListDto: PartnerListDto): Promise<any> {
    const PartnerModel = this.getPartnerModel(dbConnection);
    const { page = 1, limit = 10, type, status, search } = partnerListDto;

    const query: any[] = [];
    const matchCriteria: any = {};

    if (type) matchCriteria.type = type;
    if (status) matchCriteria.status = status;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchCriteria.$or = [
        { name: { $regex: searchRegex } },
        { partnerName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { contactNumber: { $regex: searchRegex } },
      ];
    }

    if (Object.keys(matchCriteria).length > 0) {
      query.push({ $match: matchCriteria });
    }

    // Get total count
    const totalCountPipeline = [...query, { $count: 'totalItems' }];
    const countResult = await PartnerModel.aggregate(totalCountPipeline);
    const totalItems = countResult[0] ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated results
    const skip = (page - 1) * limit;
    const result = await PartnerModel.aggregate([
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

  async updatePartner(dbConnection: Connection, updatePartnerDto: UpdatePartnerDto): Promise<Partner> {
    const PartnerModel = this.getPartnerModel(dbConnection);
    const { id, schema = [], ...updateData } = updatePartnerDto;

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format!');
    }

    // Validate schema format
    const { isValid, error } = validateSchemaFormat(schema);
    if (!isValid) {
      throw new BadRequestException(`Schema validation failed: ${error}`);
    }

    try {
      const result = await PartnerModel.findByIdAndUpdate(
        id,
        { ...updateData, schema },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('Partner not found!');
      }

      return result;
    } catch (err: any) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        if (err?.keyPattern?.partnerCode) {
          throw new ConflictException('Partner code already exists.');
        }
        throw new ConflictException('Partner name already exists.');
      }
      throw err;
    }
  }

  async getPartnerDetails(dbConnection: Connection, id: string): Promise<Partner> {
    const PartnerModel = this.getPartnerModel(dbConnection);

    const data = await PartnerModel.findById(id);

    if (!data) {
      throw new NotFoundException('Partner not found!');
    }

    return data;
  }
}
