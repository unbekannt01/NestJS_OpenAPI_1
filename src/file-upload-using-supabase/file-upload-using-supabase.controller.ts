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
import { FileUploadUsingSupabaseService } from './file-upload-using-supabase.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: 'file-upload-using-supabase', version: '1' })
export class FileUploadUsingSupabaseController {
  constructor(
    private readonly fileUploadUsingSupabaseService: FileUploadUsingSupabaseService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    const userId = user?.id;
    if (!userId) throw new Error('User information is missing from request.');
    return this.fileUploadUsingSupabaseService.uploadFile(file, userId);
  }

  @Get('getAllFile')
  async findAll() {
    return this.fileUploadUsingSupabaseService.getAllFiles();
  }

  @Public()
  @Get('getFileById/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    const fileRecord =
      await this.fileUploadUsingSupabaseService.getFileMetaById(id);
    const buffer = await this.fileUploadUsingSupabaseService.getFileById(id);

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
    return this.fileUploadUsingSupabaseService.deleteFile(id);
  }

  @Get('getFileMetaById/:id')
  async getFileMeta(@Param('id') id: string) {
    return await this.fileUploadUsingSupabaseService.getFileMetaById(id);
  }

  @Patch('updateFile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.fileUploadUsingSupabaseService.updateFile(id, file);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Public()
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const fileRecord =
      await this.fileUploadUsingSupabaseService.getFileMetaById(id);

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileResult =
        await this.fileUploadUsingSupabaseService.getFileById(id);

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
