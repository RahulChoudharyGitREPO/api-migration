import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private s3Bucket: AWS.S3;
  private s3BucketMobile: AWS.S3;
  private readonly bucketName = 'sgiapp';

  constructor(private configService: ConfigService) {
    this.s3Bucket = new AWS.S3({
      accessKeyId: this.configService.get<string>('Access_Key'),
      secretAccessKey: this.configService.get<string>('Secret_Key'),
      signatureVersion: 'v4',
    });

    this.s3BucketMobile = new AWS.S3({
      accessKeyId: this.configService.get<string>('Access_Key'),
      secretAccessKey: this.configService.get<string>('Secret_Key'),
      params: { Bucket: this.bucketName },
    });
  }

  async uploadToS3(fileName: string, filePath: string, contentType: string): Promise<string> {
    const readStream = fs.createReadStream(filePath);

    const params = {
      Bucket: this.bucketName,
      Key: `uploads/${fileName}`,
      Body: readStream,
      ContentType: contentType,
    };

    return new Promise((resolve, reject) => {
      this.s3BucketMobile.upload(params, (err, data) => {
        readStream.destroy();
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      });
    });
  }

  async generateSignedUrl(fileName: string, fileType: string): Promise<{ uploadURL: string; fileURL: string }> {
    const params = {
      Bucket: this.bucketName,
      Key: `uploads/${fileName}`,
      Expires: 60, // URL expires in 60 seconds
      ContentType: fileType,
    };

    const uploadURL = await this.s3Bucket.getSignedUrlPromise('putObject', params);

    return {
      uploadURL,
      fileURL: `https://${this.bucketName}.s3.amazonaws.com/uploads/${fileName}`,
    };
  }

  async deleteFile(url: string): Promise<void> {
    const fileKey = this.extractFileKeyFromUrl(url);

    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    await this.s3Bucket.deleteObject(params).promise();
  }

  private extractFileKeyFromUrl(url: string): string {
    // Assuming the URL structure is: https://<bucket-name>.s3.amazonaws.com/<key>
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Extracting the key part from the URL
  }

  generateUniqueFileName(originalFileName: string): string {
    const timestamp = new Date().getTime();
    const randomString = (Math.random() + 1).toString(36).substring(7);
    return `${timestamp}${randomString}${originalFileName}`;
  }

  async cleanupTempFile(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err.message);
        } else {
          console.log('File deleted successfully.');
        }
        resolve();
      });
    });
  }
}