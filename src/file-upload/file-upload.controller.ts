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

/**
 * FileUploadController handles file upload and retrieval operations.
 */
@Public()
@Controller({ path: 'file-upload', version: '1' })
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

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
    return this.fileUploadService.uploadFile(file, user.id);
  }

  /**
   * getFile
   * This method retrieves a file by its name.
   */
  @Get('getFile')
  getFile(@Query('fileName') fileName: string, @Res() res: Response) {
    if (!fileName) {
      throw new NotFoundException('File name is required');
    }
    const filePath = path.resolve(process.cwd(), 'uploads', fileName);

    return res.sendFile(filePath);
  }

  // delete file using id and pass the jwt token after the file is uploaded
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
      throw new NotFoundException('File not found');
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

  // @Post('updateFile/:id')
  // @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: memoryStorage(),
  //   }),
  // )
  // async updateFile(
  //   @Param('id') id: string,
  //   @UploadedFile() file: Express.Multer.File,
  //   @Req() request: Request,
  // ) {
  //   const user = request.user as { id: string };
  //   return this.fileUploadService.updateFile(id, user.id, file);
  // }
}
