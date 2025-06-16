import {
  BadRequestException,
  Injectable,
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
/**
 * FileUploadService
 * This service handles file upload operations.
 */
@Injectable()
export class FileUploadService {
  private readonly uploadRepo: Repository<UploadFile>;
  public readonly supaBaseService: SupaBaseService;
  public readonly fileStorageService: FileStorageService;

  constructor(
    @InjectRepository(UploadFile)
    uploadRepo: Repository<UploadFile>,
    supabaseService: SupaBaseService,
    fileStorageSrevice: FileStorageService,
  ) {
    (this.uploadRepo = uploadRepo),
      (this.supaBaseService = supabaseService),
      (this.fileStorageService = fileStorageSrevice);
  }

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

  async uploadFile(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const { filename, mimetype, buffer } = file;

    if (!buffer) {
      throw new BadRequestException('File buffer is missing.');
    }

    const publicUrl = await this.fileStorageService.upload(file);

    const alreadyExists = await this.uploadRepo.findOne({
      where: { file: publicUrl, user: { id: userId?.toString() } },
    });

    if (alreadyExists) {
      throw new UnauthorizedException(
        'File already used or uploaded in database!',
      );
    }

    const uploadFile = this.uploadRepo.create({
      file: publicUrl,
      Creation: new Date(),
    });

    if (userId) {
      (uploadFile as any).user = { id: userId };
    }

    await this.uploadRepo.save(uploadFile);
    return `File uploaded successfully: ${publicUrl}`;
  }

  async deleteFile(id: string, userId: string): Promise<string> {
    const file = await this.uploadRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!file) {
      throw new NotFoundException(
        'File not found or you do not have permission to delete it.',
      );
    }

    await this.supaBaseService.deleteFile(file.file);
    await this.uploadRepo.delete(id);
    return 'File has been deleted...!';
  }

  async getFileById(fileId: string): Promise<Buffer> {
    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      const file = await this.uploadRepo.findOne({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Extract file path from the URL
      const buffer = await this.supaBaseService.getFileById(file.file);
      if (!buffer) {
        throw new NotFoundException('File not found in storage');
      }
      return buffer;
    }

    // Local fallback
    const file = await this.uploadRepo.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
    const buffer = fs.readFileSync(filePath);

    return buffer;
  }

  async getFileMetaById(id: string): Promise<UploadFile> {
    const file = await this.uploadRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  // async updateFile(
  //   fileId: string,
  //   userId: string,
  //   newFile: Express.Multer.File,
  // ): Promise<string> {
  //   const file = await this.uploadRepo.findOne({ where: { id: fileId, user: { id: userId}} });

  //   if (!file) {
  //     throw new NotFoundException('File not found');
  //   }

  //   if (!newFile || !newFile.buffer) {
  //     throw new BadRequestException('New file buffer is missing.');
  //   }

  //   const updatedFileUrl = await this.supaBaseService.updateFile(
  //     file.file,
  //     newFile.buffer,
  //     newFile.originalname,
  //     newFile.mimetype,
  //   );

  //   file.file = updatedFileUrl;
  //   await this.uploadRepo.save(file);

  //   return `File updated successfully: ${updatedFileUrl}`;
  // }
}
