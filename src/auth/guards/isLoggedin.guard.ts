import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

/**
 * IsLoggedInGuard
 * This guard checks if the user is logged in by verifying the JWT token
 */
@Injectable()
export class IsLoggedInGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    if (isPublic) {
      return true;
    }

    // Check for token in cookie first, then Authorization header
    let token = request.cookies['access_token'];

    if (!token) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return false;
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      return false;
    }

    try {
      const payload = jwt.verify(token, secret);
      const user = await this.userRepository.findOne({
        where: { id: (payload as JwtPayload).id, is_logged_in: true },
      });

      if (!user) {
        return false;
      }

      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }
}
