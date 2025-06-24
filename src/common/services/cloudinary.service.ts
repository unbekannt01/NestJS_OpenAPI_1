/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, v2 } from 'cloudinary';
import { Readable } from 'stream';
import { configService } from './config.service';
import { error } from 'console';
import toStream from 'buffer';

interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly driver = configService.getValue('STORAGE_DRIVER') || 'local';

  constructor() {
    cloudinary.config({
      cloud_name: configService.getValue('CLOUDINARY_CLOUD_NAME', true),
      api_key: configService.getValue('CLOUDINARY_API_KEY', true),
      api_secret: configService.getValue('CLOUDINARY_API_SECRET', true),
    });
  }

  /**
   * Upload a file from a buffer to Cloudinary
   */
  async uploadBuffer(
    filename: string,
    buffer: Buffer,
    mimeType: string,
    folder = 'uploads',
  ): Promise<CloudinaryUploadResult> {
    if (this.driver !== 'cloudinary') {
      throw new Error('Cloudinary upload is not enabled in this environment');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename.split('.')[0],
          resource_type: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(error || new Error('Upload failed'));
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  }

  // async upload(file: Express.Multer.File) {
  //   return new Promise((resolve, reject) => {
  //     const upload = v2.uploader.upload_stream((error, result) => {
  //       if (error) return reject(error);
  //       resolve(result);
  //     });
  //     toStream(file.buffer).pipe(upload);
  //   });
  // }

  /**
   * Delete a file using its Cloudinary public ID or URL
   */
  async deleteFile(fileUrlOrPublicId: string): Promise<void> {
    if (this.driver !== 'cloudinary') {
      throw new Error('Cloudinary delete is not enabled in this environment');
    }

    // Extract publicId from URL if a full Cloudinary URL is passed
    let publicId = fileUrlOrPublicId;
    if (fileUrlOrPublicId.includes('cloudinary.com')) {
      const urlParts = fileUrlOrPublicId.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      publicId = fileNameWithExt.split('.')[0];
    }

    // Try deleting as image first
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    // If not found, try as video
    if (result.result !== 'ok') {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });
    }

    if (result.result !== 'ok') {
      throw new BadRequestException('Cloudinary delete failed');
    }

    console.log('Deleted from Cloudinary:', publicId);
  }

  // update a file using its Cloudinary public ID or URL
  async updateFile(
    publicId: string,
    newFile: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    if (this.driver !== 'cloudinary') {
      throw new Error('Cloudinary update is not enabled in this environment');
    }
    if (!newFile || !newFile.buffer) {
      throw new BadRequestException('New file is empty or invalid');
    }
    // Delete the old file first
    await this.deleteFile(publicId);
    // Upload the new file
    const uploadResult = await this.uploadBuffer(
      newFile.originalname,
      newFile.buffer,
      newFile.mimetype,
      'uploads',
    );
    return uploadResult;
  }

  /**
   * Generate a public URL from a stored public ID
   */
  getPublicUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }
}
