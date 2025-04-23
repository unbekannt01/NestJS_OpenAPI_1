import { ForbiddenException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
        `Status: ${res.statusCode} - ${duration}ms ` +
        `Query: ${JSON.stringify(req.query)} ` +
        `Body: ${JSON.stringify(req.body)}`
      );
    });
    next();

    //   const ua = req.headers['user-agent'];

    //   if (!ua || !this.isUserAgenetAcceptable(ua)) {
    //       throw new ForbiddenException('Not Allowed..!')
    //   } 

    //   req['ua'] = ua;

    //   next();
    // }

    // private isUserAgenetAcceptable(userAgent: string) {
    //   const acceptedUserAgenets = ['postman'];

    //   return acceptedUserAgenets.some((agent) =>
    //     userAgent.toLowerCase().includes(agent.toLowerCase()))

    // }

  }
}
