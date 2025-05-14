import { forwardRef, Module } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { EmailVerificationByLinkController } from './email-verification-by-link.controller';
import { UserModule } from 'src/user/user.module';
import { EmailServiceForVerifyMail } from './services/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './entity/email-verify.entity';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => EmailVerificationByLinkModule),
    TypeOrmModule.forFeature([EmailVerification])
  ],
  controllers: [EmailVerificationByLinkController],
  providers: [EmailVerificationByLinkService, EmailServiceForVerifyMail],
})
export class EmailVerificationByLinkModule { }
