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
import { FileStorageService } from 'src/common/services/file-storage.service';
import { Like, Repository } from 'typeorm';
import { UploadFile } from './entities/file-upload.entity';
import * as crypto from 'crypto';
import { getVersionedFileName } from 'src/common/utils/generateVersion.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(UploadFile)
    private readonly fileRepo: Repository<UploadFile>,
    private readonly storageService: FileStorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided');

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const existingFile = await this.fileRepo.findOne({
      where: {
        fileHash,
        user: { id: userId },
      },
    });

    if (existingFile) {
      throw new ConflictException({
        message: 'A file with identical content already exists.',
        existingFile: {
          id: existingFile.id,
          originalName: existingFile.originalName,
          url: existingFile.file,
          uploadedAt: existingFile.Creation,
        },
      });
    }

    const baseName = file.originalname.substring(
      0,
      file.originalname.lastIndexOf('.'),
    );
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const namePattern = `${baseName}%${ext}`;

    const existingFiles = await this.fileRepo.find({
      where: {
        originalName: Like(namePattern),
        user: { id: userId },
      },
      select: ['originalName'],
    });

    const versionedName = getVersionedFileName(
      file.originalname,
      existingFiles.map((f) => f.originalName),
    );

    const result = await this.storageService.upload({
      ...file,
      originalname: versionedName,
    });

    const fileEntity = this.fileRepo.create({
      file: result.url,
      publicId: result.publicId,
      originalName: versionedName,
      mimeType: file.mimetype,
      fileHash: fileHash,
      user: { id: userId },
      Creation: new Date(),
    });

    const savedFile = await this.fileRepo.save(fileEntity);
    await this.cacheManager.del('allFiles');
    await this.cacheManager.del(`fileMeta:${savedFile.id}`);
    await this.cacheManager.del(`signedUrl:${savedFile.id}`);
    return savedFile;
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

    if (typeof this.storageService.getSignedUrl === 'function') {
      const signedUrl = await this.storageService.getSignedUrl(
        file.publicId,
        file.mimeType,
      );
      const response = { signedUrl };
      await this.cacheManager.set(cacheKey, response, 60000);
      return response;
    }

    throw new InternalServerErrorException(
      'No method available to get the file',
    );
  }

  async deleteFile(id: string) {
    const file = await this.getFileMetaById(id);
    if (file.publicId) {
      await this.storageService.delete(file.publicId, file.mimeType);
    }
    await this.fileRepo.remove(file);
    await this.cacheManager.del('allFiles');
    await this.cacheManager.del(`fileMeta:${id}`);
    await this.cacheManager.del(`signedUrl:${id}`);
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
    const existing = await this.getFileMetaById(id);
    if (!file) throw new BadRequestException('No file provided');

    if (existing.publicId) {
      await this.storageService.delete(existing.publicId, existing.mimeType);
    }

    const result = await this.storageService.upload(file);

    existing.file = result.url;
    existing.publicId = result.publicId || '';
    existing.originalName = file.originalname;
    existing.mimeType = file.mimetype;
    existing.Updation = new Date();

    const updatedFile = await this.fileRepo.save(existing);
    await this.cacheManager.del('allFiles');
    return updatedFile;
  }
}
