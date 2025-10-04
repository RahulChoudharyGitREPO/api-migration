import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;

@Injectable()
export class DrillService {
  private DBURL: string;
  private digestAuth: any;

  constructor(private configService: ConfigService) {
    this.DBURL = this.configService.get<string>('DRILL_URL') || '';
    this.digestAuth = new AxiosDigestAuth({
      username: this.configService.get<string>('ATLAS_PUBLIC_KEY'),
      password: this.configService.get<string>('ATLAS_PRIVATE_KEY'),
    });
  }

  async createAtlasUser(dbName: string): Promise<void> {
    const projectId = this.configService.get<string>('ATLAS_PROJECT_ID');

    try {
      const response = await this.digestAuth.request({
        method: 'POST',
        url: `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/databaseUsers`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          databaseName: 'admin',
          roles: [{ databaseName: dbName, roleName: 'readWrite' }],
          username: dbName,
          password: dbName,
        },
      });

      console.log('User created:', response.data);
    } catch (error) {
      console.error('Error creating user:', error.response?.data || error.message);
    }
  }

  async create(dbName: string): Promise<any> {
    if (!dbName) {
      throw new BadRequestException('dbName is required!');
    }

    const resp = await axios.get(`${this.DBURL}/storage.json`);
    const list = resp.data || [];

    const alreadyExists = list.find((i) => i.name === dbName);

    if (alreadyExists) {
      return { message: 'Already exists! No need to create.' };
    } else {
      await this.createAtlasUser(dbName);

      const mongoUrl = this.configService.get<string>('MONGO_URI') || '';
      const url = new URL(mongoUrl);

      url.username = dbName;
      url.password = dbName;

      const updatedUrl = url.href;

      console.log('updatedUrl', updatedUrl);

      const body = {
        name: dbName,
        config: {
          type: 'mongo',
          enabled: true,
          connection: `${updatedUrl}${dbName}`,
        },
      };

      const resp2 = await axios.post(`${this.DBURL}/storage/${dbName}.json`, body, {
        headers: { 'Content-Type': 'application/json' },
      });

      return { data: resp2.data };
    }
  }
}
