import {
    Injectable,
    NestMiddleware,
    ForbiddenException,
  } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { User, UserStatus } from 'src/user/entities/user.entity';
  
  @Injectable()
  export class CheckSuspendedMiddleware implements NestMiddleware {
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    async use(req: Request, res: Response, next: NextFunction) {
      // Skip check if user is not authenticated
      const user = req.user as User;
      if (!user?.id) return next();
  
      const dbUser = await this.userRepository.findOne({ where: { id: user.id } });
  
      if (dbUser?.status === UserStatus.SUSPENDED) {
        // Optional: Clear cookies or logout logic
        if (res?.clearCookie) {
          res.clearCookie('access_token');
        }
  
        await this.userRepository.update(
          { id: dbUser.id },
          { is_logged_in: false, refresh_token: null, expiryDate_token: null },
        );
  
        throw new ForbiddenException('Your account is suspended. Please contact Admin support.');
      }
  
      next();
    }
  }
  