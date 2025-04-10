// roles.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { JwtService } from '@nestjs/jwt';
  import { UserRole, User } from '../entities/user.entity'; // adjust this import
  import { ROLES_KEY } from '../decorators/roles.decorator'; // adjust this import
  import { Repository } from 'typeorm';
  import { InjectRepository } from '@nestjs/typeorm';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(
      @InjectRepository(User) private readonly userRepository: Repository<User>,
      private readonly reflector: Reflector,
      private readonly jwtService: JwtService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles) return true;
  
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid or missing authorization header');
      }
  
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        request.user = decoded; // Attach the decoded user to the request
        return requiredRoles.includes(decoded.role); // Check if the user's role matches
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // Handle token expiration
          const decoded = this.jwtService.decode(token) as { id: string };
          if (decoded && decoded.id) {
            await this.userRepository.update(
              { id: decoded.id },
              { is_logged_in: false, token: null },
            );
          }
        }
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
