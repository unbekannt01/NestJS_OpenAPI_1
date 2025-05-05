import { Controller } from '@nestjs/common';
import { EmailVerificationByLinkService } from './email-verification-by-link.service';

@Controller('email-verification-by-link')
export class EmailVerificationByLinkController {
  constructor(private readonly emailVerificationByLinkService: EmailVerificationByLinkService) {}
}
