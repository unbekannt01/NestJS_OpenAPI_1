import { Module } from '@nestjs/common';
import { FileUploadUsingS3Service } from './file-upload-using-s3.service';
import { FileUploadUsingS3Controller } from './file-upload-using-s3.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { S3Service } from 'src/common/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadFile])],
  controllers: [FileUploadUsingS3Controller],
  providers: [FileUploadUsingS3Service, S3Service],
})
export class FileUploadUsingS3Module {}
