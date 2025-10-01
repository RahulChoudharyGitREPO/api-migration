import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Connection, createConnection } from "mongoose";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DynamicDbService implements OnModuleDestroy {
  private baseDBConnection: Connection | null = null;
  private entityCache: Record<string, boolean> = {};
  private dbConnections: Record<string, Connection> = {};
  private readonly IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    this.initializeBaseConnection();
    this.startCleanupCycle();
  }

  private async initializeBaseConnection(): Promise<void> {
    try {
      const mongoUri = this.configService.get<string>("MONGODB_URI");
      if (!mongoUri) {
        throw new Error("MONGODB_URI not configured");
      }

      const baseDbUrl = mongoUri.substring(0, mongoUri.lastIndexOf("/") + 1);
      const defaultDbName =
        process.env.NODE_ENV === "production" ? "prod" : "dev";

      console.log("Connecting to the base database...");
      this.baseDBConnection = createConnection(`${baseDbUrl}${defaultDbName}`, {
        bufferCommands: false,
      });

      await new Promise<void>((resolve, reject) => {
        this.baseDBConnection!.once("connected", resolve);
        this.baseDBConnection!.once("error", reject);
      });

      console.log("Connected to the base database!");
      this.entityCache[defaultDbName] = true;
      await this.refreshEntityCache();
    } catch (error) {
      console.error("Failed to connect to base database:", error);
      this.baseDBConnection = null;
      throw new Error("Base database connection error");
    }
  }

  private async refreshEntityCache(): Promise<void> {
    try {
      if (!this.baseDBConnection) {
        await this.initializeBaseConnection();
      }

      // Create a simple entity model to query entities
      const entitySchema = new this.baseDBConnection!.base.Schema({
        basePath: String,
      });

      const EntityModel = this.baseDBConnection!.model(
        "Entity",
        entitySchema,
        "entities",
      );
      const entities = await EntityModel.find(
        {},
        { basePath: 1, _id: 0 },
      ).lean();

      // Update cache with fresh data
      const defaultDbName =
        process.env.NODE_ENV === "production" ? "prod" : "dev";
      this.entityCache = { [defaultDbName]: true };

      entities.forEach((entity: any) => {
        this.entityCache[entity.basePath.replace("/", "")] = true;
      });

      console.log("Entity cache updated:", Object.keys(this.entityCache));
    } catch (error) {
      console.error("Error refreshing entity cache:", error);
    }
  }

  async getDatabaseConnection(companyName: string): Promise<Connection> {
    // Ensure base connection is established
    if (!this.baseDBConnection) {
      console.log("BaseDB connection was lost. Reconnecting...");
      await this.initializeBaseConnection();
    }

    // Check if the entity exists in the cache
    if (!this.entityCache[companyName]) {
      throw new Error("Entity not found");
    }

    // Use cached DB connection or create a new one
    if (!this.dbConnections[companyName]) {
      const mongoUri = this.configService.get<string>("MONGODB_URI");
      if (!mongoUri) {
        throw new Error("MONGODB_URI not configured");
      }
      const baseDbUrl = mongoUri.substring(0, mongoUri.lastIndexOf("/") + 1);

      this.dbConnections[companyName] = createConnection(
        `${baseDbUrl}${companyName}`,
        {
          bufferCommands: false,
        },
      );

      await new Promise<void>((resolve, reject) => {
        this.dbConnections[companyName].once("connected", resolve);
        this.dbConnections[companyName].once("error", reject);
      });

      console.log(`Connected to: ${companyName}`);
    }

    return this.dbConnections[companyName];
  }

  // Alias method for compatibility with entity service
  async getConnection(companyName: string): Promise<Connection> {
    return this.getDatabaseConnection(companyName);
  }

  // Get connection by full database URL
  async getConnectionByUrl(dbUrl: string): Promise<Connection> {
    const dbName = dbUrl.split("/").pop() || "default";

    if (!this.dbConnections[dbName]) {
      this.dbConnections[dbName] = createConnection(dbUrl, {
        bufferCommands: false,
      });

      await new Promise<void>((resolve, reject) => {
        this.dbConnections[dbName].once("connected", resolve);
        this.dbConnections[dbName].once("error", reject);
      });

      console.log(`Connected to: ${dbName} via URL`);
    }

    return this.dbConnections[dbName];
  }

  // Get database configuration URL
  async getDbConfig(companyName: string): Promise<string> {
    const mongoUri = this.configService.get<string>("MONGODB_URI");
    if (!mongoUri) {
      throw new Error("MONGODB_URI not configured");
    }
    const baseDbUrl = mongoUri.substring(0, mongoUri.lastIndexOf("/") + 1);
    return `${baseDbUrl}${companyName}`;
  }

  // List databases for a company
  async listDatabases(companyName: string): Promise<Array<{ name: string }>> {
    const connection = await this.getDatabaseConnection(companyName);
    if (!connection.db) {
      throw new Error("Database connection not established");
    }
    const admin = connection.db.admin();
    const result = await admin.listDatabases();
    return result.databases;
  }

  isValidEntity(companyName: string): boolean {
    return !!this.entityCache[companyName];
  }

  private startCleanupCycle(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60 * 1000); // Run every minute
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();

    Object.keys(this.dbConnections).forEach((companyName) => {
      const connection = this.dbConnections[companyName];
      // For simplicity, we'll keep connections alive for now
      // In production, you might want to track last used timestamps
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all connections
    if (this.baseDBConnection) {
      await this.baseDBConnection.close();
    }

    for (const connection of Object.values(this.dbConnections)) {
      await connection.close();
    }
  }
}
