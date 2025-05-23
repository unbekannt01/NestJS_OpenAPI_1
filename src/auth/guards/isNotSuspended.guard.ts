import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';

/**
 * IsSuspendedGuard
 * This guard checks if the user is suspended.
 */
@Injectable()
export class IsSuspendedGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Skip Register routes 
    const excludedPaths = [{ path: '/auth/register', method: 'POST' }];
    if (excludedPaths.some(route => route.path === req.path && route.method === req.method)) {
      return true;
    }

    const user = req.user as User;

    if (!user?.id) return true;

    const dbUser = await this.userRepository.findOne({ where: { id: user.id } });

    if (dbUser?.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended.');
    }

    return true;
  }
}
