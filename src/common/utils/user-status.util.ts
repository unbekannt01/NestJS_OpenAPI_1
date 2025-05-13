import { User, UserStatus } from 'src/user/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

export function checkIfSuspended(user: User) {
  if (user.status === UserStatus.SUSPENDED) {
    throw new ForbiddenException('This account is suspended. Please contact support.');
  }
}
