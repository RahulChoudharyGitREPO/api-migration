import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Model, Types } from "mongoose";
import { Entity } from "./schemas/entity.schema";
import { User } from "../auth/schemas/user.schema";
import {
  CreateEntityDto,
  UpdateEntityDto,
  ConfigEntityDto,
  EntityListDto,
  VerifyEntityDto,
} from "./dto/entity.dto";
import { DynamicDbService } from "../database/dynamic-db.service";
import * as crypto from "crypto";

@Injectable()
export class EntitiesService {
  constructor(private readonly dynamicDbService: DynamicDbService) {}

  private async getEntityModel(companyName: string): Promise<Model<Entity>> {
    const connection =
      await this.dynamicDbService.getDatabaseConnection(companyName);
    return connection.model<Entity>(
      "Entity",
      require("./schemas/entity.schema").EntitySchema,
    );
  }

  private async getUserModel(dbUrl: string): Promise<Model<User>> {
    const connection = await this.dynamicDbService.getConnectionByUrl(dbUrl);
    return connection.model<User>(
      "User",
      require("../auth/schemas/user.schema").UserSchema,
    );
  }

  private async encryptPassword(password: string): Promise<string> {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  private async createDatabase(
    companyName: string,
    createEntityDto: CreateEntityDto,
  ): Promise<string> {
    try {
      // For now, we'll create a simplified version that doesn't create new databases
      // Instead, we'll store the entity info in the main database
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new BadRequestException("MONGODB_URI not configured");
      }

      const baseDbUrl = mongoUri.substring(0, mongoUri.lastIndexOf("/") + 1);
      const newUri = baseDbUrl + createEntityDto.basePath.replace("/", "");

      // Create new database connection and entity
      const newConnection =
        await this.dynamicDbService.getConnectionByUrl(newUri);
      const EntityModel = newConnection.model<Entity>(
        "Entity",
        require("./schemas/entity.schema").EntitySchema,
      );

      const newEntity = new EntityModel({
        dbUrl: newUri,
        entityCode: createEntityDto.entityCode,
        basePath: createEntityDto.basePath,
        name: createEntityDto.name,
        info: createEntityDto.info,
        email: createEntityDto.email,
        phone: createEntityDto.phone,
        district: createEntityDto.district,
        state: createEntityDto.state,
        gst: createEntityDto.gst,
        adminEmail: createEntityDto.adminEmail,
        category: createEntityDto.category,
        isActive: createEntityDto.isActive ?? true,
      });

      await newEntity.save();

      // Create default admin user
      const UserModel = newConnection.model<User>(
        "User",
        require("../auth/schemas/user.schema").UserSchema,
      );

      const firstEncryption = await this.encryptPassword(
        `${createEntityDto.entityCode}`,
      );
      const password = await this.encryptPassword(firstEncryption);

      const newUser = new UserModel({
        name: createEntityDto.name,
        email: createEntityDto.email,
        password: password,
        mobile: createEntityDto.phone,
        role: "SuperAdmin",
      });

      await newUser.save();

      return newUri;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createEntity(
    companyName: string,
    createEntityDto: CreateEntityDto,
  ): Promise<Entity> {
    const EntityModel = await this.getEntityModel(companyName);

    // Check for existing entity code
    const existingEntityCode = await EntityModel.findOne({
      entityCode: createEntityDto.entityCode,
    });

    if (existingEntityCode) {
      throw new BadRequestException(
        "Entity with same entityCode already exists!",
      );
    }

    // Check for existing base path
    const existingEntityBasepath = await EntityModel.findOne({
      basePath: createEntityDto.basePath,
    });

    if (existingEntityBasepath) {
      throw new BadRequestException("Entity with same path already exists!");
    }

    // Create new database for entity
    const dbUrl = await this.createDatabase(companyName, createEntityDto);

    // Create entity record in main database
    const entity = new EntityModel({
      ...createEntityDto,
      dbUrl,
    });

    return entity.save();
  }

  async updateEntity(
    companyName: string,
    updateEntityDto: UpdateEntityDto,
  ): Promise<Entity> {
    const EntityModel = await this.getEntityModel(companyName);

    if (!Types.ObjectId.isValid(updateEntityDto.id)) {
      throw new BadRequestException("Invalid entity ID!");
    }

    // Check for existing entity code (excluding current entity)
    const existingEntityCode = await EntityModel.findOne({
      entityCode: updateEntityDto.entityCode,
      _id: { $ne: updateEntityDto.id },
    });

    if (existingEntityCode) {
      throw new BadRequestException(
        "Entity with same entityCode already exists!",
      );
    }

    // Check for existing base path (excluding current entity)
    const existingEntityBasepath = await EntityModel.findOne({
      basePath: updateEntityDto.basePath,
      _id: { $ne: updateEntityDto.id },
    });

    if (existingEntityBasepath) {
      throw new BadRequestException("Entity with same path already exists!");
    }

    const { id, ...updateData } = updateEntityDto;

    const result = await EntityModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      throw new NotFoundException("Entity not found!");
    }

    return result;
  }

  async configureEntity(
    companyName: string,
    configEntityDto: ConfigEntityDto,
  ): Promise<Entity> {
    const EntityModel = await this.getEntityModel(companyName);

    if (!Types.ObjectId.isValid(configEntityDto.id)) {
      throw new BadRequestException("Invalid entity ID!");
    }

    const result = await EntityModel.findOneAndUpdate(
      { _id: configEntityDto.id, entityCode: configEntityDto.entityCode },
      { features: configEntityDto.features },
      { new: true, runValidators: true },
    );

    if (!result) {
      throw new NotFoundException("No entity records found!");
    }

    return result;
  }

  async getAllEntities(
    companyName: string,
    entityListDto: EntityListDto,
  ): Promise<{
    data: Entity[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    const EntityModel = await this.getEntityModel(companyName);

    const {
      page = 1,
      limit = 10,
      search,
      sort,
      sortby = "desc",
      deleted,
      includeDeleted,
    } = entityListDto;

    const filters: any = {};

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filters.$or = [
        { name: searchRegex },
        { entityCode: searchRegex },
        { info: searchRegex },
      ];
    }

    // Deleted filter
    if (!includeDeleted) {
      filters.$or = [
        { deleted: deleted !== undefined ? deleted : false },
        { deleted: { $exists: false } },
      ];
    }

    // Sort
    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort] = sortby === "desc" ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Count total documents
    const total = await EntityModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    // Find entities with pagination
    const entities = await EntityModel.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: entities,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  async getEntityDetails(
    companyName: string,
    query: {
      id?: string;
      entityCode?: number;
      pathname?: string;
    },
  ): Promise<Entity> {
    // Handle hardcoded krisiyukta case
    if (query.pathname === "/krisiyukta") {
      return {
        _id: "678f397f75dcc01fc45f69c2",
        __v: 0,
        adminEmail: "testsuperadmin@yopmail.com",
        basePath: "/krisiyukta",
        category: "private",
        createdAt: "2025-01-21T06:06:55.379Z",
        crops: [],
        dbUrl:
          "mongodb+srv://coretech:sgi-coretech@cluster0.kmuuy.mongodb.net/dev",
        deleted: false,
        district: "Gautam buddh nagar",
        email: "testemailid@yopmail.com",
        entityCode: 100101,
        features: [],
        isActive: true,
        name: "Krisiyukta",
        phone: 8888888888,
        serviceUrl: "https://service.tracseed.com",
        state: "Uttar Pradesh",
        updatedAt: "2025-01-21T06:06:55.379Z",
      } as any;
    }

    const EntityModel = await this.getEntityModel(companyName);

    const { id, entityCode, pathname } = query;

    if (!(id || entityCode || pathname)) {
      throw new BadRequestException(
        "Entity ID or Entity code or pathname is required!",
      );
    }

    if (id && !Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid entity ID!");
    }

    const searchQuery = id
      ? { _id: id }
      : entityCode
        ? { entityCode: Number(entityCode) }
        : { basePath: pathname };

    const entity = await EntityModel.findOne(searchQuery);

    if (!entity) {
      throw new NotFoundException("Entity not found!");
    }

    return entity;
  }

  async deleteEntity(companyName: string, id: string): Promise<Entity> {
    const EntityModel = await this.getEntityModel(companyName);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid entity ID!");
    }

    const entity = await EntityModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true, runValidators: true },
    );

    if (!entity) {
      throw new NotFoundException("Entity not found!");
    }

    return entity;
  }

  async verifyEntity(
    companyName: string,
    verifyEntityDto: VerifyEntityDto,
  ): Promise<Entity> {
    const EntityModel = await this.getEntityModel(companyName);

    const entity = await EntityModel.findOne({
      entityCode: verifyEntityDto.entityCode,
      deleted: false,
    });

    if (!entity) {
      throw new BadRequestException("Invalid entity code!");
    }

    return entity;
  }
}
