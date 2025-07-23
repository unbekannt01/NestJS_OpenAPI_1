import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { LoginUsingGoogleService } from './login-using-google.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Response } from 'express';

@Public()
@Controller({ path: 'google', version: '1' })
export class LoginUsingGoogleController {
  constructor(
    private readonly loginUsingGoogleService: LoginUsingGoogleService,
  ) {}

  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token, ...result } =
      await this.loginUsingGoogleService.googleLogin(googleLoginDto);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    return {
      ...result,
      refresh_token,
    };
  }

  // @Public()
  // @UseGuards(GoogleAuthGuard)
  // @Get('google/login')
  // async googleLogin() {}

  // @Public()
  // @UseGuards(GoogleAuthGuard)
  // @Get('google/redirect')
  // async googleRedirect(
  //   @Req() req,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   const user = await this.loginUsingGoogleService.findUserByEmail(
  //     req.user.email,
  //   );

  //   if (!user) {
  //     throw new NotFoundException('User not found with Google email');
  //   }

  //   const tokens = await this.authService.generateUserToken(user.id, user.role);
  //   response.cookie('access_token', tokens.access_token, {
  //     httpOnly: true,
  //     sameSite: 'lax',
  //     secure: process.env.NODE_ENV === 'local',
  //     maxAge: 60 * 60 * 1000,
  //     path: '/',
  //   });

  //   const {
  //     id,
  //     userName,
  //     first_name,
  //     last_name,
  //     email,
  //     status,
  //     role,
  //     isEmailVerified,
  //     fullName,
  //   } = user;
  //   response.redirect('http://localhost:5173/dashboard');

  //   return {
  //     message: 'Google Login Successful',
  //     access_token: tokens.access_token,
  //     refresh_token: tokens.refresh_token,
  //     expires_in: tokens.expires_in,
  //     user: {
  //       id,
  //       userName,
  //       firstName: first_name,
  //       lastName: last_name,
  //       email,
  //       status,
  //       role,
  //       isEmailVerified,
  //       fullName,
  //     },
  //   };
  // }
}
