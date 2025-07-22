import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { SupabaseService } from './supabase.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FileStorageService implements IStorageProvider {
  private provider: IStorageProvider;

  constructor(
    private readonly configService: ConfigService,
    // private readonly supabase: SupabaseService,
    private readonly cloudinary: CloudinaryService,
    private readonly local: FileUploadService,
  ) {
    const driver = this.configService.get<string>('STORAGE_DRIVER');
    const env = this.configService.get<string>('NODE_ENV');

    switch (driver) {
      case 'cloudinary':
        this.provider = this.cloudinary;
        break;
      case 'local':
        this.provider = this.local;
        break;
      case undefined:
      case null:
        if (env === 'development') {
          this.provider = this.cloudinary;
          break;
        } else {
          throw new Error(`No STORAGE_DRIVER set and not in development mode.`);
        }
      default:
        throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
    }
  }

  upload(
    file: Express.Multer.File,
    userId?: string,
    fileType?: 'avatar' | 'general',
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
