// file-upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Get,
  Delete,
  Patch,
  Res,
  Req,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { GatewayService } from 'src/gateway/gateway.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Public()
@Controller({ path: 'file-upload', version: '1' })
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly gateWayService: GatewayService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('upload-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${file.fieldname}-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
    const user = req.user;
    return this.fileUploadService.upload(file, user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    const userId = user?.id;
    if (!userId) {
      throw new Error('User information is missing from request.');
    }
    this.gateWayService.notifyWhenFileUpload(user.email);
    return this.fileUploadService.upload(file, userId);
  }

  @Get('getAllFile')
  async findAll() {
    return this.fileUploadService.getAllFiles();
  }

  @Get('getFileById/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    const fileRecord = await this.fileUploadService.getFileMetaById(id);
    const buffer = await this.fileUploadService.getFileById(id);

    const fileName = fileRecord.originalName;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      fileRecord.mimeType || 'application/octet-stream',
    );

    return res.send(buffer);
  }

  @Delete('deleteFile/:id')
  async remove(@Param('id') id: string) {
    await this.fileUploadService.delete(id);
    return { message: 'File Deleted Successfully...!' };
  }

  @Get('getFileMetaById/:id')
  async getFileMeta(@Param('id') id: string) {
    return await this.fileUploadService.getFileMetaById(id);
  }

  @Patch('updateFile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.fileUploadService.updateFile(id, file, file?.mimetype);
  }

  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const fileRecord = await this.fileUploadService.getFileMetaById(id);

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileResult = await this.fileUploadService.getFileById(id);

      // If storage service returns signed URL
      if (
        fileResult &&
        typeof fileResult === 'object' &&
        'signedUrl' in fileResult
      ) {
        return res.redirect(fileResult.signedUrl as string);
      }

      // Otherwise treat it as Buffer (like from S3)
      const buffer = fileResult as Buffer;
      const fileName = fileRecord.originalName;

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      res.setHeader(
        'Content-Type',
        fileRecord.mimeType || 'application/octet-stream',
      );

      return res.send(buffer);
    } catch (err) {
      console.error('Download error:', err.message);
      throw new InternalServerErrorException('Could not download file');
    }
  }
}
