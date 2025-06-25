import { Module } from '@nestjs/common';
import { FileUploadUsingSupabaseService } from './file-upload-using-supabase.service';
import { FileUploadUsingSupabaseController } from './file-upload-using-supabase.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { SupabaseService } from 'src/common/services/supabase.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadFile])],
  controllers: [FileUploadUsingSupabaseController],
  providers: [FileUploadUsingSupabaseService, SupabaseService],
})
export class FileUploadUsingSupabaseModule {}
