import {
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { DynamicDbGuard } from "../common/guards/dynamic-db.guard";
import {
  CompanyName,
  DatabaseConnection,
} from "../common/decorators/dynamic-db.decorator";
import { Connection } from "mongoose";

@Controller(":companyName/user-access")
@UseGuards(DynamicDbGuard)
export class UserAccessController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get user details by ID (path parameter version)
   * Matches Express: GET /:company/user-access/details/:id
   */
  @Get("details/:id")
  async getUserDetails(
    @Param("id") id: string,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    try {
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
}
