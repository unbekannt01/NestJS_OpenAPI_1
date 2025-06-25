import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('buffer-to-stream');
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { inferResourceType } from '../utils/resource-type.util';

@Injectable()
export class CloudinaryService implements IStorageProvider {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const mime = file.mimetype;

    let resourceType = inferResourceType(mime);

    if (mime.startsWith('video')) {
      resourceType = 'video';
    } else if (
      mime === 'application/pdf' ||
      mime === 'application/msword' ||
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/zip' ||
      mime === 'application/octet-stream'
    ) {
      resourceType = 'raw';
    }

    const result = await new Promise<UploadResult>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload failed: result is undefined'));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: resourceType,
          });
        },
      );
      toStream(file.buffer).pipe(upload);
    });
    console.log('Uploaded To Cloudinary...!');
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
