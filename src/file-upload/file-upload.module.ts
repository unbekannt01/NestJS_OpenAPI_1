import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { SupaBaseService } from 'src/common/services/supabase.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFile } from './entities/file-upload.entity';
import { FileStorageService } from 'src/common/services/file-storage.service';

/**
 * FileUploadModule
 * This module is responsible for handling file uploads.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UploadFile]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, SupaBaseService, FileStorageService],
  exports: [FileStorageService]
})
export class FileUploadModule {}
