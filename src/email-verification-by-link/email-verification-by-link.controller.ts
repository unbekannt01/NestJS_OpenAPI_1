import { BadRequestException, Body, Controller, NotFoundException, Post, Query, UnauthorizedException } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { User, UserStatus } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from './entity/email-verify.entity';

@Controller({ path: 'email-verification-by-link', version: '1' })
export class EmailVerificationByLinkController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailVerificationByLinkService: EmailVerificationByLinkService) { }

  @Post('/verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.emailVerificationByLinkService.findByVerificationToken(token);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Post('/resend-verification')
  async resendVerificationEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    await this.emailVerificationByLinkService.resendVerificationEmail(email.toLowerCase());

    return { message: 'Verification email resent successfully' };
  }

}
