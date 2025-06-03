import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { CsrfService } from './csrf.service';
import { CsrfController } from './csrf.controller';

/**
 * CsrfModule
 * This module handles all CSRF-related functionality including
 * token generation, validation, and middleware configuration.
 */
@Module({
  imports: [ConfigModule],
  controllers: [CsrfController],
  providers: [CsrfService, CsrfMiddleware],
  exports: [CsrfService, CsrfMiddleware],
})
export class CsrfModule {}
