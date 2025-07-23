import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('buffer-to-stream');
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { inferResourceType } from '../utils/resource-type.util';
import { configService } from './config.service';

@Injectable()
export class CloudinaryService implements IStorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: configService.getValue('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getValue('CLOUDINARY_API_KEY'),
      api_secret: configService.getValue('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<UploadResult> {
    // Validate file and buffer first
    if (!file || !file.buffer) {
      console.error('Invalid file or missing buffer:', file);
      throw new Error('Invalid file or missing buffer.');
    }

    const mime = file.mimetype;
    const resourceType = inferResourceType(mime);

    console.log('File received in CloudinaryService:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
    });

    const result = await new Promise<UploadResult>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload failed: result is undefined'));

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType,
          });
        },
      );

      toStream(file.buffer).pipe(upload);
    });

    console.log(`Uploaded to Cloudinary in folder "${folder}"`);
    return result;
  }

  async delete(publicId: string, mimeType: string): Promise<void> {
    const resourceType = inferResourceType(mimeType ?? '');
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log('Deleted From Cloudinary...!');
  }

  // async getSignedUrl(publicId: string, mimeType: string): Promise<Buffer> {
  //   const resourceType = inferResourceType(mimeType);

  //   const url = cloudinary.url(publicId, {
  //     secure: true,
  //     resource_type: resourceType,
  //   });

  //   try {
  //     const response = await axios.get(url, { responseType: 'arraybuffer' });
  //     return Buffer.from(response.data);
  //   } catch (error) {
  //     console.error('Cloudinary download failed:', {
  //       url,
  //       error: error.response?.data || error.message,
  //     });
  //     throw new Error('Could not download file from Cloudinary.');
  //   }
  // }

  async getSignedUrl(publicId: string, mimeType: string): Promise<string> {
    const resourceType = inferResourceType(mimeType);

    return cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      flags: 'attachment',
    });
  }
}
