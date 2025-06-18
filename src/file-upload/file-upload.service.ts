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
import * as crypto from 'crypto';

/**
 * FileUploadService
 * This service handles file upload operations.
 */
@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(UploadFile)
    private readonly uploadRepo: Repository<UploadFile>,
    public readonly supaBaseService: SupaBaseService,
    public readonly fileStorageService: FileStorageService,
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

    const publicUrl = await this.fileStorageService.upload(file);

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

    await this.supaBaseService.deleteFile(file.file);
    await this.uploadRepo.delete(id);
    return { message: 'File has been deleted...!' };
  }

  async getFileById(fileId: string): Promise<Buffer> {
    const file = await this.uploadRepo.findOne({ where: { id: fileId } });

    if (!file) throw new NotFoundException('File not found');

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      const buffer = await this.supaBaseService.getFileById(file.file);
      if (!buffer) throw new NotFoundException('File not found in storage');
      return buffer;
    }

    // Local fallback
    const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath))
      throw new NotFoundException('File missing locally');
    return fs.readFileSync(filePath);
  }

  async getFileMetaById(id: string): Promise<UploadFile> {
    const file = await this.uploadRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }
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

    if (!oldFile)
      throw new NotFoundException(
        'Old file deleted or you do not have to permission to delete it...!',
      );

    await this.supaBaseService.deleteFile(oldFile.file);

    // Upload new file and update all relevant fields
    const publicUrl = await this.fileStorageService.upload(newFile);

    oldFile.file = publicUrl;
    oldFile.originalName = newFile.originalname; // <-- update originalName
    oldFile.mimeType = newFile.mimetype;         // <-- update mimeType
    oldFile.fileHash = require('crypto').createHash('sha256').update(newFile.buffer).digest('hex'); // <-- update fileHash
    oldFile.Updation = new Date();

    await this.uploadRepo.save(oldFile);

    return { message: 'File Updated Successfully...' };
  }

  async downloadFile(fileId: string) {
    if (!fileId) throw new BadRequestException('File ID not provided.');

    const file = await this.uploadRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found.');

    const driver = process.env.STORAGE_DRIVER;

    if (driver === 'supabase') {
      const buffer = await this.getFileById(fileId);
      const extension = path.extname(file.file).split('?')[0]; // Strip query from signed URL
      return {
        buffer,
        fileName: `file-${file.id}${extension}`,
        mimeType: file.file.includes('.jpg, .png, .jpeg')
          ? 'image/jpeg'
          : 'application/octet-stream',
        size: buffer.length,
      };
    }

    // Fallback for local
    const filePath = path.resolve(process.cwd(), file.file.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File does not exist on the server.');
    }
    return {
      filePath,
      fileName: path.basename(file.file),
      mimeType: file.file.split('.').pop() || 'application/octet-stream',
      size: fs.statSync(filePath).size,
    };
  }

  async getAllFiles() {
    return this.uploadRepo.find({
      order: { Creation: 'DESC' },
      relations: ['user'],
    });
  }
}
