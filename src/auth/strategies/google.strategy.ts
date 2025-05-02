// auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3001/auth/google/redirect', // must match what's in Google Console
      scope: ['profile', 'email'],
      // passReqToCallback: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    console.log(' Google profile received:', JSON.stringify(profile, null, 2));

    try {
      const { name, emails, photos } = profile;

      if (!emails || !emails[0]) {
        throw new Error('No email found in Google profile');
      }

      const user = {
        email: emails[0].value,
        firstName: name?.givenName,
        lastName: name?.familyName,
        picture: photos?.[0]?.value,
        accessToken,
      };

      console.log('Parsed user from Google:', user);
      done(null, user);
    } catch (err) {
      console.error('Google OAuth error:', err);
      done(err, false);
    }
  }
}
