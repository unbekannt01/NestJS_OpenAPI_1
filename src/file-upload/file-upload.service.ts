import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FileUploadService {
    handleFileUpload(file: Express.Multer.File) {

        if (!file) {
            throw new NotFoundException('File Not Found...!')
        }

        const allowedMimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedMimeTypes) {
            throw new BadRequestException('Invalid MimeTypes...!')
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('File is too Large...!')
        }

        return { message: 'File Uploaded Successfully...!', fileURLToPath: file.path }
    }
}
