import { Controller, Get, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { Request, Response } from 'express';

@Controller('video')
export class VideoController {
  @Get('video/:id')
  streamVideo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const videoPath = join(__dirname, '..', 'uploads', id);
    const videoStat = statSync(videoPath);
    const fileSize = videoStat.size;
    const range = req.headers.range;

    if (!range) {
      res.status(HttpStatus.BAD_REQUEST).send('Requires Range header');
      return;
    }

    const CHUNK_SIZE = 10 ** 6; // 1MB per chunk
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : Math.min(start + CHUNK_SIZE, fileSize - 1);

    const contentLength = end - start + 1;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, headers);

    const videoStream = createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  }
}
