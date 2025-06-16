import { forwardRef, Module } from '@nestjs/common';
import { LoginUsingGoogleService } from './login-using-google.service';
import { LoginUsingGoogleController } from './login-using-google.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleStrategy } from 'src/auth/strategies/google.strategy';
import { APP_GUARD } from '@nestjs/core';

/**
 * LoginUsingGoogleModule
 * This module is responsible for handling Google login functionality.
 */
@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => AuthModule)],
  controllers: [LoginUsingGoogleController],
  providers: [LoginUsingGoogleService, GoogleStrategy],
})
export class LoginUsingGoogleModule {}
