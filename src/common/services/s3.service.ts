// s3.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';

@Injectable()
export class S3Service implements IStorageProvider {
  private s3: S3;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: configService.get<string>('AWS_REGION') ?? '',
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESSKEYID') ?? '',
        secretAccessKey: configService.get<string>('AWS_SECRETACCESSKEY') ?? '',
      },
    });

    this.bucket = configService.get<string>('AWS_BUCKETNAME') ?? '';
  }

  async upload(
    file: Express.Multer.File,
    fileType: 'avatar' | 'general' = 'general',
  ): Promise<UploadResult> {
    const publicId = `${fileType}/${Date.now()}-${file.originalname}`;

    try {
      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: publicId,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();
      console.log('Uploaded To S3...!')
      return {
        url: `https://${this.bucket}.s3.amazonaws.com/${publicId}`,
        publicId: publicId,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: publicId,
        })
        .promise();
      console.log('Deleted From S3...!');
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // async getFile(publicId: string): Promise<Buffer> {
  //   try {
  //     const data = await this.s3
  //       .getObject({
  //         Bucket: this.bucket,
  //         Key: publicId,
  //       })
  //       .promise();
  //     return data.Body as Buffer;
  //   } catch (error) {
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  async getSignedUrl(publicId: string): Promise<string> {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: publicId,
        Expires: 60,
        ResponseContentDisposition: `attachment; filename="${publicId.split('/').pop()}"`,
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
