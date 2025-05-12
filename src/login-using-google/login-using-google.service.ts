import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from 'src/auth/auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { User, UserRole, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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

      async googleLogin(googleLoginDto: GoogleLoginDto) {
    try {
      // console.log('Received Google login request:', googleLoginDto);
      
      if (!googleLoginDto.credential) {
        throw new BadRequestException('Google credential is required');
      }

      // Verify the Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleLoginDto.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      // console.log('Google payload:', payload);

      if (!payload || !payload.email) {
        throw new UnauthorizedException("Invalid Google credentials");
      }

      // Check if user exists with this email
      let user = await this.userRepository.findOne({ where: { email: payload.email } });

      if (!user) {
        // Create a new user if they don't exist
        user = this.userRepository.create({
          email: payload.email,
          first_name: payload.given_name || "",
          last_name: payload.family_name || "",
          password: await bcrypt.hash(uuidv4(), 10), 
          isEmailVerified: true, 
          status: UserStatus.ACTIVE,
          role: UserRole.USER,
          userName: payload.email.split('@')[0], 
          is_logged_in: true,
          mobile_no: "0000000000", 
          createdBy: payload.email.split('@')[0], 
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await this.userRepository.save(user);
        // console.log('Created new user:', user);
      } else {
        // Update existing user's login status
        user.is_logged_in = true;
        await this.userRepository.save(user);
        // console.log('Updated existing user:', user);
      }

      // Generate tokens
      const tokens = await this.authService.generateUserToken(user.id, user.role);
      // console.log('Generated tokens:', { access_token: '***', refresh_token: tokens.refresh_token });

      return {
        message: "Google login successful",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          userName: user.userName
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
      throw new BadRequestException("Failed to authenticate with Google: " + error.message);
    }
  }
    
}