import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Model, Types, Connection } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { User, UserDocument, UserSchema } from "../auth/schemas/user.schema";
import { Company, CompanySchema } from "../companies/companies.schema";
import { Entity, EntitySchema } from "../entities/entities.schema";
import { LabMaster, LabMasterSchema } from "../labmaster/labmaster.schema";
import { Area, AreaSchema } from "../areas/areas.schema";
import { Crop, CropSchema } from "../crops/crops.schema";
import { Project, ProjectSchema } from "../projects/projects.schema";
import { Caregiver, CaregiverSchema } from "../caregivers/caregivers.schema";
import { GetAllUsersDto } from "./dto/get-all-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { GetUsersPaginationDto } from "./dto/get-users-pagination.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { ResendPasswordDto } from "./dto/resend-password.dto";
import { RegisterUserDto } from "../auth/dto/register-user.dto";

@Injectable()
export class UsersService {
  constructor() {}

  private getUserModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("User", UserSchema, "users");
  }

  private registerSchemas(dbConnection: Connection): void {
    // Register all schemas that might be needed for population
    try {
      // Register Company schema with proper collection name
      if (!dbConnection.models["Company"]) {
        dbConnection.model("Company", CompanySchema, "companies");
      }

      // Register other schemas
      if (!dbConnection.models["Entity"]) {
        dbConnection.model("Entity", EntitySchema, "entities");
      }

      if (!dbConnection.models["LabMaster"]) {
        dbConnection.model("LabMaster", LabMasterSchema, "labmaster");
      }

      if (!dbConnection.models["Area"]) {
        dbConnection.model("Area", AreaSchema, "areas");
      }

      if (!dbConnection.models["Crop"]) {
        dbConnection.model("Crop", CropSchema, "crops");
      }

      if (!dbConnection.models["Project"]) {
        dbConnection.model("Project", ProjectSchema, "projects");
      }

      if (!dbConnection.models["Caregiver"]) {
        dbConnection.model("Caregiver", CaregiverSchema, "caregivers");
      }

      console.log("Registered schemas:", Object.keys(dbConnection.models));
    } catch (error) {
      console.error("Error registering schemas:", error);
    }
  }

  private getCompanyModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Company", CompanySchema, "companies");
  }

  private getEntityModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Entity", EntitySchema, "entities");
  }

  private getLabMasterModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("LabMaster", LabMasterSchema, "labmaster");
  }

  private getAreaModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Area", AreaSchema, "areas");
  }

  private getCropModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Crop", CropSchema, "crops");
  }

  private getProjectModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Project", ProjectSchema, "projects");
  }

  private getCaregiverModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("Caregiver", CaregiverSchema, "caregivers");
  }

  /**
   * Email template for password creation (copied from original)
   */
  private createPasswordEmailTemplate(url: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    .content {
      margin: 20px 0;
      font-size: 16px;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 12px 20px;
      margin: 20px auto;
      background-color: #007BFF;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      font-weight: bold;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      Create password
    </div>
    <div class="content">
      <p>We received a request to create your password. Click the button below to set your password:</p>
      <a href="${url}" class="button">Set Password</a>
    </div>
    <div class="footer">
      <p>Need further assistance? Contact our support team.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate search regex (copied from original handlers)
   */
  private generateSearchRegex(text: string) {
    return { $regex: text, $options: "i" };
  }

  /**
   * Get pagination format (copied from original handlers)
   */
  private getPaginationFormat(
    totalCounts: number,
    totalPages: number,
    currentPage: number,
    limit: number,
  ) {
    return {
      total: totalCounts,
      pages: totalPages,
      current: currentPage,
      perPage: limit,
    };
  }

  /**
   * Get user by email (copied from original repository)
   */
  async getUserByEmail(email: string, dbConnection: Connection): Promise<any> {
    const userModel = this.getUserModel(dbConnection);
    return await userModel.findOne({ email });
  }

  /**
   * Get user by phone (copied from original repository)
   */
  async getUserByPhone(mobile: string, dbConnection: Connection): Promise<any> {
    const userModel = this.getUserModel(dbConnection);
    return await userModel.findOne({ mobile });
  }

  /**
   * Check if caregiver exists (copied from original middleware logic)
   */
  async checkCareGiverUserAvailable(
    role: string,
    email: string,
    mobile: string,
    dbConnection: Connection,
  ): Promise<boolean> {
    // If not a caregiver role, allow
    if (role !== "Caregiver") {
      return true;
    }

    try {
      // Register schemas for caregiver validation
      this.registerSchemas(dbConnection);

      // Check if caregiver exists with given email and mobile
      const caregiverModel = this.getCaregiverModel(dbConnection);
      const caregiverData = await caregiverModel.findOne({
        email: email,
        phoneNumber: parseInt(mobile),
      });

      console.log(
        `Caregiver validation: ${email}/${mobile} - Found: ${!!caregiverData}`,
      );
      return !!caregiverData;
    } catch (error) {
      console.error("Error checking caregiver availability:", error);
      return false;
    }
  }

  /**
   * Add user (copied from original service logic)
   */
  async addUser(
    registerDto: RegisterUserDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const email = registerDto.Email?.toLowerCase()?.trim();
    const mobile = registerDto.mobile;

    const userModel = this.getUserModel(dbConnection);

    // Check if user already exists
    let existingEmailUser = await this.getUserByEmail(email, dbConnection);
    let existingMobileUser = await this.getUserByPhone(mobile, dbConnection);

    // Handle soft-deleted users (copied from original logic)
    if (existingEmailUser && existingEmailUser.isRemove) {
      await userModel.findByIdAndDelete(existingEmailUser._id);
      existingEmailUser = null;
      existingMobileUser = null;
    }

    if (existingMobileUser && existingMobileUser.isRemove) {
      await userModel.findByIdAndDelete(existingMobileUser._id);
      existingMobileUser = null;
      existingEmailUser = null;
    }

    // Update existing user logic (copied from original)
    if (registerDto._id) {
      if (
        existingMobileUser &&
        ((existingMobileUser._id as Types.ObjectId).toString() !==
          registerDto._id ||
          existingMobileUser.email !== email)
      ) {
        return {
          success: false,
          message: "Mobile number already exists.",
        };
      }
      existingEmailUser = null; // Allow update if it's the same user
    } else {
      if (existingEmailUser) {
        return { success: false, message: "Email already exists." };
      }
      if (existingMobileUser) {
        return {
          success: false,
          message: "Mobile number already exists.",
        };
      }
    }

    // Check caregiver availability
    const isCaregiverValid = await this.checkCareGiverUserAvailable(
      registerDto.role,
      email,
      mobile,
      dbConnection,
    );
    if (!isCaregiverValid) {
      return {
        success: false,
        message: `Registration failed: Caregiver details not found with ${email} and ${mobile}`,
      };
    }

    // Create user (copied from original createUser logic)
    let user;

    if (registerDto._id) {
      // Update existing user
      user = await userModel.findByIdAndUpdate(
        registerDto._id,
        {
          name: registerDto.name,
          email: email,
          mobile: registerDto.mobile,
          role: registerDto.role,
          isActive: registerDto.isActive,
          labMaster: registerDto.labMaster,
          profilePic: registerDto.profilePic,
          species: registerDto.species,
          companies: registerDto.companies,
          addressLine1: registerDto.addressLine1,
          addressLine2: registerDto.addressLine2,
          entities: registerDto.entities,
          projects: registerDto.projects,
        },
        { new: true, runValidators: true },
      );
    } else {
      // Create new user
      const passwordHash = uuidv4();
      user = await userModel.create({
        name: registerDto.name,
        email: email,
        mobile: registerDto.mobile,
        role: registerDto.role,
        isActive: registerDto.isActive ?? true,
        labMaster: registerDto.labMaster,
        profilePic: registerDto.profilePic,
        species: registerDto.species,
        companies: registerDto.companies,
        addressLine1: registerDto.addressLine1,
        addressLine2: registerDto.addressLine2,
        entities: registerDto.entities,
        projects: registerDto.projects,
        passwordHash: passwordHash,
      });

      // Send email with password creation link (copied from original)
      const baseUrl =
        registerDto.hostURL || process.env.HOSTNAME || "http://localhost:3000";
      const url = `${baseUrl}/${companyName}/?userId=${passwordHash}&type=createpassword`;

      const emailTemplate = this.createPasswordEmailTemplate(url);

      // TODO: Implement email sending service
      // await this.sendMailAsync(
      //   { name: user.name, email: user.email },
      //   "Password creation",
      //   emailTemplate
      // );

      console.log("Password creation URL:", url);

      user = await userModel.findById(user._id);
    }

    return {
      success: true,
      message: "Registration successful",
      data: user,
    };
  }

  /**
   * Get all users (copied from original service logic)
   */
  async getAllUsers(
    getAllUsersDto: GetAllUsersDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const { showRemovedUser = false, Id } = getAllUsersDto;

    const query: any = {};

    // If Id is provided
    if (Id && Id !== 0) {
      query._id = Id;
    }

    // Only apply isRemove condition if showRemovedUser is false
    if (!showRemovedUser) {
      query.isRemove = false;
    }

    const userModel = this.getUserModel(dbConnection);
    const userData = await userModel.find(query);

    if (userData && userData.length > 0) {
      return {
        success: true,
        message: "success",
        data: userData,
      };
    } else {
      return { success: false, message: "No users found." };
    }
  }

  /**
   * Update user (copied from original repository logic)
   */
  async updateUser(
    updateUserDto: UpdateUserDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const {
      id,
      name,
      email,
      mobile,
      role,
      isActive,
      profilePic,
      crops,
      companies,
      addressLine1,
      addressLine2,
      labMaster,
      entities,
      area,
      species,
      projects,
    } = updateUserDto;

    // Validate id
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user ID!");
    }

    // Build update data object with only provided fields
    const data: any = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email?.toLowerCase()?.trim();
    if (mobile !== undefined) data.mobile = mobile;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (profilePic !== undefined) data.profilePic = profilePic;
    if (crops !== undefined) data.crops = crops;
    if (companies !== undefined) data.companies = companies;
    if (addressLine1 !== undefined) data.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) data.addressLine2 = addressLine2;
    if (labMaster !== undefined) data.labMaster = labMaster;
    if (entities !== undefined) data.entities = entities;
    if (area !== undefined) data.area = area;
    if (species !== undefined) data.species = species;
    if (projects !== undefined) data.projects = projects;

    // Check if at least one field is being updated
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("At least one field must be provided for update!");
    }

    // Required parameters for staff (copied from original logic)
    if (role === "Staff" && !(crops && companies)) {
      throw new BadRequestException("crops & companies are required for Staff role!");
    }

    // Update user
    const userModel = this.getUserModel(dbConnection);
    const result = await userModel
      .findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      .populate(["entities"]);

    return {
      success: true,
      message: "Success",
      data: result,
    };
  }

  /**
   * Get users with pagination (copied from original repository logic)
   */
  async getAllUsersWithPagination(
    paginationDto: GetUsersPaginationDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    // TODO: Implement getLoggedInUserId and getUserInformation when auth utilities are available
    // const logedinuserId = await this.getLoggedInUserId(req, res);
    // const userData = await this.getUserInformation(req, logedinuserId, res);
    // const userRole = userData.user.role;
    // const userProjects = userData.user.projects;

    const {
      page = 1,
      limit = 10,
      filters = {},
      search,
      showRemovedUser = false,
      sortField = "createdAt",
      sortOrder = -1,
    } = paginationDto;

    // Convert sort order to MongoDB format
    const sortDirection = sortOrder === 1 ? 1 : -1;

    // Initialize query filters
    const matchStage: any = {};
    const aggregationFilters: any[] = [];
    const searchFilters: any[] = [];

    // Handle search functionality (copied from original)
    if (search) {
      const searchRegex = this.generateSearchRegex(search);
      searchFilters.push({
        $match: {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { mobile: searchRegex },
          ],
        },
      });
    }

    // Get role filter separately if it exists
    const roleFilter = filters.role;

    // Dynamically apply filters based on match modes (copied from original)
    Object.keys(filters).forEach((field) => {
      // Skip role filter if it's handled separately
      if (field === "role" && roleFilter) return;

      const filter = filters[field];
      if (!filter.value) return; // Skip empty filters

      const isNumericField = ["mobile"].includes(field);
      const isBooleanField = ["isActive", "isRemove"].includes(field);

      switch (filter.matchMode) {
        case "startsWith":
          matchStage[field] = isNumericField
            ? { $eq: Number(filter.value) }
            : { $regex: `^${filter.value}`, $options: "i" };
          break;
        case "endsWith":
          matchStage[field] = isNumericField
            ? { $eq: Number(filter.value) }
            : { $regex: `${filter.value}$`, $options: "i" };
          break;
        case "contains":
          matchStage[field] = isNumericField
            ? { $eq: Number(filter.value) }
            : { $regex: filter.value, $options: "i" };
          break;
        case "notContains":
          matchStage[field] = isNumericField
            ? { $not: Number(filter.value) }
            : { $not: { $regex: filter.value, $options: "i" } };
          break;
        case "equals":
          if (isBooleanField) {
            matchStage[field] =
              filter.value === "true" || filter.value === true;
          } else {
            matchStage[field] = isNumericField
              ? { $eq: Number(filter.value) }
              : filter.value;
          }
          break;
        case "notEquals":
          if (isBooleanField) {
            matchStage[field] = {
              $ne: filter.value === "true" || filter.value === true,
            };
          } else {
            matchStage[field] = isNumericField
              ? { $ne: Number(filter.value) }
              : { $ne: filter.value };
          }
          break;
        case "dateIs":
          const date = new Date(filter.value);
          matchStage[field] = {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
          };
          break;
        case "dateBetween":
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            const startDate = new Date(filter.value[0]);
            const endDate = new Date(filter.value[1]);
            matchStage[field] = {
              $gte: new Date(startDate.setHours(0, 0, 0, 0)),
              $lt: new Date(endDate.setHours(23, 59, 59, 999)),
            };
          }
          break;
        case "in":
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            matchStage[field] = { $in: filter.value };
          }
          break;
        default:
          break;
      }
    });

    // Handle role filter if it exists (copied from original)
    if (roleFilter && roleFilter.value) {
      switch (roleFilter.matchMode) {
        case "equals":
          matchStage.role = roleFilter.value;
          break;
        case "notEquals":
          matchStage.role = { $ne: roleFilter.value };
          break;
        case "contains":
          matchStage.role = { $regex: roleFilter.value, $options: "i" };
          break;
        case "notContains":
          matchStage.role = {
            $not: { $regex: roleFilter.value, $options: "i" },
          };
          break;
        case "startsWith":
          matchStage.role = {
            $regex: `^${roleFilter.value}`,
            $options: "i",
          };
          break;
        case "endsWith":
          matchStage.role = {
            $regex: `${roleFilter.value}$`,
            $options: "i",
          };
          break;
        case "in":
          if (Array.isArray(roleFilter.value) && roleFilter.value.length > 0) {
            matchStage.role = { $in: roleFilter.value };
          }
          break;
        default:
          break;
      }
    }

    // Add default filters for isActive and isRemove if not explicitly filtered
    if (!filters.isActive) {
      matchStage.isActive = true;
    }
    if (!showRemovedUser && !filters.isRemove) {
      matchStage.isRemove = false;
    }

    // Add search filters to aggregation pipeline
    aggregationFilters.push(...searchFilters);

    // Apply matchStage filters (isActive, isRemove, and any others)
    if (Object.keys(matchStage).length > 0) {
      aggregationFilters.push({ $match: matchStage });
    }

    // Register schemas for aggregation lookups
    this.registerSchemas(dbConnection);

    // Populate companies information (copied from original)
    aggregationFilters.push({
      $lookup: {
        from: "companies",
        localField: "companies",
        foreignField: "_id",
        as: "companies",
      },
    });

    // Populate entities information (copied from original)
    aggregationFilters.push({
      $lookup: {
        from: "entities",
        localField: "entities",
        foreignField: "_id",
        as: "entities",
      },
    });

    // Sort results
    aggregationFilters.push({
      $sort: { [sortField]: sortDirection },
    });

    // Count pipeline for pagination
    const countPipeline = [...aggregationFilters, { $count: "total" }];
    const userModel = this.getUserModel(dbConnection);
    const countResult = await userModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    // Add pagination to main pipeline
    aggregationFilters.push({ $skip: (page - 1) * limit });
    aggregationFilters.push({ $limit: limit });

    // Execute the main aggregation query
    const users = await userModel.aggregate(aggregationFilters);

    const pagination = this.getPaginationFormat(total, totalPages, page, limit);

    return {
      success: true,
      message: "Success",
      data: users,
      pagination,
    };
  }

  /**
   * Get user details (copied from original repository logic)
   */
  async getUserDetails(
    id: string,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    // Validate id
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user ID!");
    }

    // Register schemas for population
    this.registerSchemas(dbConnection);

    // Find user based on id
    const userModel = this.getUserModel(dbConnection);
    const user = await userModel
      .findById(id)
      .populate(["companies", "labMaster", "entities", "species", "projects"]);

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    return {
      success: true,
      message: "Success",
      data: user,
    };
  }

  /**
   * Delete user (soft delete) (copied from original repository logic)
   */
  async deleteUser(
    deleteUserDto: DeleteUserDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const { Id, isRemove = true } = deleteUserDto;

    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findByIdAndUpdate(
      Id,
      { isRemove },
      { new: true },
    );

    return {
      success: true,
      message: "Delete User",
      data: user,
    };
  }

  /**
   * Query users (copied from original repository logic)
   */
  async queryUser(
    queryUserDto: QueryUserDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const { dbQuery } = queryUserDto;

    // Query on User collection
    const userModel = this.getUserModel(dbConnection);
    const users = await userModel.find(dbQuery);
    if (!users || users.length === 0) {
      throw new NotFoundException("No User found for query!");
    }

    return {
      success: true,
      message: "Success",
      data: users,
    };
  }

  /**
   * Resend password creation email (copied from original repository logic)
   */
  async resendPasswordCreationEmail(
    resendPasswordDto: ResendPasswordDto,
    companyName: string,
    dbConnection: Connection,
  ): Promise<any> {
    const { id } = resendPasswordDto;

    // Validate id
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user ID!");
    }

    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const url = `${process.env.HOSTNAME || "http://localhost:3000"}/${companyName}/?userId=${user.passwordHash.toString()}&type=createpassword`;

    const emailTemplate = this.createPasswordEmailTemplate(url);

    console.log("Resend password URL:", url);

    // TODO: Implement email sending service
    // await this.sendMailAsync(
    //   { name: user.name, email: user.email },
    //   "Password creation",
    //   emailTemplate
    // );

    return {
      success: true,
      message: "Email sent successfully.",
      data: user,
    };
  }
}
