// file-storage.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { CloudinaryService } from './cloudinary.service';
import { SupabaseService } from './supabase.service';
import { S3Service } from './s3.service';

@Injectable()
export class FileStorageService implements IStorageProvider {
  private provider: IStorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinary: CloudinaryService,
    private readonly supabase: SupabaseService,
    private readonly s3: S3Service,
  ) {
    const driver = this.configService.get<string>('STORAGE_DRIVER');

    switch (driver) {
      case 'cloudinary':
        this.provider = this.cloudinary;
        break;
      case 'supabase':
        this.provider = this.supabase;
        break;
      case 's3':
        this.provider = this.s3;
        break;
      default:
        throw new Error(`Unsupported storage driver: ${driver}`);
    }
  }

  upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<UploadResult> {
    return this.provider.upload(file, fileType);
  }

  delete(publicId: string, mimeType: string): Promise<void> {
    if (typeof this.provider.delete === 'function') {
      return this.provider.delete(publicId, mimeType);
    }
    return Promise.reject(
      new Error('Delete method is not implemented by the storage provider.'),
    );
  }

  // getFile(publicId: string, mimeType: string): Promise<Buffer> {
  //   if (typeof this.provider.getFile === 'function') {
  //     return this.provider.getFile(publicId, mimeType);
  //   }
  //   return Promise.reject(
  //     new Error('getFile method is not implemented by the storage provider.'),
  //   );
  // }

  getSignedUrl(publicId: string, mimeType: string) {
    if (typeof this.provider.getSignedUrl === 'function') {
      return this.provider.getSignedUrl(publicId, mimeType);
    }
    return Promise.reject(
      new Error(
        'getSignedUrl method is not implemented by the storage provider.',
      ),
    );
  }
}
