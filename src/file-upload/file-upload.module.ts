// file-upload.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { VideoController } from './video.controller';

import { ConfigModule } from '@nestjs/config';
import { UploadFile } from './entities/file-upload.entity';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { SupabaseService } from 'src/common/services/supabase.service';
import { S3Service } from 'src/common/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadFile]), ConfigModule],
  controllers: [FileUploadController, VideoController],
  providers: [
    FileUploadService,
    FileStorageService,
    CloudinaryService,
    SupabaseService,
    S3Service,
  ],
})
export class FileUploadModule {}
