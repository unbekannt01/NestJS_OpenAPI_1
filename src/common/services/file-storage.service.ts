import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SupaBaseService } from './supabase.service';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly supabaseService: SupaBaseService,
  ) {}

  async upload(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Uploaded file is empty or invalid');
    }

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      return await this.supabaseService.uploadBuffer(
        file.originalname,
        file.buffer,
        file.mimetype,
      );
    }

    const uploadDir = process.env.UPLOADS_DIR || 'uploads/avatars';
    const filename = `${Date.now()}-${file.originalname}`;
    const fullPath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    return `/${uploadDir}/${filename}`;
  }
}
