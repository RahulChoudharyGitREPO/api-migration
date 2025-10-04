import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Caregiver, CaregiverSchema } from './schemas/caregiver.schema';
import { CreateCaregiverDto, UpdateCaregiverDto, CaregiverListDto, CaregiverListV2Dto } from './dto/caregiver.dto';
import { generateSearchRegex } from '../common/utils/search-regex';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CaregiversService {
  private getCaregiverModel(dbConnection: Connection): Model<Caregiver> {
    if (dbConnection.models.caregivers) {
      return dbConnection.models.caregivers;
    }
    return dbConnection.model<Caregiver>('caregivers', CaregiverSchema, 'caregivers');
  }

  async create(dbConnection: Connection, createDto: CreateCaregiverDto): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);
    const { fullName, dateOfBirth, email, gender, phoneNumber, address, profession, isActive, educationDetails, workExperience, documents } = createDto;

    if (!fullName || !dateOfBirth || !email || !gender || !phoneNumber || !address) {
      throw new BadRequestException('Required fields are missing');
    }

    const newCaregiver = new CaregiverModel({
      fullName,
      dateOfBirth,
      email,
      gender,
      phoneNumber,
      address,
      profession,
      educationDetails: educationDetails || [],
      workExperience: workExperience || [],
      documents: documents || {},
      isActive,
    });

    const savedCaregiver = await newCaregiver.save();

    return {
      message: 'Caregiver created successfully',
      data: savedCaregiver,
    };
  }

  async getDetails(dbConnection: Connection, id: string): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid caregiver ID');
    }

    const pipeline = [
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'professions',
          localField: 'profession',
          foreignField: '_id',
          as: 'professionDetails',
        },
      },
      {
        $unwind: {
          path: '$professionDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            caregiverEmail: '$email',
            caregiverPhone: { $toString: '$phoneNumber' },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$caregiverEmail'] },
                    { $eq: ['$mobile', '$$caregiverPhone'] },
                  ],
                },
              },
            },
          ],
          as: 'matchingUsers',
        },
      },
      {
        $addFields: {
          matchingUserIds: {
            $map: {
              input: '$matchingUsers',
              as: 'user',
              in: '$$user._id',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'onboardings',
          let: { userIds: '$matchingUserIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$recordedBy', '$$userIds'],
                },
              },
            },
          ],
          as: 'screenings',
        },
      },
      {
        $addFields: {
          totalScreening: { $size: '$screenings' },
          totalServicesDelivered: {
            $size: {
              $filter: {
                input: '$screenings',
                as: 'screening',
                cond: { $eq: ['$$screening.eligibility', 'Service delivered'] },
              },
            },
          },
          totalExperience: {
            $sum: {
              $map: {
                input: '$workExperience',
                as: 'work',
                in: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ['$$work.fromDate', null] },
                        { $ne: ['$$work.toDate', null] },
                      ],
                    },
                    then: {
                      $round: [
                        {
                          $divide: [
                            {
                              $dateDiff: {
                                startDate: '$$work.fromDate',
                                endDate: '$$work.toDate',
                                unit: 'day',
                              },
                            },
                            365.25,
                          ],
                        },
                        2,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
          },
          screeningStats: {
            eligible: {
              $size: {
                $filter: {
                  input: '$screenings',
                  as: 'screening',
                  cond: {
                    $or: [
                      { $eq: ['$$screening.eligibility', 'Service delivered'] },
                      { $eq: ['$$screening.eligibility', 'Eligible, but service not delivered'] },
                    ],
                  },
                },
              },
            },
            notEligible: {
              $size: {
                $filter: {
                  input: '$screenings',
                  as: 'screening',
                  cond: { $eq: ['$$screening.eligibility', 'Not eligible'] },
                },
              },
            },
            serviceDelivered: {
              $size: {
                $filter: {
                  input: '$screenings',
                  as: 'screening',
                  cond: { $eq: ['$$screening.eligibility', 'Service delivered'] },
                },
              },
            },
            eligibleButNotDelivered: {
              $size: {
                $filter: {
                  input: '$screenings',
                  as: 'screening',
                  cond: { $eq: ['$$screening.eligibility', 'Eligible, but service not delivered'] },
                },
              },
            },
          },
          recentScreenings: {
            $slice: [
              {
                $sortArray: {
                  input: '$screenings',
                  sortBy: { createdAt: -1 },
                },
              },
              5,
            ],
          },
        },
      },
      {
        $project: {
          fullName: 1,
          dateOfBirth: 1,
          email: 1,
          gender: 1,
          phoneNumber: 1,
          address: 1,
          createdAt: 1,
          updatedAt: 1,
          profession: 1,
          professionDetails: {
            _id: 1,
            name: 1,
          },
          educationDetails: 1,
          workExperience: 1,
          totalExperience: 1,
          documents: 1,
          totalScreening: 1,
          totalServicesDelivered: 1,
          screeningStats: 1,
          recentScreenings: {
            $map: {
              input: '$recentScreenings',
              as: 'screening',
              in: {
                _id: '$$screening._id',
                name: '$$screening.name',
                age: '$$screening.age',
                gender: '$$screening.gender',
                eligibility: '$$screening.eligibility',
                performanceStatus: '$$screening.performanceStatus',
                createdAt: '$$screening.createdAt',
              },
            },
          },
          isActive: 1,
        },
      },
    ];

    const caregiver = await CaregiverModel.aggregate(pipeline);

    if (!caregiver || caregiver.length === 0) {
      throw new NotFoundException('Caregiver not found');
    }

    const caregiverData = caregiver[0];

    if (caregiverData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(caregiverData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      caregiverData.age = age;
    }

    return {
      data: caregiverData,
      message: 'Caregiver details retrieved successfully',
    };
  }

  async list(dbConnection: Connection, listDto: CaregiverListDto): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);
    const { page = 1, limit = 10, search, sort = 'createdAt', sortby = 'desc', fullName, email, gender, phoneNumber, profession, dateFrom, dateTo, showDetails = true } = listDto;

    const filters: any[] = [];
    const sorts: any = {};

    const matchFilters: any = {};
    if (fullName) matchFilters.fullName = { $regex: fullName, $options: 'i' };
    if (email) matchFilters.email = { $regex: email, $options: 'i' };
    if (gender) matchFilters.gender = gender;
    if (phoneNumber) matchFilters.phoneNumber = phoneNumber;
    if (profession) matchFilters.profession = profession;

    if (dateFrom || dateTo) {
      matchFilters.createdAt = {};
      if (dateFrom) {
        matchFilters.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchFilters.createdAt.$lte = endDate;
      }
    }

    if (Object.keys(matchFilters).length > 0) {
      filters.push({ $match: matchFilters });
    }

    if (search) {
      filters.push({
        $match: {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    filters.push({
      $lookup: {
        from: 'professions',
        localField: 'profession',
        foreignField: '_id',
        as: 'professionDetails',
      },
    });

    filters.push({
      $unwind: {
        path: '$professionDetails',
        preserveNullAndEmptyArrays: true,
      },
    });

    if (!showDetails) {
      filters.push({
        $project: {
          fullName: 1,
          email: 1,
          gender: 1,
          phoneNumber: 1,
          address: 1,
          'professionDetails.name': 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });
    }

    sorts[sort] = sortby === 'desc' ? -1 : 1;
    filters.push({ $sort: sorts });

    const totalPipeline = [...filters, { $count: 'total' }];
    const totalResult = await CaregiverModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    filters.push({ $skip: (page - 1) * limit });
    filters.push({ $limit: parseInt(limit as any) });

    const caregivers = await CaregiverModel.aggregate(filters);

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    };

    return {
      data: caregivers,
      pagination,
      showDetails,
    };
  }

  async listV2(dbConnection: Connection, listDto: CaregiverListV2Dto): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);
    const { page = 1, limit = 10, filters = {}, showDetails = true, search } = listDto;

    const sortField = listDto.sortField || 'createdAt';
    const sortOrder = listDto.sortOrder === 1 ? 1 : -1;
    const sortDirection = sortOrder === 1 ? 1 : -1;

    const matchStage: any = {};
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
            $or: [{ fullName: searchRegex }, { phoneNumberStr: searchRegex }],
          },
        }
      );
    }

    const professionFilter = filters.profession;

    Object.keys(filters).forEach((field) => {
      if (field === 'profession') return;

      const filter = filters[field];
      if (!filter.value) return;
      const isNumericField = ['phoneNumber', 'totalServicesDelivered', 'totalExperience'].includes(field);

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
            matchStage[field] = { $not: { $regex: escaped, $options: 'i' } };
          }
          break;
        }

        case 'equals': {
          matchStage[field] = isNumericField ? { $eq: Number(filter.value) } : filter.value;
          break;
        }

        case 'notEquals': {
          matchStage[field] = isNumericField ? { $ne: Number(filter.value) } : { $ne: filter.value };
          break;
        }

        case 'dateIs': {
          const date = new Date(filter.value);
          if (!isNaN(date.getTime())) {
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            matchStage[field] = { $gte: start, $lt: end };
          }
          break;
        }

        case 'dateBetween': {
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            const startDate = new Date(filter.value[0]);
            const endDate = new Date(filter.value[1]);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              matchStage[field] = {
                $gte: new Date(startDate.setHours(0, 0, 0, 0)),
                $lt: new Date(endDate.setHours(23, 59, 59, 999)),
              };
            }
          }
          break;
        }

        case 'in': {
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            matchStage[field] = { $in: filter.value };
          }
          break;
        }

        default:
          break;
      }
    });

    if (professionFilter && professionFilter.value) {
      const ProfessionModel = dbConnection.models.professions;

      let professionQuery: any = {};
      switch (professionFilter.matchMode) {
        case 'equals':
          professionQuery = { name: professionFilter.value };
          break;
        case 'notEquals':
          professionQuery = { name: { $ne: professionFilter.value } };
          break;
        case 'contains':
          professionQuery = { name: { $regex: professionFilter.value, $options: 'i' } };
          break;
        case 'notContains':
          professionQuery = { name: { $not: { $regex: professionFilter.value, $options: 'i' } } };
          break;
        case 'startsWith':
          professionQuery = { name: { $regex: `^${professionFilter.value}`, $options: 'i' } };
          break;
        case 'endsWith':
          professionQuery = { name: { $regex: `${professionFilter.value}$`, $options: 'i' } };
          break;
        default:
          break;
      }

      const matchingProfessions = await ProfessionModel.find(professionQuery).select('_id');
      const professionIds = matchingProfessions.map((p: any) => p._id);

      if (professionIds.length > 0) {
        matchStage.profession = { $in: professionIds };
      } else {
        matchStage.profession = { $in: [] };
      }
    }

    const pipeline = [
      ...searchFilters,
      {
        $lookup: {
          from: 'professions',
          localField: 'profession',
          foreignField: '_id',
          as: 'professionDetails',
        },
      },
      {
        $unwind: {
          path: '$professionDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            caregiverEmail: '$email',
            caregiverPhone: { $toString: '$phoneNumber' },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$caregiverEmail'] },
                    { $eq: ['$mobile', '$$caregiverPhone'] },
                  ],
                },
              },
            },
          ],
          as: 'matchingUsers',
        },
      },
      {
        $addFields: {
          matchingUserIds: {
            $map: {
              input: '$matchingUsers',
              as: 'user',
              in: '$$user._id',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'onboardings',
          let: { userIds: '$matchingUserIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$recordedBy', '$$userIds'],
                },
              },
            },
          ],
          as: 'screenings',
        },
      },
      {
        $addFields: {
          totalScreening: { $size: '$screenings' },
          totalServicesDelivered: {
            $size: {
              $filter: {
                input: '$screenings',
                as: 'screening',
                cond: { $eq: ['$$screening.eligibility', 'Service delivered'] },
              },
            },
          },
          totalExperience: {
            $sum: {
              $map: {
                input: '$workExperience',
                as: 'work',
                in: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ['$$work.fromDate', null] },
                        { $ne: ['$$work.toDate', null] },
                      ],
                    },
                    then: {
                      $round: [
                        {
                          $divide: [
                            {
                              $dateDiff: {
                                startDate: '$$work.fromDate',
                                endDate: '$$work.toDate',
                                unit: 'day',
                              },
                            },
                            365.25,
                          ],
                        },
                        2,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
          },
        },
      },
      {
        $unset: ['screenings', 'matchingUsers', 'matchingUserIds'],
      },
      { $match: matchStage },
      {
        $sort: {
          ...(sortField === 'profession.name'
            ? { 'professionDetails.name': sortDirection }
            : sortField === 'totalScreening'
              ? { totalScreening: sortDirection }
              : sortField === 'totalServicesDelivered'
                ? { totalServicesDelivered: sortDirection }
                : sortField === 'totalExperience'
                  ? { totalExperience: sortDirection }
                  : { [sortField]: sortDirection }),
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    if (!showDetails) {
      pipeline.push({
        $project: {
          fullName: 1,
          email: 1,
          gender: 1,
          phoneNumber: 1,
          address: 1,
          profession: 1,
          'professionDetails.name': 1,
          totalScreening: 1,
          totalServicesDelivered: 1,
          totalExperience: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });
    }

    const countPipeline = [
      {
        $lookup: {
          from: 'professions',
          localField: 'profession',
          foreignField: '_id',
          as: 'professionDetails',
        },
      },
      {
        $unwind: {
          path: '$professionDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            caregiverEmail: '$email',
            caregiverPhone: { $toString: '$phoneNumber' },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$caregiverEmail'] },
                    { $eq: ['$mobile', '$$caregiverPhone'] },
                  ],
                },
              },
            },
          ],
          as: 'matchingUsers',
        },
      },
      {
        $addFields: {
          matchingUserIds: {
            $map: {
              input: '$matchingUsers',
              as: 'user',
              in: '$$user._id',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'onboardings',
          let: { userIds: '$matchingUserIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$recordedBy', '$$userIds'],
                },
              },
            },
          ],
          as: 'screenings',
        },
      },
      {
        $addFields: {
          totalScreening: { $size: '$screenings' },
          totalServicesDelivered: {
            $size: {
              $filter: {
                input: '$screenings',
                as: 'screening',
                cond: { $eq: ['$$screening.eligibility', 'Service delivered'] },
              },
            },
          },
          totalExperience: {
            $sum: {
              $map: {
                input: '$workExperience',
                as: 'work',
                in: { $ifNull: ['$$work.yearsOfExperience', 0] },
              },
            },
          },
        },
      },
      { $match: matchStage },
      { $count: 'total' },
    ];

    const countResult = await CaregiverModel.aggregate(countPipeline);
    const totalRecords = countResult.length > 0 ? countResult[0].total : 0;

    const caregivers = await CaregiverModel.aggregate(pipeline);

    return {
      data: caregivers,
      pagination: {
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit),
        current: page,
        perPage: limit,
      },
      showDetails,
    };
  }

  async update(dbConnection: Connection, id: string, updateDto: UpdateCaregiverDto): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);

    const caregiver = await CaregiverModel.findById(id);

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    const updatedCaregiver = await CaregiverModel.findByIdAndUpdate(id, { $set: updateDto }, { new: true, runValidators: true });

    return {
      message: 'Caregiver updated successfully',
      data: updatedCaregiver,
    };
  }

  async delete(dbConnection: Connection, id: string): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);

    const deletedCaregiver = await CaregiverModel.findByIdAndDelete(id);

    if (!deletedCaregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    return {
      message: 'Caregiver deleted successfully',
      data: deletedCaregiver,
    };
  }

  async getDashboardStats(dbConnection: Connection): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);
    const OnBoardingModel = dbConnection.models.onboardings;

    const totalCaregivers = await CaregiverModel.countDocuments({});
    const totalPatientsAssessed = await OnBoardingModel.countDocuments({});

    const onboardingStats = await OnBoardingModel.aggregate([
      {
        $group: {
          _id: '$eligibility',
          count: { $sum: 1 },
        },
      },
    ]);

    let serviceDeliveredCount = 0;
    let eligibleNotDeliveredCount = 0;
    let notEligibleCount = 0;

    onboardingStats.forEach((stat: any) => {
      switch (stat._id) {
        case 'Service delivered':
          serviceDeliveredCount = stat.count;
          break;
        case 'Eligible, but service not delivered':
          eligibleNotDeliveredCount = stat.count;
          break;
        case 'Not eligible':
          notEligibleCount = stat.count;
          break;
      }
    });

    const eligibleCount = serviceDeliveredCount + eligibleNotDeliveredCount;
    const eligiblePercentage = totalPatientsAssessed > 0 ? Math.round((eligibleCount / totalPatientsAssessed) * 100) : 0;

    const caregiversWithActivities = await CaregiverModel.aggregate([
      {
        $lookup: {
          from: 'users',
          let: {
            caregiverEmail: '$email',
            caregiverPhone: { $toString: '$phoneNumber' },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$caregiverEmail'] },
                    { $eq: ['$mobile', '$$caregiverPhone'] },
                  ],
                },
              },
            },
          ],
          as: 'matchingUsers',
        },
      },
      {
        $addFields: {
          matchingUserIds: {
            $map: {
              input: '$matchingUsers',
              as: 'user',
              in: '$$user._id',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'onboardings',
          let: { userIds: '$matchingUserIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$recordedBy', '$$userIds'],
                },
              },
            },
          ],
          as: 'screenings',
        },
      },
      {
        $addFields: {
          totalScreenings: { $size: '$screenings' },
        },
      },
      {
        $match: {
          totalScreenings: { $gt: 0 },
        },
      },
      {
        $count: 'activeCaregivers',
      },
    ]);

    const activeCaregivers = caregiversWithActivities.length > 0 ? caregiversWithActivities[0].activeCaregivers : 0;

    let caregiverPatientRatio = '1:0';
    let patientsPerCaregiver = 0;
    if (totalCaregivers > 0 && notEligibleCount > 0) {
      patientsPerCaregiver = parseFloat((notEligibleCount / totalCaregivers).toFixed(2));
      caregiverPatientRatio = `1:${patientsPerCaregiver}`;
    }

    const patientsImpacted = serviceDeliveredCount;

    const dashboardStats = {
      totalCaregivers: {
        count: totalCaregivers,
        label: 'Total Caregivers',
      },
      eligiblePercentage: {
        percentage: eligiblePercentage,
        count: eligibleCount,
        total: totalPatientsAssessed,
        label: 'Eligible %',
        breakdown: {
          serviceDelivered: serviceDeliveredCount,
          eligibleNotDelivered: eligibleNotDeliveredCount,
        },
      },
      caregiverPatientRatio: {
        ratio: caregiverPatientRatio,
        totalCaregivers: totalCaregivers,
        notEligiblePatients: notEligibleCount,
        patientsPerCaregiver: patientsPerCaregiver,
        label: 'Caregivers Patient ratio',
      },
      patientsImpacted: {
        count: patientsImpacted,
        label: 'Patients impacted',
      },
      summary: {
        totalCaregivers,
        totalPatientsAssessed,
        serviceDelivered: serviceDeliveredCount,
        eligibleNotDelivered: eligibleNotDeliveredCount,
        notEligible: notEligibleCount,
        eligibleCount,
        eligiblePercentage: `${eligiblePercentage}%`,
        caregiverPatientRatio,
        patientsPerCaregiver,
        patientsImpacted,
      },
    };

    return { data: dashboardStats };
  }

  async getSimpleStats(dbConnection: Connection): Promise<any> {
    const CaregiverModel = this.getCaregiverModel(dbConnection);
    const OnBoardingModel = dbConnection.models.onboardings;

    const totalCaregivers = await CaregiverModel.countDocuments({});

    const onboardingStats = await OnBoardingModel.aggregate([
      {
        $group: {
          _id: '$eligibility',
          count: { $sum: 1 },
        },
      },
    ]);

    let serviceDeliveredCount = 0;
    let eligibleNotDeliveredCount = 0;
    let notEligibleCount = 0;

    onboardingStats.forEach((stat: any) => {
      switch (stat._id) {
        case 'Service delivered':
          serviceDeliveredCount = stat.count;
          break;
        case 'Eligible, but service not delivered':
          eligibleNotDeliveredCount = stat.count;
          break;
        case 'Not eligible':
          notEligibleCount = stat.count;
          break;
      }
    });

    const eligibleCount = serviceDeliveredCount + eligibleNotDeliveredCount;
    const totalPatientsAssessed = serviceDeliveredCount + eligibleNotDeliveredCount + notEligibleCount;
    const eligiblePercentage = totalPatientsAssessed > 0 ? Math.round((eligibleCount / totalPatientsAssessed) * 100) : 0;

    const patientsPerCaregiver = totalCaregivers > 0 ? Math.round(notEligibleCount / totalCaregivers) : 0;

    const simpleStats = {
      totalCaregivers: totalCaregivers.toLocaleString(),
      eligiblePercentage: `${eligiblePercentage}%`,
      caregiverPatientRatio: `1:${patientsPerCaregiver}`,
      patientsImpacted: serviceDeliveredCount.toLocaleString(),
    };

    return { data: simpleStats };
  }
}
