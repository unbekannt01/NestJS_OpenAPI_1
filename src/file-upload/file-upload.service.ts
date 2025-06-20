import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SupaBaseService } from 'src/common/services/supabase.service';
import { UploadFile } from './entities/file-upload.entity';
import { Repository } from 'typeorm';
import { FileStorageService } from 'src/common/services/file-storage.service';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * FileUploadService
 * This service handles file upload operations.
 */
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger('FileUploadService');
  constructor(
    @InjectRepository(UploadFile)
    private readonly uploadRepo: Repository<UploadFile>,
    public readonly supaBaseService: SupaBaseService,
    public readonly cloudinaryService: CloudinaryService,
    public readonly fileStorageService: FileStorageService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // /**
  //  * handleFileUpload
  //  * This method handles the file upload process.
  //  */
  // handleFileUpload(file: Express.Multer.File) {
  //   if (!file) {
  //     throw new NotFoundException('File Not Found...!');
  //   }

  //   const allowedMimeTypes = [
  //     'image/jpg',
  //     'image/jpeg',
  //     'image/png',
  //     'application/pdf',
  //   ];
  //   if (!allowedMimeTypes) {
  //     throw new BadRequestException('Invalid MimeTypes...!');
  //   }

  //   const maxSize = 5 * 1024 * 1024;
  //   if (file.size > maxSize) {
  //     throw new BadRequestException('File is too Large...!');
  //   }

  //   return {
  //     message: 'File Uploaded Successfully...!',
  //     fileURLToPath: file.path,
  //   };
  // }

  // async uploadFile(
  //   file: Express.Multer.File,
  //   userId?: string,
  // ): Promise<string> {
  //   if (!file) {
  //     throw new BadRequestException('No file uploaded.');
  //   }

  //   const { buffer } = file;

  //   if (!buffer) {
  //     throw new BadRequestException('File buffer is missing.');
  //   }

  //   const { url: publicUrl, publicId } =
  //     await this.fileStorageService.upload(file);

  //   const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

  //   const alreadyExists = await this.uploadRepo.findOne({
  //     where: {
  //       fileHash,
  //       user: { id: userId },
  //     },
  //   });

  //   if (alreadyExists) {
  //     throw new UnauthorizedException('File already uploaded!');
  //   }

  //   const uploadFile = this.uploadRepo.create({
  //     file: publicUrl,
  //     publicId,
  //     originalName: file.originalname,
  //     mimeType: file.mimetype,
  //     fileHash,
  //     Creation: new Date(),
  //     user: { id: userId },
  //   });

  //   if (userId) {
  //     (uploadFile as any).user = { id: userId };
  //   }

  //   await this.uploadRepo.save(uploadFile);
  //   return `File uploaded successfully: ${publicUrl}`;
  // }

  async uploadFile(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const { buffer } = file;

    if (!buffer) {
      throw new BadRequestException('File buffer is missing.');
    }

    const { url: publicUrl, publicId } =
      await this.fileStorageService.upload(file);

    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const alreadyExists = await this.uploadRepo.findOne({
      where: {
        fileHash,
        user: { id: userId },
      },
    });

    if (alreadyExists) {
      throw new UnauthorizedException('File already uploaded!');
    }

    const uploadFile = this.uploadRepo.create({
      file: publicUrl,
      publicId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileHash,
      Creation: new Date(),
      user: { id: userId },
    });

    if (userId) {
      (uploadFile as any).user = { id: userId };
    }

    await this.uploadRepo.save(uploadFile);

    // Refresh the cache after saving
    const cacheKey = 'all-files';
    const allFiles = await this.uploadRepo.find({
      order: { Creation: 'DESC' },
      relations: ['user'],
    });

    await this.cacheManager.set(cacheKey, allFiles);
    this.logger.log(`Cache UPDATED for key: ${cacheKey} after upload`);

    return `File uploaded successfully: ${publicUrl}`;
  }

  async deleteFile(id: string, userId: string) {
    const file = await this.uploadRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!file) {
      throw new NotFoundException(
        'File not found or you do not have permission to delete it.',
      );
    }

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      await this.supaBaseService.deleteFile(file.file);
    } else if (driver === 'cloudinary' && file.publicId) {
      await this.cloudinaryService.deleteFile(file.publicId);
    } else {
      // local fallback
      const filePath = path.resolve(
        process.cwd(),
        file.file.replace(/^\/+/, ''),
      );
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }

    await this.uploadRepo.delete(id);
    return { message: 'File has been deleted...!' };
  }

  // async getFileById(fileId: string): Promise<Buffer> {
  //   const file = await this.uploadRepo.findOne({ where: { id: fileId } });

  //   if (!file) throw new NotFoundException('File not found');

  //   const driver = process.env.STORAGE_DRIVER;

  //   if (driver === 'supabase') {
  //     const buffer = await this.supaBaseService.getFileById(file.file);
  //     if (!buffer) throw new NotFoundException('File not found in storage');
  //     return buffer;
  //   }

  //   // Local fallback
  //   const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
  //   if (!fs.existsSync(filePath))
  //     throw new NotFoundException('File missing locally');
  //   return fs.readFileSync(filePath);
  // }

  async getFileById(fileId: string): Promise<Buffer> {
    const file = await this.uploadRepo.findOne({ where: { id: fileId } });

    if (!file) throw new NotFoundException('File not found');

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'cloudinary') {
      throw new BadRequestException(
        'Direct file download is not supported for Cloudinary. Use public URL instead.',
      );
    }

    if (driver === 'supabase') {
      const buffer = await this.supaBaseService.getFileById(file.file);
      if (!buffer) throw new NotFoundException('File not found in storage');
      return buffer;
    }

    // Local fallback
    const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File missing locally');
    }
    return fs.readFileSync(filePath);
  }

  // async getFileMetaById(id: string): Promise<UploadFile> {
  //   const file = await this.uploadRepo.findOne({ where: { id } });
  //   if (!file) {
  //     throw new NotFoundException('File not found');
  //   }
  //   return file;
  // }

  async getFileMetaById(id: string): Promise<UploadFile> {
    const cacheKey = `file-meta-${id}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<UploadFile>(cacheKey);
    if (cached) {
      this.logger?.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger?.log(`Cache MISS for key: ${cacheKey}`);

    // Fetch from DB
    const file = await this.uploadRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    // Save to cache with 5 min TTL
    await this.cacheManager.set(cacheKey, file, 300); // seconds

    return file;
  }

  async updateFile(
    fileId: string,
    newFile: Express.Multer.File,
    userId: string,
  ) {
    if (!newFile) throw new NotFoundException('New File Not Uploaded...!');

    const oldFile = await this.uploadRepo.findOne({
      where: {
        id: fileId,
        user: { id: userId },
      },
    });

    if (!oldFile) {
      throw new NotFoundException(
        'Old file deleted or you do not have permission to update it...!',
      );
    }

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      await this.supaBaseService.deleteFile(oldFile.file);
    } else if (driver === 'cloudinary') {
      if (oldFile.publicId) {
        await this.cloudinaryService.deleteFile(oldFile.publicId);
      }
    } else {
      const filePath = path.resolve(
        process.cwd(),
        oldFile.file.replace(/^\/+/, ''),
      );
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }

    const { url, publicId } = await this.fileStorageService.upload(newFile);

    oldFile.file = url;
    oldFile.publicId = publicId ?? '';
    oldFile.originalName = newFile.originalname;
    oldFile.mimeType = newFile.mimetype;
    oldFile.fileHash = crypto
      .createHash('sha256')
      .update(newFile.buffer)
      .digest('hex');
    oldFile.Updation = new Date();

    await this.uploadRepo.save(oldFile);

    return { message: 'File Updated Successfully...' };
  }

  async downloadFile(fileId: string) {
    if (!fileId) throw new BadRequestException('File ID not provided.');

    const file = await this.uploadRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found.');

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'cloudinary') {
      return {
        redirectUrl: file.file,
        fileName: file.originalName || 'file',
        mimeType: file.mimeType || 'application/octet-stream',
      };
    }

    if (driver === 'supabase') {
      const buffer = await this.getFileById(fileId);
      const extension = path.extname(file.file).split('?')[0];
      return {
        buffer,
        fileName: `file-${file.id}${extension}`,
        mimeType: file.mimeType || 'application/octet-stream',
        size: buffer.length,
      };
    }

    // Local fallback
    const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File does not exist on the server.');
    }

    return {
      filePath,
      fileName: path.basename(file.file),
      mimeType: file.mimeType || 'application/octet-stream',
      size: fs.statSync(filePath).size,
    };
  }

  async getAllFiles() {
    const cacheKey = 'all-files';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Cache MISS for key: ${cacheKey}`);
    const files = await this.uploadRepo.find();
    await this.cacheManager.set(cacheKey, files, 60);
    this.logger.log(`Cache SET for key: ${cacheKey}`);
    return files;
  }
}
