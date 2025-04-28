import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtService: JwtService) {
    super({
      jwtFromRequest: (req: Request) => {
        const token = req.cookies['access_token']; // Get the token from the cookie
        return token || null;
      },
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Return user info based on the JWT payload
    return { userId: payload.sub, username: payload.username };
  }
}
