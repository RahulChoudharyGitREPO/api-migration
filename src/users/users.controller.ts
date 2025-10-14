import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
  RawBodyRequest,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DynamicDbGuard } from "../common/guards/dynamic-db.guard";
import {
  CompanyName,
  DatabaseConnection,
} from "../common/decorators/dynamic-db.decorator";
import { GetAllUsersDto } from "./dto/get-all-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserSimpleDto } from "./dto/update-user-simple.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { GetUsersPaginationDto } from "./dto/get-users-pagination.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { ResendPasswordDto } from "./dto/resend-password.dto";
import { RegisterUserDto } from "../auth/dto/register-user.dto";
import { Connection } from "mongoose";
import type { Request } from "express";

@Controller(":companyName/api/user")
@UseGuards(DynamicDbGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Add user endpoint (copied from original: POST /add-user)
   * Protected with JWT and caregiver check middleware
   */
  @Post("add-user")
  @UseGuards(JwtAuthGuard)
  async addUser(
    @Body() registerDto: RegisterUserDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.addUser(
        registerDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user endpoint (copied from original: POST /update)
   */
  @Post("update")
  async updateUser(
    @Req() req: Request,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      // Get raw body and filter out empty strings
      const rawBody = (req as any).body;

      // Validate that we have at least an ID (check both id and _id)
      const userId = rawBody.id || rawBody._id;
      if (!userId) {
        throw new Error("ID is required");
      }

      // Filter out empty strings and build update DTO
      const filteredData: any = { id: userId };

      if (rawBody.name && rawBody.name !== "") filteredData.name = rawBody.name;
      if (rawBody.email && rawBody.email !== "") filteredData.email = rawBody.email;
      if (rawBody.mobile && rawBody.mobile !== "") filteredData.mobile = rawBody.mobile;
      if (rawBody.role && rawBody.role !== "") filteredData.role = rawBody.role;
      if (rawBody.isActive !== undefined) filteredData.isActive = rawBody.isActive;
      if (rawBody.profilePic && rawBody.profilePic !== "") filteredData.profilePic = rawBody.profilePic;
      if (rawBody.crops) filteredData.crops = rawBody.crops;
      if (rawBody.companies) filteredData.companies = rawBody.companies;
      if (rawBody.addressLine1 && rawBody.addressLine1 !== "") filteredData.addressLine1 = rawBody.addressLine1;
      if (rawBody.addressLine2 && rawBody.addressLine2 !== "") filteredData.addressLine2 = rawBody.addressLine2;
      if (rawBody.labMaster) filteredData.labMaster = rawBody.labMaster;
      if (rawBody.entities) filteredData.entities = rawBody.entities;
      if (rawBody.area) filteredData.area = rawBody.area;
      if (rawBody.species) filteredData.species = rawBody.species;
      if (rawBody.projects) filteredData.projects = rawBody.projects;

      return await this.usersService.updateUser(
        filteredData as UpdateUserDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users endpoint (copied from original: POST /get-all-users)
   * Protected with JWT
   */
  @Post("get-all-users")
  @UseGuards(JwtAuthGuard)
  async getAllUsers(
    @Body() getAllUsersDto: GetAllUsersDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.getAllUsers(
        getAllUsersDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user details endpoint (copied from original: GET /details?id=xxx)
   */
  @Get("details")
  async getUserDetails(
    @Query() query: any,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      const id = query.id;
      if (!id) {
        throw new Error("User ID is required");
      }
      return await this.usersService.getUserDetails(
        id,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all users with pagination (copied from original: POST /list)
   */
  @Post("list")
  async getAllUsersWithPagination(
    @Body() paginationDto: GetUsersPaginationDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.getAllUsersWithPagination(
        paginationDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user endpoint (copied from original: POST /delete-user)
   * Protected with JWT
   */
  @Post("delete-user")
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Body() deleteUserDto: DeleteUserDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.deleteUser(
        deleteUserDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search users endpoint (copied from original: POST /search)
   */
  @Post("search")
  async queryUser(
    @Body() queryUserDto: QueryUserDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.queryUser(
        queryUserDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend password creation email (copied from original: POST /resend-pasword-creation-email)
   */
  @Post("resend-pasword-creation-email")
  async resendPasswordCreationEmail(
    @Body() resendPasswordDto: ResendPasswordDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
      return await this.usersService.resendPasswordCreationEmail(
        resendPasswordDto,
        companyName,
        dbConnection,
      );
    } catch (error) {
      throw error;
    }
  }
}
