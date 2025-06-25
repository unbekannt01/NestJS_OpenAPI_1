// supabase.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';

@Injectable()
export class SupabaseService implements IStorageProvider {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET')!;
  }

  async upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<UploadResult> {
    const filePath = `${fileType}/${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new InternalServerErrorException(error.message);

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    console.log('Uploading To SupaBase...!');

    return {
      url: publicUrlData.publicUrl,
      publicId: filePath,
    };
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
