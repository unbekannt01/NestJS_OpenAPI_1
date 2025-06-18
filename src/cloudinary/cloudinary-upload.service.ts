import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class CloudinaryUploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async upload(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is empty or invalid');
    }

    const result = await this.cloudinaryService.uploadBuffer(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return result.secure_url;
  }

  async delete(publicId: string) {
    return this.cloudinaryService.deleteFile(publicId);
  }
}
