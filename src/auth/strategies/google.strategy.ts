import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

/**
 * GoogleStrategy
 * This strategy is used for Google OAuth authentication.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3001/v1/google/google/redirect',
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    if (!emails?.[0]) {
      return done(new Error('No email found in Google profile'), false);
    }

    const user = {
      email: emails[0].value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
    };

    done(null, user);
  }
}
