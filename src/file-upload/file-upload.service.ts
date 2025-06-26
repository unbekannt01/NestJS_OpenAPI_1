// file-upload.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { Like, Repository } from 'typeorm';
import { UploadFile } from './entities/file-upload.entity';
import * as crypto from 'crypto';
import { getVersionedFileName } from 'src/common/utils/generateVersion.utils';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(UploadFile)
    private readonly fileRepo: Repository<UploadFile>,
    private readonly storageService: FileStorageService,
  ) {}

  // async uploadFile(file: Express.Multer.File, userId: string) {
  //   if (!file) throw new BadRequestException('No file provided');

  //   const fileHash = crypto
  //     .createHash('sha256')
  //     .update(file.buffer)
  //     .digest('hex');

  //   // Check for duplicates BEFORE upload
  //   const existingFile = await this.fileRepo.findOne({
  //     where: {
  //       fileHash: fileHash,
  //       user: { id: userId },
  //     },
  //   });

  //   if (existingFile) {
  //     throw new ConflictException({
  //       message: 'A file with identical content already exists.',
  //       existingFile: {
  //         id: existingFile.id,
  //         originalName: existingFile.originalName,
  //         url: existingFile.file,
  //         uploadedAt: existingFile.Creation,
  //       },
  //     });
  //   }

  //   //  Only upload if no duplicates found
  //   const result = await this.storageService.upload(file);

  //   const fileEntity = this.fileRepo.create({
  //     file: result.url,
  //     publicId: result.publicId,
  //     originalName: file.originalname,
  //     mimeType: file.mimetype,
  //     fileHash: fileHash,
  //     user: { id: userId },
  //     Creation: new Date(),
  //   });

  //   return this.fileRepo.save(fileEntity);
  // }

  async uploadFile(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided');

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Check for exact duplicate (same hash)
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

    // Check for same-name files (to apply versioning)
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

    // Upload the file with versioned name
    const result = await this.storageService.upload({
      ...file,
      originalname: versionedName,
    });

    // Save to DB
    const fileEntity = this.fileRepo.create({
      file: result.url,
      publicId: result.publicId,
      originalName: versionedName,
      mimeType: file.mimetype,
      fileHash: fileHash,
      user: { id: userId },
      Creation: new Date(),
    });

    return this.fileRepo.save(fileEntity);
  }

  async getFileMetaById(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async getFileById(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    if (typeof this.storageService.getSignedUrl === 'function') {
      const signedUrl = await this.storageService.getSignedUrl(
        file.publicId,
        file.mimeType,
      );
      return { signedUrl };
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
  }

  async getAllFiles() {
    return this.fileRepo.find();
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

    return this.fileRepo.save(existing);
  }
}
