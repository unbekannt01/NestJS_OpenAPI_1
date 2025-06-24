import { Injectable, Logger } from '@nestjs/common';
import { configService } from './config.service';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class s3Service {
  private readonly driver = configService.getValue('STORAGE_DRIVER') || 'local';
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(s3Service.name);

  constructor() {
    this.s3Client = new S3Client({
      region: configService.getValue('AWS_REGION'),
      credentials: {
        accessKeyId: configService.getValue('AWS_ACCESSKEYID'),
        secretAccessKey: configService.getValue('AWS_SECRETACCESSKEY'),
      },
    });
    this.bucket = configService.getValue('AWS_BUCKETNAME');
  }

  async uploadBuffer(file: Express.Multer.File) {
    const ext = extname(file.originalname);
    const key = `${uuidv4()}${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(cmd);
    console.log('File Uploaded Successfully');
    return key;
  }

  async getSignedUrl(key: string): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, cmd, {
      expiresIn: 60 * 5,
    });
    return url;
  }

  async deleteFile(key: string): Promise<void> {
    const cmd = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(cmd);
    console.log('File Deleted Successfully From S3...!');
  }

  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    // Convert readable stream to Buffer
    const stream = response.Body as Readable;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  
}
