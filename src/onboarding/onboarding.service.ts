import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { Onboarding, OnboardingSchema } from './schemas/onboarding.schema';
import { CreateOnboardingDto, UpdateOnboardingDto, OnboardingListDto, OnboardingListV2Dto } from './dto/onboarding.dto';
import { generateSearchRegex } from '../common/utils/search-regex';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0 || !total) return 0;
  return Math.round((value / total) * 100);
}

function calculatePercentageDecimal(value: number, total: number): number {
  if (total === 0 || !total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

@Injectable()
export class OnboardingService {
  private getOnboardingModel(dbConnection: Connection): Model<Onboarding> {
    if (dbConnection.models.onboardings) {
      return dbConnection.models.onboardings;
    }
    return dbConnection.model<Onboarding>('onboardings', OnboardingSchema, 'onboardings');
  }

  async create(dbConnection: Connection, createDto: CreateOnboardingDto, loggedInUserId: string): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);

    const newOnboarding = new OnboardingModel({
      ...createDto,
      recordedBy: loggedInUserId,
    });

    const onboarding = await newOnboarding.save();

    return {
      message: 'Registration Successful',
      data: onboarding,
    };
  }

  async list(dbConnection: Connection, listDto: OnboardingListDto): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);
    const { page = 1, limit = 10, sortOrder = -1, filters = {}, search, sortField = 'createdAt' } = listDto;

    const pageNum = Math.max(1, parseInt(page as any, 10));
    const limitNum = Math.max(1, parseInt(limit as any, 10));
    const sortDirection = sortOrder === 1 ? 1 : -1;

    const searchFilters: any[] = [];

    if (search) {
      const searchRegex = generateSearchRegex(search);
      searchFilters.push(
        {
          $addFields: {
            phoneNumberStr: { $toString: '$phoneNumber' },
          },
        },
        {
          $match: {
            $or: [{ name: searchRegex }, { phoneNumberStr: searchRegex }],
          },
        }
      );
    }

    const matchStage: any = {};

    Object.keys(filters).forEach((field) => {
      const filter = filters[field];
      if (filter.value === null || filter.value === undefined || filter.value === '') return;

      const isNumericField = ['age'].includes(field);

      switch (filter.matchMode) {
        case 'startsWith': {
          const escaped = escapeRegex(filter.value);
          if (isNumericField) {
            matchStage.$expr = {
              $regexMatch: {
                input: { $toString: `$${field}` },
                regex: `^${escaped}`,
                options: 'i',
              },
            };
          } else {
            matchStage[field] = { $regex: `^${escaped}`, $options: 'i' };
          }
          break;
        }

        case 'endsWith': {
          const escaped = escapeRegex(filter.value);
          if (isNumericField) {
            matchStage.$expr = {
              $regexMatch: {
                input: { $toString: `$${field}` },
                regex: `${escaped}$`,
                options: 'i',
              },
            };
          } else {
            matchStage[field] = { $regex: `${escaped}$`, $options: 'i' };
          }
          break;
        }

        case 'contains': {
          const escaped = escapeRegex(filter.value);
          if (isNumericField) {
            matchStage.$expr = {
              $regexMatch: {
                input: { $toString: `$${field}` },
                regex: escaped,
                options: 'i',
              },
            };
          } else {
            matchStage[field] = { $regex: escaped, $options: 'i' };
          }
          break;
        }

        case 'notContains': {
          const escaped = escapeRegex(filter.value);
          if (isNumericField) {
            matchStage.$expr = {
              $not: {
                $regexMatch: {
                  input: { $toString: `$${field}` },
                  regex: escaped,
                  options: 'i',
                },
              },
            };
          } else {
            matchStage[field] = {
              $not: { $regex: escaped, $options: 'i' },
            };
          }
          break;
        }

        case 'equals': {
          matchStage[field] = isNumericField ? Number(filter.value) : filter.value;
          break;
        }

        case 'notEquals': {
          matchStage[field] = {
            $ne: isNumericField ? Number(filter.value) : filter.value,
          };
          break;
        }

        default: {
          break;
        }
      }
    });

    const pipeline = [
      ...searchFilters,
      { $match: matchStage },
      { $sort: { [sortField]: sortDirection } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];

    const totalRecords = await OnboardingModel.countDocuments(matchStage);
    const results = await OnboardingModel.aggregate(pipeline);

    return {
      data: results,
      pagination: {
        total: totalRecords,
        pages: Math.ceil(totalRecords / limitNum),
        current: pageNum,
        perPage: limitNum,
      },
    };
  }

  async listV2(dbConnection: Connection, listDto: OnboardingListV2Dto): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);
    const {
      page = 1,
      limit = 10,
      search,
      sort = 'createdAt',
      sortby = 'desc',
      slNo,
      chwID,
      referredBy,
      primaryCarer,
      name,
      age,
      gender,
      district,
      state,
      taluk,
      eligibility,
      dateFrom,
      dateTo,
      showDetails = true,
      onlyEligible = false,
    } = listDto;

    const filters: any[] = [];
    const sorts: any = {};

    let eligibilityArray = ['Service delivered', 'Eligible, but service not delivered'];

    const matchFilters: any = {};
    if (slNo) matchFilters.slNo = slNo;
    if (chwID) matchFilters.chwID = chwID;
    if (referredBy) matchFilters.referredBy = referredBy;
    if (primaryCarer) matchFilters.primaryCarer = primaryCarer;
    if (name) matchFilters.name = { $regex: name, $options: 'i' };
    if (age) matchFilters.age = parseInt(age as any);
    if (gender) matchFilters.gender = gender;
    if (district) matchFilters['address.district'] = district;
    if (state) matchFilters['address.state'] = state;
    if (taluk) matchFilters['address.taluk'] = taluk;

    if (eligibility) {
      matchFilters.eligibility = eligibility;
      eligibilityArray = eligibilityArray.filter((item) => item === eligibility);
    }

    if (onlyEligible) {
      matchFilters.eligibility = { $in: eligibilityArray };
    }

    if (dateFrom || dateTo) {
      matchFilters.date = {};
      if (dateFrom) matchFilters.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchFilters.date.$lte = endDate;
      }
    }

    if (Object.keys(matchFilters).length > 0) {
      filters.push({ $match: matchFilters });
    }

    if (search) {
      const searchRegex = generateSearchRegex(search);
      filters.push({
        $match: {
          $or: [
            { name: searchRegex },
            { slNo: searchRegex },
            { chwID: searchRegex },
            { referredBy: searchRegex },
            { primaryCarer: searchRegex },
            { 'address.district': searchRegex },
            { 'address.state': searchRegex },
            { phoneNumber: searchRegex },
          ],
        },
      });
    }

    if (!showDetails) {
      filters.push({
        $project: {
          slNo: 1,
          date: 1,
          chwID: 1,
          name: 1,
          age: 1,
          gender: 1,
          phoneNumber: 1,
          'address.district': 1,
          'address.state': 1,
          performanceStatus: 1,
          eligibility: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });
    }

    sorts[sort] = sortby === 'desc' ? -1 : 1;
    filters.push({ $sort: sorts });

    const totalPipeline = [...filters, { $count: 'total' }];
    const totalResult = await OnboardingModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    filters.push({ $skip: (page - 1) * limit });
    filters.push({ $limit: parseInt(limit as any) });

    const results = await OnboardingModel.aggregate(filters);

    const talukData = await OnboardingModel.find({}, { 'address.taluk': 1, _id: 0 }).exec();
    const taluks = talukData.map((doc) => doc.address?.taluk).filter((taluk) => taluk !== undefined);
    const uniqueTaluks = [...new Set(taluks)];

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    };

    return {
      data: results,
      pagination,
      showDetails,
      taluks: uniqueTaluks,
    };
  }

  async getDetails(dbConnection: Connection, id: string): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);
    const onboarding = await OnboardingModel.findById(id);

    if (!onboarding) {
      throw new NotFoundException('OnBoarding not found');
    }

    return { data: onboarding };
  }

  async update(dbConnection: Connection, id: string, updateDto: UpdateOnboardingDto, loggedInUserId: string): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);

    const onboarding = await OnboardingModel.findByIdAndUpdate(
      id,
      { ...updateDto, recordedBy: loggedInUserId },
      { new: true, runValidators: true }
    );

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found');
    }

    return {
      message: 'successfully updated',
      data: onboarding,
    };
  }

  async delete(dbConnection: Connection, id: string): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);
    const onboarding = await OnboardingModel.findByIdAndDelete(id);

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found');
    }

    return {
      message: 'deleted successfully',
      data: onboarding,
    };
  }

  async getStats(dbConnection: Connection): Promise<any> {
    const OnboardingModel = this.getOnboardingModel(dbConnection);

    const results = await OnboardingModel.aggregate([
      {
        $facet: {
          totalScreening: [{ $count: 'count' }],
          eligibilityCounts: [
            {
              $match: {
                eligibility: {
                  $in: ['Service delivered', 'Eligible, but service not delivered'],
                },
              },
            },
            { $count: 'eligibleCount' },
          ],
          serviceDeliveredCount: [
            {
              $match: { eligibility: 'Service delivered' },
            },
            { $count: 'count' },
          ],
          genderCounts: [
            {
              $match: { gender: { $in: ['Male', 'Female'] } },
            },
            {
              $group: {
                _id: '$gender',
                count: { $sum: 1 },
              },
            },
          ],
          locationCounts: [
            {
              $match: {
                eligibility: 'Service delivered',
                'address.taluk': { $nin: [null, ''] },
              },
            },
            {
              $group: {
                _id: '$address.taluk',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const totalScreening = results[0]?.totalScreening[0]?.count || 0;
    const totalEligible = results[0]?.eligibilityCounts[0]?.eligibleCount || 0;
    const eligiblePercentage = calculatePercentage(totalEligible, totalScreening);
    const serviceDelivered = results[0]?.serviceDeliveredCount[0]?.count || 0;
    const genderData = results[0]?.genderCounts || [];

    let maleCount = 0;
    let femaleCount = 0;
    genderData.forEach((item: any) => {
      if (item._id === 'Male') maleCount = item.count;
      if (item._id === 'Female') femaleCount = item.count;
    });

    const totalGenderCount = maleCount + femaleCount;
    const maleRatioPercent = calculatePercentage(maleCount, totalGenderCount);
    const femaleRatioPercent = calculatePercentage(femaleCount, totalGenderCount);
    const maleVsFemaleRatio = `${maleRatioPercent}:${femaleRatioPercent}`;

    const locationData = results[0]?.locationCounts || [];
    const serviceProvidedLocationWise = locationData.map((item: any) => ({
      location: item._id,
      percentage: calculatePercentageDecimal(item.count, serviceDelivered),
      count: item.count,
    }));

    const dashboardStats = {
      totalScreening,
      eligiblePercentage,
      serviceDelivered,
      maleVsFemaleRatio,
      serviceProvidedLocationWise,
    };

    return { data: dashboardStats };
  }
}
