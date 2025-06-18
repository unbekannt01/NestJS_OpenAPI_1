import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryUploadService } from './cloudinary-upload.service';
import { memoryStorage } from 'multer';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller({ path: 'cloudinary', version: '1' })
export class CloudinaryController {
  constructor(private readonly uploadService: CloudinaryUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.upload(file);
    return { message: 'Uploaded to Cloudinary', url };
  }

  @Delete('delete')
  async deleteFile(@Body('publicId') publicId: string) {
    const result = await this.uploadService.delete(publicId);
    return { message: 'Deleted from Cloudinary', result };
  }
}
