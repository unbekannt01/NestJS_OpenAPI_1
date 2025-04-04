// roles.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { UserRole } from '../entities/user.entity'; // adjust this import
  import { ROLES_KEY } from '../decorators/roles.decorator'; // adjust this import
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles) return true;
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      return requiredRoles.includes(user?.role); // safe role check
    }
  }
  