// supabase.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { configService } from './config.service';

@Injectable()
export class SupabaseService implements IStorageProvider {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    const storageDriver = configService.getValue('STORAGE_DRIVER');
    if (storageDriver === 'supabase') {
      this.supabase = createClient(
        configService.getValue('SUPABASE_URL')!,
        configService.getValue('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      this.bucketName = configService.getValue('SUPABASE_BUCKET')!;
    }
  }

  async upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<UploadResult> {
    const sanitizedFilename = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    const filePath = `${fileType}/${Date.now()}-${sanitizedFilename}`;

    try {
      console.log('Uploading to Supabase...!');

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            fileType: fileType,
          },
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new InternalServerErrorException(
          `Upload failed: ${error.message}`,
        );
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('Successfully uploaded to Supabase!');

      return {
        url: publicUrlData.publicUrl,
        publicId: filePath,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException(
        `Failed to upload: ${error.message}`,
      );
    }
  }

  async delete(publicId: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([publicId]);
    console.log('Deleted From SupaBase...!');
    if (error) throw new InternalServerErrorException(error.message);
  }

  async getSignedUrl(publicId: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(publicId, 60, {
        download: publicId.split('/').pop(),
      });

    if (error) throw new InternalServerErrorException(error.message);

    return data.signedUrl;
  }
}
