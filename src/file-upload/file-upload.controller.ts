import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { Public } from 'src/common/decorators/public.decorator';

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
  @UseInterceptors(FileInterceptor('file'))
  uploadFiles(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file);
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
}
