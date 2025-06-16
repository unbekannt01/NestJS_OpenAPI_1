import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { configService } from 'src/common/services/config.service';

/**
 * JwtStrategy
 * This strategy is used for JWT authentication.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.['access_token'],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getValue('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload || !payload.id || !payload.jti) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.id,
        jti: payload.jti,
        is_logged_in: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return user;
  }
}
