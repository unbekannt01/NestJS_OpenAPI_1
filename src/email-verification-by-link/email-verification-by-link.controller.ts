import { BadRequestException, Body, Controller, NotFoundException, Post, Query, UnauthorizedException } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller({path :'email-verification-by-link', version : '1'})
export class EmailVerificationByLinkController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository : Repository<User>,
    private readonly emailVerificationByLinkService: EmailVerificationByLinkService) {}

  @Post('/verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // Find user by verification token
    const user = await this.emailVerificationByLinkService.findByVerificationToken(token);

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    // Check if token is expired or null
    if (!user.tokenExpiration || user.tokenExpiration < new Date()) {
      throw new BadRequestException('Verification link has expired');
    }

    // Update user status to ACTIVE and clear verification token
    user.status = UserStatus.ACTIVE;
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.tokenExpiration = null;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Post('/resend-verification')
  async resendVerificationEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.emailVerificationByLinkService.resendVerificationEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found or already verified');
    }

    return { message: 'Verification email resent successfully' };
  }

}
