import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export function validateAvatarFile(file: Express.Multer.File) {
  const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB
  const allowedImageMime = /(jpg|jpeg|png|webp)$/;

  if (!file || !file.buffer) {
    throw new BadRequestException('Uploaded file is empty or invalid');
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new BadRequestException('Avatar must be less than 1MB in size.');
  }

  if (!file.mimetype.match(allowedImageMime)) {
    throw new BadRequestException(
      'Only JPG, JPEG, PNG, or WEBP image formats are allowed.',
    );
  }
}

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const videoFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(mp4|webm|ogg)$/)) {
    return callback(new Error('Only video files are allowed!'), false);
  }
  callback(null, true);
};
