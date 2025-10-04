import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Phc, PhcSchema } from './schemas/phc.schema';
import { CreatePhcDto, UpdatePhcDto, PhcListDto, PhcListV2Dto } from './dto/phc.dto';
import { generateSearchRegex } from '../common/utils/search-regex';

@Injectable()
export class PhcService {

  private getPhcModel(dbConnection: Connection): Model<Phc> {
    if (dbConnection.models.PhcCenter) {
      return dbConnection.models.PhcCenter;
    }
    return dbConnection.model<Phc>('PhcCenter', PhcSchema, 'phccenters');
  }

  async createPhc(dbConnection: Connection, createPhcDto: CreatePhcDto): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);
    const { name, location } = createPhcDto;

    if (!name) {
      throw new BadRequestException('Phc name is required');
    }

    const newPHC = new PhcModel({
      name,
      location: location || {},
    });

    const savedPHC = await newPHC.save();

    return {
      success: true,
      message: 'Phc Center created successfully',
      data: savedPHC,
    };
  }

  async listPhcs(dbConnection: Connection, listDto: PhcListDto): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);
    const { page = 1, limit = 10, name, state, district, taluk, panchayat, village, sort = 'name', sortDirection = 'asc' } = listDto;

    const query: any = { isActive: true };

    if (name) query.name = { $regex: name, $options: 'i' };
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (taluk) query['location.taluk'] = taluk;
    if (panchayat) query['location.panchayat'] = panchayat;
    if (village) query['location.village'] = village;

    const sortObj: any = {};
    sortObj[sort] = sortDirection === 'desc' ? -1 : 1;

    const skip = (parseInt(page as any) - 1) * parseInt(limit as any);

    let phcCenters = await PhcModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit as any));

    if (phcCenters.length === 0) {
      phcCenters = await PhcModel.find()
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as any));
    }

    const total = await PhcModel.countDocuments(query);

    return {
      success: true,
      data: phcCenters,
      pagination: {
        total,
        page: parseInt(page as any),
        limit: parseInt(limit as any),
        pages: Math.ceil(total / parseInt(limit as any)),
      },
    };
  }

  async listPhcsV2(dbConnection: Connection, listDto: PhcListV2Dto): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);
    const { page = 1, limit = 10, filters = {}, showDetails = true, search, sortField, sortOrder } = listDto;

    const actualSortField = sortField || 'createdAt';
    const actualSortOrder = sortOrder === 1 ? 1 : -1;

    const searchFilters: any[] = [];

    if (search) {
      const searchRegex = generateSearchRegex(search);
      searchFilters.push({
        $match: {
          $or: [
            { name: searchRegex },
            { 'location.state': searchRegex },
            { 'location.district': searchRegex },
            { 'location.taluk': searchRegex },
            { 'location.panchayat': searchRegex },
            { 'location.village': searchRegex },
          ],
        },
      });
    }

    const matchStage: any = { isActive: true };

    Object.keys(filters).forEach((field) => {
      const filter = filters[field];
      if (!filter.value) return;

      const actualField = field?.includes('location.') ? field : ['state', 'district', 'taluk'].includes(field) ? `location.${field}` : field;

      switch (filter.matchMode) {
        case 'startsWith':
          matchStage[actualField] = { $regex: `^${filter.value}`, $options: 'i' };
          break;
        case 'endsWith':
          matchStage[actualField] = { $regex: `${filter.value}$`, $options: 'i' };
          break;
        case 'contains':
          matchStage[actualField] = { $regex: filter.value, $options: 'i' };
          break;
        case 'notContains':
          matchStage[actualField] = { $not: { $regex: filter.value, $options: 'i' } };
          break;
        case 'equals':
          matchStage[actualField] = filter.value;
          break;
        case 'notEquals':
          matchStage[actualField] = { $ne: filter.value };
          break;
        case 'dateIs':
          const date = new Date(filter.value);
          matchStage[actualField] = {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
          };
          break;
        case 'dateBetween':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            const startDate = new Date(filter.value[0]);
            const endDate = new Date(filter.value[1]);
            matchStage[actualField] = {
              $gte: new Date(startDate.setHours(0, 0, 0, 0)),
              $lt: new Date(endDate.setHours(23, 59, 59, 999)),
            };
          }
          break;
        case 'in':
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            matchStage[actualField] = { $in: filter.value };
          }
          break;
        default:
          break;
      }
    });

    let sortObject: any = {};
    if (actualSortField?.includes('location.') || ['state', 'district', 'taluk'].includes(actualSortField)) {
      const actualSortFieldName = actualSortField.includes('location.') ? actualSortField : `location.${actualSortField}`;
      sortObject[actualSortFieldName] = actualSortOrder;
    } else {
      sortObject[actualSortField] = actualSortOrder;
    }

    const pipeline: any[] = [
      ...searchFilters,
      { $match: matchStage },
      { $sort: sortObject },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    if (!showDetails) {
      pipeline.push({
        $project: {
          name: 1,
          code: 1,
          'location.state': 1,
          'location.district': 1,
          'location.taluk': 1,
          'location.village': 1,
          contactInfo: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });
    }

    const totalRecords = await PhcModel.countDocuments(matchStage);
    const phcCenters = await PhcModel.aggregate(pipeline);

    return {
      data: phcCenters,
      pagination: {
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit),
        current: page,
        perPage: limit,
      },
      showDetails,
    };
  }

  async getPhcDetails(dbConnection: Connection, id: string): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);

    const phcCenter = await PhcModel.findById(id);

    if (!phcCenter || !phcCenter.isActive) {
      throw new NotFoundException('Phc Center not found');
    }

    return {
      success: true,
      data: phcCenter,
    };
  }

  async deletePhc(dbConnection: Connection, id: string): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);

    const result = await PhcModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!result) {
      throw new NotFoundException('Phc Center not found');
    }

    return {
      success: true,
      message: 'Phc Center deleted successfully',
    };
  }

  async hardDeletePhc(dbConnection: Connection, id: string): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);

    const result = await PhcModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Phc Center not found');
    }

    return {
      success: true,
      message: 'Phc Center permanently deleted',
    };
  }

  async updatePhc(dbConnection: Connection, id: string, updateDto: UpdatePhcDto): Promise<any> {
    const PhcModel = this.getPhcModel(dbConnection);
    const { name, location, isActive } = updateDto;

    const existingPHC = await PhcModel.findById(id);
    if (!existingPHC) {
      throw new NotFoundException('PHC Center not found');
    }

    if (name !== undefined) existingPHC.name = name;
    if (location !== undefined) existingPHC.location = location as any;
    if (isActive !== undefined) existingPHC.isActive = isActive;

    const updatedPHC = await existingPHC.save();

    return {
      success: true,
      message: 'PHC Center updated successfully',
      data: updatedPHC,
    };
  }
}
