// file-upload.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { VideoController } from './video.controller';
import { ConfigModule } from '@nestjs/config';
import { UploadFile } from './entities/file-upload.entity';
import { GatewayService } from 'src/gateway/gateway.service';
import { MulterModule } from '@nestjs/platform-express';
import { SupabaseService } from 'src/common/services/supabase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadFile]),
    MulterModule.register({
      dest: './uploads',
    }),
    ConfigModule,
  ],
  controllers: [FileUploadController, VideoController],
  providers: [FileUploadService, SupabaseService, GatewayService],
})
export class FileUploadModule {}
