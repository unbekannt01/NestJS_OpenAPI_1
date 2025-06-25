import {
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
import { FileUploadUsingCloudinaryService } from './file-upload-using-cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: 'file-upload-using-cloudinary', version: '1' })
export class FileUploadUsingCloudinaryController {
  constructor(
    private readonly fileUploadUsingCloudinaryService: FileUploadUsingCloudinaryService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    const userId = user?.id;
    if (!userId) throw new Error('User information is missing from request.');
    await this.fileUploadUsingCloudinaryService.uploadFile(file, userId);
    return { message: 'File Uploaded Successfully in Clouudinary...!'}
  }

  @Get('getAllFile')
  async findAll() {
    return this.fileUploadUsingCloudinaryService.getAllFiles();
  }

  @Public()
  @Get('getFileById/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    const fileRecord =
      await this.fileUploadUsingCloudinaryService.getFileMetaById(id);
    const buffer = await this.fileUploadUsingCloudinaryService.getFileById(id);

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
    await this.fileUploadUsingCloudinaryService.deleteFile(id);
    return { messge: 'File Deleted From Cloudinary...!'}
  }

  @Get('getFileMetaById/:id')
  async getFileMeta(@Param('id') id: string) {
    return await this.fileUploadUsingCloudinaryService.getFileMetaById(id);
  }

  @Patch('updateFile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.fileUploadUsingCloudinaryService.updateFile(id, file);
    return { message: 'File Updated Successfully in Cloudinary...!'}
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const fileRecord =
      await this.fileUploadUsingCloudinaryService.getFileMetaById(id);

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileResult =
        await this.fileUploadUsingCloudinaryService.getFileById(id);

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
