import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
} from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * EmailVerificationByLinkController handles email verification and
 * resending verification emails.
 */
@Public()
@Controller({ path: 'email-verification-by-link', version: '1' })
export class EmailVerificationByLinkController {
  constructor(
    private readonly emailVerificationByLinkService: EmailVerificationByLinkService,
  ) {}

  /**
   * verifyEmail
   * This method verifies the email address of the user.
   */
  @Post('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    await this.emailVerificationByLinkService.findByVerificationToken(token);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  /**
   * resendVerificationEmail
   * This method resends the verification email to the user.
   */
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
