import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from 'src/user/entities/user.entity';

@Injectable()
export class IsNotSuspendedGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const excludedPaths = [
      { path: '/auth/register', method: 'POST' },
    ];

    const isExcluded = excludedPaths.some(
      (route) => route.path === req.path && route.method === req.method,
    );

    if (isExcluded) return true;

    const user = req.user as User;

    // Allow unauthenticated users to access routes like /public, /docs, etc.
    if (!user?.id) return true;

    const dbUser = await this.userRepository.findOne({ where: { id: user.id } });

    if (dbUser?.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended.');
    }

    return true;
  }
}
