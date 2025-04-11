import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/user/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assume user is already attached by another guard

    if (!user) {
      console.error('User not attached to request');
      throw new UnauthorizedException('User not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      console.error(`User role mismatch: required=${requiredRoles}, actual=${user.role}`);
      throw new UnauthorizedException('User not authorized');
    }

    return requiredRoles.includes(user.role); // Check if the user's role matches
  }
}