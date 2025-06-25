import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Injectable()
export class FileUploadUsingCloudinaryService {
  constructor(
    @InjectRepository(UploadFile)
    private readonly fileRepo: Repository<UploadFile>,
    private readonly cloudinaryService: CloudinaryService,
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

    const uploadResult = await this.cloudinaryService.upload(file);

    const fileEntity = this.fileRepo.create({
      file: uploadResult.url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      publicId: uploadResult.publicId,
      fileHash,
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

    const signedUrl = await this.cloudinaryService.getSignedUrl(
      file.publicId,
      file.mimeType,
    );
    return { signedUrl };
  }

  async deleteFile(id: string) {
    const file = await this.getFileMetaById(id);
    if (file.publicId) {
      await this.cloudinaryService.delete(file.publicId, file.mimeType);
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
      await this.cloudinaryService.delete(existing.publicId, existing.mimeType);
    }

    const result = await this.cloudinaryService.upload(file);

    existing.file = result.url;
    existing.publicId = result.publicId || '';
    existing.originalName = file.originalname;
    existing.mimeType = file.mimetype;
    existing.Updation = new Date();

    await this.fileRepo.save(existing);
  }
}
