import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 * This configuration is used to set up the JWT secret and expiration time.
 * It uses environment variables to configure the JWT settings.
 */
export const JWT_CONFIG = registerAs('JWT', () => ({
  SECRET: process.env['JWT_SECRET'],
  EXPIRES_IN: process.env['JWT_EXPIRES_IN'],
}));
