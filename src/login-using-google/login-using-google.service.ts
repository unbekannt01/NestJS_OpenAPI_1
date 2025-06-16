import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from 'src/auth/auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * LoginUsingGoogleService
 * This service handles Google login functionality.
 */
@Injectable()
export class LoginUsingGoogleService {
  private googleClient: OAuth2Client;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * googleLogin
   * This method handles Google login.
   */
  async googleLogin(googleLoginDto: GoogleLoginDto) {
    try {
      if (!googleLoginDto.credential) {
        throw new BadRequestException('Google credential is required');
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleLoginDto.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google credentials');
      }

      let user = await this.userRepository.findOne({
        where: { email: payload.email },
      });

      if (!user) {
        // Create a new user if they don't exist
        user = this.userRepository.create({
          email: payload.email,
          first_name: payload.given_name || '',
          last_name: payload.family_name || '',
          password: await bcrypt.hash(uuidv4(), 10),
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
          role: UserRole.USER,
          userName: payload.email.split('@')[0],
          is_logged_in: true,
          mobile_no: '0000000000',
          createdBy: payload.email.split('@')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.userRepository.save(user);
      } else {
        user.is_logged_in = true;
        await this.userRepository.save(user);
      }

      const tokens = await this.authService.generateUserToken(
        user.id,
        user.role,
      );

      return {
        message: 'Google login successful',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          userName: user.userName,
        },
      };
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to authenticate with Google: ' + error.message,
      );
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}

}
