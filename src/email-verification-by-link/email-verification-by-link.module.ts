import { forwardRef, Module } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { EmailVerificationByLinkController } from './email-verification-by-link.controller';
import { UserModule } from 'src/user/user.module';
import { EmailServiceForVerifyMail } from './services/email-verify.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './entity/email-verify.entity';

/**
 * EmailVerificationByLinkModule
 * This module is responsible for handling email verification by link.
 */
@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([EmailVerification]),
  ],
  controllers: [EmailVerificationByLinkController],
  providers: [EmailVerificationByLinkService, EmailServiceForVerifyMail],
  exports: [EmailVerificationByLinkService, EmailServiceForVerifyMail]
})
export class EmailVerificationByLinkModule {}
