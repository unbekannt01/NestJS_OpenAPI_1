import { registerAs } from '@nestjs/config';

/**
 * SMTP Configuration
 * This configuration is used to set up the SMTP server for sending emails.
 * It uses environment variables to configure the SMTP server.
 */
export const GOOGLE_OAUTH = registerAs('GOOGLE', () => {
  return {
    CLIENT_ID: process.env['GOOGLE_CLIENT_ID'],
    PROJECT_ID: process.env['GOOGLE_PROJECT_ID'],
    CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'],
    CALLBACK_URL: process.env['GOOGLE_CALLBACK_URL'],
  };
});
