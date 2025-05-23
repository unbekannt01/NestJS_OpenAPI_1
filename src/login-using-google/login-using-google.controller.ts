import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Response as Res,
} from '@nestjs/common';
import { LoginUsingGoogleService } from './login-using-google.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Response } from 'express';

/**
 * LoginUsingGoogleController handles Google login operations.
 * It provides an endpoint for users to log in using their Google accounts.
 */
@Public()
@Controller({ path: 'google', version: '1' })
export class LoginUsingGoogleController {
  constructor(
    private readonly loginUsingGoogleService: LoginUsingGoogleService,
  ) {}

  /**
   * googleLogin
   * This method handles Google login.
   * It sets the access token in an HTTP-only cookie and returns user details.
   */
  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token, ...result } =
      await this.loginUsingGoogleService.googleLogin(googleLoginDto);

    // Set access token in HTTP-only cookie
    response.cookie('access_token', access_token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    return {
      ...result,
      refresh_token,
    };
  }
}
