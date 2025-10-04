import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Donor, DonorSchema } from './schemas/donor.schema';
import { CreateDonorDto, UpdateDonorDto, UpdateDonorFeaturesDto, DonorListDto } from './dto/donor.dto';

@Injectable()
export class DonorsService {

  private getDonorModel(dbConnection: Connection): Model<Donor> {
    if (dbConnection.models.donors) {
      return dbConnection.models.donors;
    }
    return dbConnection.model<Donor>('donors', DonorSchema, 'donors');
  }

  async createDonor(dbConnection: Connection, createDonorDto: CreateDonorDto, userId: string, companyName: string): Promise<Donor> {
    const DonorModel = this.getDonorModel(dbConnection);

    const donor = new DonorModel({
      ...createDonorDto,
      basePath: `/${companyName}`,
      createdBy: new Types.ObjectId(userId),
    });

    await donor.save();
    return donor;
  }

  async updateDonor(dbConnection: Connection, updateDonorDto: UpdateDonorDto, userId: string): Promise<Donor> {
    const DonorModel = this.getDonorModel(dbConnection);
    const { id, ...restBody } = updateDonorDto;

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid donor ID!');
    }

    const result = await DonorModel.findByIdAndUpdate(
      id,
      { ...restBody, updatedBy: new Types.ObjectId(userId) },
      { new: true, runValidators: true },
    );

    if (!result) {
      throw new NotFoundException('Donor not found!');
    }

    return result;
  }

  async updateDonorFeatures(dbConnection: Connection, updateFeaturesDto: UpdateDonorFeaturesDto, userId: string): Promise<any> {
    const DonorModel = this.getDonorModel(dbConnection);
    const { code, name, features } = updateFeaturesDto;

    const result = await DonorModel.updateMany(
      { code, name },
      { features, updatedBy: new Types.ObjectId(userId) },
      { runValidators: true },
    );

    if (result.modifiedCount !== result.matchedCount) {
      throw new BadRequestException('Something went wrong!');
    }

    return result;
  }

  async updateMultipleDonorFeatures(dbConnection: Connection, donors: UpdateDonorFeaturesDto[], userId: string): Promise<any> {
    const DonorModel = this.getDonorModel(dbConnection);

    const updateOperations = donors.map((donor) => {
      const { code, name, features } = donor;
      return {
        updateMany: {
          filter: { code, name },
          update: { features, updatedBy: new Types.ObjectId(userId) },
        },
      };
    });

    const result = await DonorModel.bulkWrite(updateOperations);

    if (result.modifiedCount !== result.matchedCount) {
      throw new BadRequestException('One or more donors failed to update.');
    }

    return result;
  }

  async getAllDonors(dbConnection: Connection, donorListDto: DonorListDto): Promise<any> {
    const DonorModel = this.getDonorModel(dbConnection);
    const { page = 1, limit = 10, search, sort, sortby = 'desc' } = donorListDto;

    const filters: any[] = [];
    const sorts: any = {};

    // Search based on name or code
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filters.push({
        $match: {
          $or: [{ name: searchRegex }, { code: searchRegex }],
        },
      });
    }

    // Sort results
    if (sort) {
      sorts[sort] = sortby === 'asc' ? 1 : -1;
    } else {
      sorts.createdAt = sortby === 'asc' ? 1 : -1;
    }
    filters.push({ $sort: sorts });

    // Get total count for pagination
    const totalPipeline = [...filters, { $count: 'total' }];
    const totalResult = await DonorModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    // Add pagination
    filters.push({ $skip: (page - 1) * limit });
    filters.push({ $limit: limit });

    // Execute query
    const results = await DonorModel.aggregate(filters);

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
    };

    return { data: results, pagination };
  }

  async getAllDonorsAccessList(dbConnection: Connection, donorListDto: DonorListDto): Promise<any> {
    const DonorModel = this.getDonorModel(dbConnection);
    const { page = 1, limit = 10, search, sort, sortby = 'desc' } = donorListDto;

    const filters: any[] = [];
    const sorts: any = {};

    // Search based on name or code
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filters.push({
        $match: {
          $or: [{ name: searchRegex }, { code: searchRegex }],
        },
      });
    }

    // Group by code and name to get unique donors
    filters.push({
      $group: {
        _id: { code: '$code', name: '$name' },
        code: { $first: '$code' },
        name: { $first: '$name' },
        features: { $first: '$features' },
      },
    });

    // Sort results
    if (sort) {
      sorts[sort] = sortby === 'asc' ? 1 : -1;
    } else {
      sorts.code = sortby === 'asc' ? 1 : -1;
    }
    filters.push({ $sort: sorts });

    // Get total count for pagination
    const totalPipeline = [...filters, { $count: 'total' }];
    const totalResult = await DonorModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    // Add pagination
    filters.push({ $skip: (page - 1) * limit });
    filters.push({ $limit: limit });

    // Execute query
    const results = await DonorModel.aggregate(filters);

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
    };

    return { data: results, pagination };
  }

  async getDonorDetails(dbConnection: Connection, id?: string, donorCode?: string): Promise<Donor | Donor[]> {
    const DonorModel = this.getDonorModel(dbConnection);

    let donor;

    if (donorCode) {
      donor = await DonorModel.find({ code: donorCode });
    } else {
      if (!id || !Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid donor ID!');
      }
      donor = await DonorModel.findById(id);
    }

    if (!donor) {
      throw new NotFoundException('Donor not found!');
    }

    return donor;
  }

  async deleteDonor(dbConnection: Connection, id: string): Promise<Donor> {
    const DonorModel = this.getDonorModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid donor ID!');
    }

    const result = await DonorModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Donor not found!');
    }

    return result;
  }
}
