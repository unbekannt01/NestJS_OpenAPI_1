import { Body, Controller, HttpCode, HttpStatus, Post, Response as Res } from '@nestjs/common';
import { LoginUsingGoogleService } from './login-using-google.service';
import { Public } from 'src/user/decorators/public.decorator';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Response } from 'express';

@Controller('google')
export class LoginUsingGoogleController {
  constructor(
    private readonly loginUsingGoogleService: LoginUsingGoogleService
  ) { }
  @Public()
  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const { access_token, refresh_token, ...result } = await this.loginUsingGoogleService.googleLogin(googleLoginDto);

    // Set access token in HTTP-only cookie
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    return {
      ...result,
      refresh_token
    };
  }

}
