import { Body, Controller, Get, NotFoundException, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

interface FileParams {
  fileName: string;
}

@Controller({path: 'file-upload', version: '1'})
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) { }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFiles(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file)
  }

  @Get('getFile')
  getFile(@Query('fileName') fileName: string, @Res() res: Response) {
    if (!fileName) {
      throw new NotFoundException('File name is required');
    }
    // Resolve correct uploads folder location (outside of /dist)
    const filePath = path.resolve(process.cwd(), 'uploads', fileName);

    return res.sendFile(filePath);
  }
}
