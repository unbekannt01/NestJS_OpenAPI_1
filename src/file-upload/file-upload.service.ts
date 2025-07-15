// file-upload.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadFile } from './entities/file-upload.entity';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import path, { join } from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { UploadResult } from './providers/IStorageProvider';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(UploadFile)
    private readonly fileRepo: Repository<UploadFile>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async upload(
    file: Express.Multer.File,
    userId?: string,
    fileType?: 'avatar' | 'general',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = join(process.cwd(), 'uploads', file.filename);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await fsp.readFile(filePath);
    } catch (err) {
      throw new BadRequestException('Failed to read file from disk');
    }

    const fileHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    const existing = await this.fileRepo.findOne({
      where: {
        fileHash,
        user: { id: userId },
      },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Duplicate file already exists.',
        existingFile: {
          id: existing.id,
          originalName: existing.originalName,
          url: existing.file,
        },
      });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const fileEntity = this.fileRepo.create({
      file: fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileHash,
      created: new Date(),
      updated: new Date(),
      user: { id: userId },
    });

    const saved = await this.fileRepo.save(fileEntity);

    return {
      url: saved.file,
      publicId: saved.id,
      resourceType: 'raw',
    };
  }

  async getFileMetaById(id: string) {
    const cacheKey = `fileMeta:${id}`;
    const cached = await this.cacheManager.get<UploadFile>(cacheKey);
    if (cached) return cached;

    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    await this.cacheManager.set(cacheKey, file);
    return file;
  }

  async getFileById(id: string) {
    const cacheKey = `signedUrl:${id}`;
    const cached = await this.cacheManager.get<{ signedUrl: string }>(cacheKey);
    if (cached) return cached;

    const file = await this.getFileMetaById(id);

    throw new InternalServerErrorException(
      'No method available to get the file',
    );
  }

  async delete(publicId: string): Promise<void> {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'uploads',
      publicId,
    );
    await fs.promises.unlink(filePath).catch(() => null);
  }

  async getSignedUrl(publicId: string): Promise<string> {
    return `/uploads/${publicId}`;
  }

  async getAllFiles() {
    const cachedFiles = await this.cacheManager.get('allFiles');
    if (cachedFiles) {
      console.log('Redis HIT: allFiles');
      return cachedFiles;
    }
    console.log('Redis MISS: fetching from DB');

    const files = await this.fileRepo.find();
    await this.cacheManager.set('allFiles', files, 60000);
    return files;
  }

  async updateFile(id: string, file: Express.Multer.File, mimeType: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const existing = await this.getFileMetaById(id);

    if (existing.publicId) {
      const oldFilePath = path.resolve('uploads', existing.publicId);
      await fs.promises.unlink(oldFilePath).catch(() => null);
    }

    const uploadDir = path.resolve('uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const fileId = id;
    const fileName = `${fileId}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    const publicUrl = `/uploads/${fileName}`;

    existing.file = publicUrl;
    existing.publicId = fileName;
    existing.originalName = file.originalname;
    existing.mimeType = file.mimetype;
    existing.updated = new Date();

    const updatedFile = await this.fileRepo.save(existing);

    // await this.cacheManager.del('allFiles');
    // await this.cacheManager.del(`fileMeta:${id}`);
    // await this.cacheManager.del(`signedUrl:${id}`);

    return updatedFile;
  }
}
