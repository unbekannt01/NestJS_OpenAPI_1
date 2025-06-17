import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SupaBaseService } from './supabase.service';
// import { S3Service } from './s3.service'; // optional, for S3
// import { CloudinaryService } from './cloudinary.service'; // optional
import { StorageDriver } from '../enum/storageDriver.enum';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly supabaseService: SupaBaseService,
    // private readonly s3Service?: S3Service,
    // private readonly cloudinaryService?: CloudinaryService,
  ) {}

  async upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Uploaded file is empty or invalid');
    }

    const driver = process.env.STORAGE_DRIVER || StorageDriver.LOCAL;

    switch (driver) {
      case StorageDriver.SUPABASE:
        return this.supabaseService.uploadBuffer(
          file.originalname,
          file.buffer,
          file.mimetype,
        );

      // case StorageDriver.S3:
      //   return this.s3Service?.uploadBuffer(
      //     file.originalname,
      //     file.buffer,
      //     file.mimetype,
      //   );

      // case StorageDriver.CLOUDINARY:
      //   return this.cloudinaryService?.uploadBuffer(
      //     file.originalname,
      //     file.buffer,
      //     file.mimetype,
      //   );

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

        return `/${uploadDir}/${filename}`;
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
