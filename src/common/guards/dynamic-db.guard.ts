import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { DynamicDbService } from "../../database/dynamic-db.service";
import { getCompanyName } from "../utils/company-name.extractor";

@Injectable()
export class DynamicDbGuard implements CanActivate {
  constructor(private readonly dynamicDbService: DynamicDbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { dbConnection?: any }>();

    try {
      const companyName = getCompanyName(request);

      if (!companyName || companyName === "undefined") {
        throw new HttpException(
          "Entity not found",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Check if entity is valid
      if (!this.dynamicDbService.isValidEntity(companyName)) {
        throw new HttpException("Entity not found", HttpStatus.NOT_FOUND);
      }

      // Get database connection for this company
      const dbConnection =
        await this.dynamicDbService.getDatabaseConnection(companyName);

      // Attach to request for use in controllers/services
      request.dbConnection = dbConnection;

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error("Error in DynamicDbGuard:", error);
      throw new HttpException(
        "Database connection error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
