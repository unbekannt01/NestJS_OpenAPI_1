import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/common/services/s3.service';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadUsingS3Service {
  constructor(
    @InjectRepository(UploadFile)
    private readonly fileRepo: Repository<UploadFile>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided.');

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const alreadyExists = await this.fileRepo.findOne({
      where: { originalName: file.originalname, user: { id: userId } },
    });

    if (alreadyExists) {
      throw new BadRequestException('File with this name already exists.');
    }

    const uploadResult = await this.s3Service.upload(file);

    const fileEntity = this.fileRepo.create({
      file: uploadResult.url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      publicId: uploadResult.publicId,
      fileHash,
      Creation: new Date(),
      user: { id: userId },
    });
    await this.fileRepo.save(fileEntity);
  }

  async getFileMetaById(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async getFileById(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    const signedUrl = await this.s3Service.getSignedUrl(file.publicId);
    return { signedUrl };
  }

  async deleteFile(id: string) {
    const file = await this.getFileMetaById(id);
    if (file.publicId) {
      await this.s3Service.delete(file.publicId);
    }
    await this.fileRepo.remove(file);
  }

  async getAllFiles() {
    return this.fileRepo.find();
  }

  async updateFile(id: string, file: Express.Multer.File) {
    const existing = await this.getFileMetaById(id);
    if (!file) throw new BadRequestException('No file provided');

    if (existing.publicId) {
      await this.s3Service.delete(existing.publicId);
    }

    const result = await this.s3Service.upload(file);

    existing.file = result.url;
    existing.publicId = result.publicId || '';
    existing.originalName = file.originalname;
    existing.mimeType = file.mimetype;
    existing.Updation = new Date();

    await this.fileRepo.save(existing);
  }

  // async deleteFileFromS3(key: string): Promise<string> {
  //   await this.s3Service.delete(key);
  //   return `File with key '${key}' deleted from S3.`;
  // }
}
