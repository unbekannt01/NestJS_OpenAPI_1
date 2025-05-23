import { registerAs } from '@nestjs/config';

/**
 * SMTP Configuration
 * This configuration is used to set up the SMTP server for sending emails.
 * It uses environment variables to configure the SMTP server.
 */
export const SMS = registerAs('SMS', () => {
  return {
    ACCOUNT_SID: process.env['TWILIO_ACCOUNT_SID'],
    AUTH_TOKEN: process.env['TWILIO_AUTH_TOKEN'],
    PHONE_NUMBER: process.env['TWILIO_PHONE_NUMBER'],
    VERIFY_SERVICE_SID: process.env['TWILIO_VERIFY_SERVICE_SID'],
  };
});
