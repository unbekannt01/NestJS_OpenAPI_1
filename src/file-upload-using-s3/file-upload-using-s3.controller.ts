import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadUsingS3Service } from './file-upload-using-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { validate as isUuid } from 'uuid';

@Controller({ path: 'file-upload-using-s3', version: '1' })
export class FileUploadUsingS3Controller {
  constructor(
    private readonly fileUploadUsingS3Service: FileUploadUsingS3Service,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user: any = req.user;
    const userId = user?.id;
    if (!userId) throw new Error('User information is missing from request.');
    await this.fileUploadUsingS3Service.uploadFile(file, userId);
    return { message : 'File Uploaded Sucessfully in S3...!'}
  }

  @Get('getAllFile')
  async findAll() {
    return this.fileUploadUsingS3Service.getAllFiles();
  }

  @Public()
  @Get('getFileById/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid UUID format.');
    }
    const fileRecord = await this.fileUploadUsingS3Service.getFileMetaById(id);
    const buffer = await this.fileUploadUsingS3Service.getFileById(id);

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
    await this.fileUploadUsingS3Service.deleteFile(id);
    return { message : 'File Removed From the S3...!'}
  }

  @Get('getFileMetaById/:id')
  async getFileMeta(@Param('id') id: string) {
    return await this.fileUploadUsingS3Service.getFileMetaById(id);
  }

  @Patch('updateFile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.fileUploadUsingS3Service.updateFile(id, file);
    return { message : 'File Updated Successfully in S3...!'}
  }

  // @UseGuards(AuthGuard('jwt'))m
  @Public()
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const fileRecord = await this.fileUploadUsingS3Service.getFileMetaById(id);

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileResult = await this.fileUploadUsingS3Service.getFileById(id);

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

  // @Public()
  // @Delete('s3/:key')
  // async deleteFromS3(@Param('key') key: string) {
  //   if (!key) throw new NotFoundException('File key not provided');

  //   const message = await this.fileUploadUsingS3Service.deleteFileFromS3(key);
  //   return { message };
  // }
}
