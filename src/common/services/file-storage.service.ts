import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SupaBaseService } from './supabase.service';
import { StorageDriver } from '../enum/storageDriver.enum';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly supabaseService: SupaBaseService,
    private readonly cloudinaryService?: CloudinaryService,
  ) {}

  async upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<{ url: string; publicId?: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Uploaded file is empty or invalid');
    }

    const driver = process.env.STORAGE_DRIVER || StorageDriver.LOCAL;

    switch (driver) {
      case StorageDriver.SUPABASE:
        const url = await this.supabaseService.uploadBuffer(
          file.originalname,
          file.buffer,
          file.mimetype,
        );
        return { url }; // no publicId needed

      case StorageDriver.CLOUDINARY:
        if (!this.cloudinaryService) {
          throw new BadRequestException('Cloudinary service is not available');
        }

        const cloudinaryResult = await this.cloudinaryService.uploadBuffer(
          file.originalname,
          file.buffer,
          file.mimetype,
        );

        if (!cloudinaryResult || !cloudinaryResult.secureUrl) {
          throw new BadRequestException('Failed to upload file to Cloudinary');
        }

        return {
          url: cloudinaryResult.secureUrl,
          publicId: cloudinaryResult.publicId,
        };

      case StorageDriver.LOCAL:
      default:
        const uploadDir =
          fileType === 'avatar'
            ? process.env.UPLOADS_DIR || 'uploads/avatars'
            : 'uploads';

        const filename = `${Date.now()}-${file.originalname}`;
        const fullPath = path.join(uploadDir, filename);

        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(fullPath, file.buffer);

        return {
          url: `/${uploadDir}/${filename}`,
        };
    }
  }
}

// @Injectable()
// export class FileStorageService {
//   constructor(private readonly supabaseService: SupaBaseService) {}

//   async upload(
//     file: Express.Multer.File,
//     fileType: 'avatar' | 'general' = 'general',
//   ): Promise<string> {
//     if (!file || !file.buffer) {
//       throw new BadRequestException('Uploaded file is empty or invalid');
//     }

//     const driver = process.env.STORAGE_DRIVER;

//     if (driver === 'supabase') {
//       return await this.supabaseService.uploadBuffer(
//         file.originalname,
//         file.buffer,
//         file.mimetype,
//       );
//     }

//     // For local storage, use different directories based on file type
//     const uploadDir =
//       fileType === 'avatar'
//         ? process.env.UPLOADS_DIR || 'uploads/avatars'
//         : 'uploads'; // General uploads go to uploads folder

//     const filename = `${Date.now()}-${file.originalname}`;
//     const fullPath = path.join(uploadDir, filename);

//     await fs.mkdir(uploadDir, { recursive: true });
//     await fs.writeFile(fullPath, file.buffer);

//     return `/${uploadDir}/${filename}`;
//   }
// }
