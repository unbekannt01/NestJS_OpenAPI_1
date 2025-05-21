import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
} from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { Public } from 'src/user/decorators/public.decorator';

@Public()
@Controller({ path: 'email-verification-by-link', version: '1' })
export class EmailVerificationByLinkController {
  constructor(
    private readonly emailVerificationByLinkService: EmailVerificationByLinkService,
  ) {}

  @Post('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    await this.emailVerificationByLinkService.findByVerificationToken(token);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Post('resend-verification')
  async resendVerificationEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    await this.emailVerificationByLinkService.resendVerificationEmail(
      email.toLowerCase(),
    );

    return { message: 'Verification email resent successfully' };
  }
}
