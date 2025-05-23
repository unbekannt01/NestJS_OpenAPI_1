import { User, UserStatus } from 'src/user/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

/**
 * Utility function to check if a user is suspended.
 * Throws a ForbiddenException if the user status is suspended.
 */
export function checkIfSuspended(user: User) {
  if (user.status === UserStatus.SUSPENDED) {
    throw new ForbiddenException(
      'This account is suspended. Please contact support.',
    );
  }
}
