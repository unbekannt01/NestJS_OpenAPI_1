import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { IS_PUBLIC_KEY } from 'src/user/decorators/public.decorator';

@Injectable()
export class IsNotSuspendedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    if (user?.id) {
      const dbUser = await this.userRepository.findOne({ where: { id: user.id } });
      if (dbUser?.status === UserStatus.SUSPENDED) {
        await this.userRepository.update(
          { id: dbUser.id },
          { is_logged_in: false, refresh_token: null, expiryDate_token: null },
        );
        if (response?.clearCookie) {
          response.clearCookie('access_token');
        }
        throw new ForbiddenException('Your account is suspended. Please contact Admin support.');
      }
    }

    return true;
  }
}
