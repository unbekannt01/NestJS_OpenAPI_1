import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from 'src/user/entities/user.entity';

@Injectable()
export class IsNotSuspendedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended. Please contact Admin support.');
    }

    return true;
  }
}
