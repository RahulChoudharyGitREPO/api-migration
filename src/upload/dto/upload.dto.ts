import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class GenerateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;
}

export class DeleteFileDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;
}