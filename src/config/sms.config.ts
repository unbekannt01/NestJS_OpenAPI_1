// sms.config.ts
import { configService } from "src/common/services/config.service";

export const smsConfig = {
  accountSid: configService.getValue('TWILIO_ACCOUNT_SID'),
  authToken: configService.getValue('TWILIO_AUTH_TOKEN'),
  phoneNumber: configService.getValue('TWILIO_PHONE_NUMBER'),
  verifyServiceSid: configService.getValue('TWILIO_VERIFY_SERVICE_SID'),
};
