import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { GenerateUploadUrlDto, DeleteFileDto } from './dto/upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller(':companyName/api/upload')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('mobile')
  async uploadMobile(@Req() req: Request, @Res() res: Response) {
    try {
      const fileName = this.uploadService.generateUniqueFileName(req.headers?.filename as string || 'file');
      const filePath = path.join(__dirname, fileName);
      const stream = fs.createWriteStream(filePath);

      stream.on('error', (err) => {
        throw new HttpException(
          { error: 'File stream error', details: err.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

      req.pipe(stream);

      stream.on('close', async () => {
        try {
          const location = await this.uploadService.uploadToS3(
            fileName,
            filePath,
            req.headers['content-type'] || 'application/octet-stream',
          );
          res.status(HttpStatus.OK).json({ location });
        } catch (error) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'S3 upload error',
            details: error.message,
          });
        } finally {
          await this.uploadService.cleanupTempFile(filePath);
        }
      });
    } catch (error) {
      throw new HttpException(
        { error: 'Upload failed', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async generateUploadUrl(@Body() generateUploadUrlDto: GenerateUploadUrlDto) {
    try {
      const { fileName, fileType } = generateUploadUrlDto;
      const result = await this.uploadService.generateSignedUrl(fileName, fileType);

      return {
        uploadURL: result.uploadURL,
        fileURL: result.fileURL,
      };
    } catch (error) {
      throw new HttpException(
        { error: 'Error generating upload URL', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  async deleteFile(@Body() deleteFileDto: DeleteFileDto) {
    try {
      const { url } = deleteFileDto;

      if (!url) {
        throw new HttpException(
          { error: 'File URL is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.uploadService.deleteFile(url);

      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new HttpException(
        { error: 'Error deleting file', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}