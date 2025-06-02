// strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'identifier' }); // email or username
  }

  async validate(identifier: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(identifier, password);
      if (!user) throw new UnauthorizedException('Invalid credentials');
      return user;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }
}
