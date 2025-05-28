// smtp.config.ts
import { configService } from "src/common/services/config.service";

export const smtpConfig = {
  host: configService.getValue('SMTP_HOST'),
  port: configService.getValue('SMTP_PORT'),
  user: configService.getValue('SMTP_USER'),
  password: configService.getValue('SMTP_PASS'),
  secure: configService.getValue('SMTP_SECURE', false) === 'true',
};
