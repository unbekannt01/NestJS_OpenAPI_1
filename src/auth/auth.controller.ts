import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query, UseGuards, Request, Response as Res, ValidationPipe } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { VerifyOTPDto } from './dto/verify-otp-user.dto';
import { ResendOTPDto } from './dto/resend-otp-user.dto';
import { LogoutUserDto } from './dto/logout-user.dto';
import { ChangePwdDto } from 'src/user/dto/change-pwd-user.dto';
import { ForgotPwdDto } from './dto/forgot-pwd-user.dto';
import { ResetPwdDto } from './dto/reset-pwd-user.dto';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express'
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,        
  ) { }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req, @Res() res: Response) {
    const user = req.user; 
    const { access_token, refresh_token } = await this.authService.generateUserToken(user.id, user.role);
  
    // Set the access_token in a cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
    return res.status(HttpStatus.OK).json({ message: `${user.role} Login Successfully!`, refresh_token });
  }
  
  @Post("/refresh-token")
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token)
  }

  @UseGuards(RolesGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(@Body() { email }: LogoutUserDto, @Res() res: Response) {
    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    await this.authService.logout(email.toLowerCase());

    // Clear the access_token cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(HttpStatus.OK).json({ message: "User logged out successfully!" });
  }

  @Post("/verify-otp")
  async verifyOtp(@Body() verifyOtpDto: VerifyOTPDto) {
    return this.userService.verifyOtp(verifyOtpDto.otp, verifyOtpDto.email);
  }

  @Post('/resend-otp')
  resendOtp(@Body() { email }: ResendOTPDto) {
    return this.userService.resendOtp(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/changepwd')
  changepwd(@Body() { email, password, newpwd }: ChangePwdDto) {
    return this.authService.changepwd(email, password, newpwd);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgotpwd')
  forgotpwd(@Body() { email }: ForgotPwdDto) {
    return this.userService.forgotPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/resetpwd')
  resetpwd(@Body() { email, newpwd }: ResetPwdDto) {
    return this.userService.resetPassword(email, newpwd);
  }
}
