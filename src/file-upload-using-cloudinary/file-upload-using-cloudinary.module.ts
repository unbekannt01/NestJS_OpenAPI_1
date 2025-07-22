import { Module } from '@nestjs/common';
import { FileUploadUsingCloudinaryService } from './file-upload-using-cloudinary.service';
import { FileUploadUsingCloudinaryController } from './file-upload-using-cloudinary.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadFile])],
  controllers: [FileUploadUsingCloudinaryController],
  providers: [FileUploadUsingCloudinaryService, CloudinaryService],
  exports: [FileUploadUsingCloudinaryService]
})
export class FileUploadUsingCloudinaryModule {}
