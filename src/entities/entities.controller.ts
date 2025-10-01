import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { EntitiesService } from "./entities.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateEntityDto,
  UpdateEntityDto,
  ConfigEntityDto,
  EntityListDto,
  VerifyEntityDto,
} from "./dto/entity.dto";

@Controller(":companyName/api/entity")
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post("create")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createEntity(
    @Param("companyName") companyName: string,
    @Body() createEntityDto: CreateEntityDto,
  ) {
    try {
      const data = await this.entitiesService.createEntity(
        companyName,
        createEntityDto,
      );
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("update")
  @UseGuards(JwtAuthGuard)
  async updateEntity(
    @Param("companyName") companyName: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    try {
      const data = await this.entitiesService.updateEntity(
        companyName,
        updateEntityDto,
      );
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("configure")
  @UseGuards(JwtAuthGuard)
  async configureEntity(
    @Param("companyName") companyName: string,
    @Body() configEntityDto: ConfigEntityDto,
  ) {
    try {
      const data = await this.entitiesService.configureEntity(
        companyName,
        configEntityDto,
      );
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get("details")
  async getEntityDetails(
    @Param("companyName") companyName: string,
    @Query("id") id?: string,
    @Query("entityCode") entityCode?: string,
    @Query("pathname") pathname?: string,
  ) {
    try {
      const data = await this.entitiesService.getEntityDetails(companyName, {
        id,
        entityCode: entityCode ? Number(entityCode) : undefined,
        pathname,
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("list")
  async getAllEntities(
    @Param("companyName") companyName: string,
    @Body() entityListDto: EntityListDto,
  ) {
    try {
      const result = await this.entitiesService.getAllEntities(
        companyName,
        entityListDto,
      );
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Delete("delete")
  @UseGuards(JwtAuthGuard)
  async deleteEntity(
    @Param("companyName") companyName: string,
    @Query("id") id: string,
  ) {
    try {
      const data = await this.entitiesService.deleteEntity(companyName, id);
      return { success: true, data, message: "Entity deleted successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("verify")
  async verifyEntity(
    @Param("companyName") companyName: string,
    @Body() verifyEntityDto: VerifyEntityDto,
  ) {
    try {
      const data = await this.entitiesService.verifyEntity(
        companyName,
        verifyEntityDto,
      );
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
