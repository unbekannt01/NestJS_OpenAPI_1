import {
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { Public } from 'src/common/decorators/public.decorator';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { lookup as getMimeType } from 'mime-types';
import { SupaBaseService } from 'src/common/services/supabase.service';
import { Throttle } from '@nestjs/throttler';
import { createReadStream, existsSync, statSync } from 'fs';

/**
 * FileUploadController handles file upload and retrieval operations.
 */
@Public()
@Controller({ path: 'file-upload', version: '1' })
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly supaBaseService: SupaBaseService,
  ) {}

  /**
   * uploadFiles
   * This method handles file uploads.
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadFiles(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const user = request.user as { id: string };
    const uploaded = await this.fileUploadService.uploadFile(file, user.id);

    return {
      data: uploaded,
    };
  }

  @Get('getFile')
  getFile(@Query('fileName') fileName: string, @Res() res: Response) {
    if (!fileName) {
      throw new NotFoundException('File name is required');
    }
    const filePath = path.resolve(process.cwd(), 'uploads', fileName);

    return res.sendFile(filePath);
  }

  @Post('deleteFile/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteFile(@Param('id') id: string, @Req() request: Request) {
    try {
      const user = request.user as { id: string };
      if (!user?.id) {
        throw new NotFoundException('User not found');
      }

      await this.fileUploadService.deleteFile(id, user.id);
    } catch (error) {
      throw new NotFoundException(
        'File not found or you do not have to permission to delete it.',
      );
    }
  }

  // @Delete('s3/:key')
  // async deleteFromS3(@Param('key') key: string) {
  //   if (!key) throw new NotFoundException('File key not provided');

  //   const message = await this.fileUploadService.deleteFileFromS3(key);
  //   return { message };
  // }

  @Get('getFileById/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    try {
      const fileRecord = await this.fileUploadService.getFileMetaById(id);
      const buffer = await this.fileUploadService.getFileById(id);

      const fileName = fileRecord.file.split('/').pop();
      const mimeType =
        getMimeType(fileName || '') || 'application/octet-stream';

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      });

      return res.send(buffer);
    } catch (error) {
      throw new NotFoundException('File not found or error fetching it.');
    }
  }

  @Post('updateFile/:fileId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async updateFile(
    @Param('fileId') fileId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const user = request.user as { id: string };
    return this.fileUploadService.updateFile(fileId, file, user.id);
  }

  // @Get('download/:id')
  // async downloadFile(
  //   @Param('id') fileId: string,
  //   @Res({ passthrough: false }) res: Response,
  // ) {
  //   const fileMeta = await this.fileUploadService.getFileMetaById(fileId);
  //   if (!fileMeta) throw new NotFoundException('File metadata not found.');

  //   const buffer = await this.fileUploadService.getFileById(fileId);
  //   if (!buffer) throw new NotFoundException('File content not found.');

  //   const originalFileName =
  //     fileMeta.file.split('/').pop()?.split('?')[0] || `file-${fileMeta.id}`;
  //   const ext = path.extname(originalFileName);
  //   const mimeType = this.getMimeType(ext);

  //   res.setHeader(
  //     'Content-Type',
  //     fileMeta.mimeType,
  //   );
  //   res.setHeader(
  //     'Content-Disposition', `attachment; filename="${fileMeta.originalName || 'file'}"`,
  //   );
  //   res.setHeader('Content-Disposition', `inline; filename="${originalFileName}"`);

  //   res.setHeader('Content-Length', buffer.length);

  //   return res.end(buffer);
  // }

  // @Throttle({ default: { limit: 1, ttl: 60 * 1000 } })
  @UseGuards(AuthGuard('jwt'))
  @Get('download/:id')
  async downloadFile(
    @Param('id') fileId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const result = await this.fileUploadService.downloadFile(fileId);

    // If Cloudinary: redirect to public URL
    if ('redirectUrl' in result) {
      if (typeof result.redirectUrl === 'string') {
        return res.redirect(result.redirectUrl);
      } else {
        throw new NotFoundException('Redirect URL is not available.');
      }
    }

    // If Supabase: send buffer
    if ('buffer' in result) {
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );
      res.setHeader('Content-Length', result.size);
      return res.end(result.buffer);
    }

    // if S3: redirect to signed URL
    if ('signedUrl' in result) {
      return res.redirect(result.signedUrl as string);
    }

    //  If Local: use file path
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );
    res.setHeader('Content-Length', result.size);
    return res.sendFile(result.filePath);
  }

  @Get('getFileUrl/:id')
  async getFileUrl(@Param('id') id: string) {
    const fileMeta = await this.fileUploadService.getFileMetaById(id);
    const driver = process.env.STORAGE_DRIVER;

    let url: string;

    if (driver === 'cloudinary') {
      url = fileMeta.file;
    } else if (driver === 'supabase') {
      url = await this.supaBaseService.getSignedUrl(fileMeta.file);
    } else {
      // Local file URL (optional fallback)
      url = `${process.env.HOST_URL || 'http://localhost:3000'}/${fileMeta.file}`;
    }

    return {
      fileName: fileMeta.originalName,
      mimeType: fileMeta.mimeType,
      url,
    };
  }

  // private getMimeType(ext: string): string {
  //   const map = {
  //     '.jpg': 'image/jpeg',
  //     '.jpeg': 'image/jpeg',
  //     '.png': 'image/png',
  //     '.pdf': 'application/pdf',
  //     '.txt': 'text/plain',
  //   };
  //   return map[ext.toLowerCase()] || 'application/octet-stream';
  // }

  @Get('getAllFile')
  async getAllFile() {
    const files = await this.fileUploadService.getAllFiles();

    if (!Array.isArray(files)) {
      throw new Error('Expected files to be an array');
    }

    const enriched = await Promise.all(
      files.map(async (file) => {
        // const signedUrl = await this.supaBaseService.getSignedUrl(file.file);
        return {
          id: file.id,
          file: file.file,
          originalName: file.originalName,
          mimeType: file.mimeType,
          // user: file.user,
          createdAt: file.Creation,
        };
      }),
    );

    return enriched;
  }

  @Get('stream/:id')
  async streamVideo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const fileMeta = await this.fileUploadService.getFileMetaById(id);
    if (!fileMeta) {
      return res.status(404).send('File metadata not found');
    }

    const relativePath = fileMeta.file.startsWith('/')
      ? fileMeta.file.slice(1)
      : fileMeta.file;

    const videoPath = path.join(process.cwd(), relativePath);

    if (!existsSync(videoPath)) {
      console.error('File not found at:', videoPath);
      return res.status(404).send('File not found on disk');
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send('Requires Range header');
    }

    const CHUNK_SIZE = 10 ** 6;
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : Math.min(start + CHUNK_SIZE, fileSize - 1);

    const contentLength = end - start + 1;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': fileMeta.mimeType || 'video/mp4',
    };

    res.writeHead(206, headers);
    const videoStream = createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  }

  // @Get('debug/cache/:key')
  // async debugCache(@Param('key') key: string) {
  //   const value = await this.cacheManager.get(key);
  //   return { key, value };
  // }
}
