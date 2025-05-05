import { Module } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';
import { EmailVerificationByLinkController } from './email-verification-by-link.controller';

@Module({
  controllers: [EmailVerificationByLinkController],
  providers: [EmailVerificationByLinkService],
})
export class EmailVerificationByLinkModule {}
