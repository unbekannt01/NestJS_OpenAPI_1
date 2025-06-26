// s3.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadResult,
} from '../../file-upload/providers/IStorageProvider';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements IStorageProvider {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
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
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: publicId,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileType: fileType,
        },
      });

      await this.s3.send(command);
      console.log('Uploaded to S3 Storage...!');

      return {
        url: `https://${this.bucket}.s3.amazonaws.com/${publicId}`,
        publicId: publicId,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException(
        `Failed to upload file to Supabase: ${error.message}`,
      );
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: publicId,
      });
      await this.s3.send(command);
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
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: publicId,
        ResponseContentDisposition: `attachment; filename="${publicId.split('/').pop()}"`,
      });
      return await getSignedUrl(this.s3, command, { expiresIn: 60 });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
