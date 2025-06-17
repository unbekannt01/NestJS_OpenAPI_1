import {
  Controller,
  Get,
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

  @Get('download/:id')
  async downloadFile(
    @Param('id') fileId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const fileMeta = await this.fileUploadService.getFileMetaById(fileId);
    if (!fileMeta) throw new NotFoundException('File not found');

    const buffer = await this.fileUploadService.getFileById(fileId);
    if (!buffer) throw new NotFoundException('Buffer missing');

    const fileName = fileMeta.originalName || 'file';
    const mimeType = fileMeta.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    res.end(buffer);
  }

  @Get('getFileUrl/:id')
  async getFileUrl(@Param('id') id: string) {
    const fileMeta = await this.fileUploadService.getFileMetaById(id);
    const signedUrl = await this.supaBaseService.getSignedUrl(fileMeta.file);

    return {
      fileName: fileMeta.originalName,
      mimeType: fileMeta.mimeType,
      signedUrl,
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

    const enriched = await Promise.all(
      files.map(async (file) => {
        const signedUrl = await this.supaBaseService.getSignedUrl(file.file);
        return {
          id: file.id,
          file: signedUrl,
          originalName: file.originalName,
          mimeType: file.mimeType,
          // user: file.user,
          createdAt: file.Creation,
        };
      }),
    );

    return enriched;
  }
}
