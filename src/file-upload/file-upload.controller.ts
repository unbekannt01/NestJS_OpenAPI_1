import { Body, Controller, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';

interface FileParams {
  fileName: string;
}

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) { }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFiles(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file)
  }

  @Get('/getFile')
  getFile(@Res() res: Response, @Body() file: FileParams) {
    const filePath = path.resolve(__dirname, '../../uploads', file.fileName);
    return res.sendFile(filePath);
  }
}
