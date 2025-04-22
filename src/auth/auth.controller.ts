import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query, UseGuards, Request, Response as Res, ValidationPipe, UnauthorizedException, Req, ParseUUIDPipe, UsePipes } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { VerifyOTPDto } from './dto/verify-otp-user.dto';
import { ResendOTPDto } from './dto/resend-otp-user.dto';
import { ChangePwdDto } from 'src/user/dto/change-pwd-user.dto';
import { ForgotPwdDto } from './dto/forgot-pwd-user.dto';
import { ResetPwdDto } from './dto/reset-pwd-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express'
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from 'src/user/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';
import { IsNotSuspendedGuard } from './guards/isNotSuspended.guard';
import { Public } from 'src/user/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) { }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.authService.save(createUserDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @UsePipes(ValidationPipe)
  async login(@Body() login: LoginUserDto, @Res({ passthrough: true }) res: Response): Promise<{ message: string; refresh_token: string; }> {
    try {
      const { role, access_token, refresh_token } = await this.authService.loginUser(login.email, login.password);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });

      return { message: `${role} Login Successfully!`, refresh_token };
    } catch (error) {
      throw new BadRequestException(error.message || 'Login failed');
    }
  }

  @Post("/refresh-token")
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token)
  }

  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.OK)
  // @Post('/logout/:id')
  // async logout(
  //   @Param('id', new ParseUUIDPipe({ version: "4" })) id: string,
  //   @Req() req: Request & { user: JwtPayload },
  //   @Res() res: Response
  // ) {
  //   // Check if the token belongs to the user trying to logout
  //   if (req.user.id !== id) {
  //     throw new UnauthorizedException('You can only logout your own account');
  //   }

  //   await this.authService.logout(id);

  //   res.clearCookie('access_token', {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //   });

  //   return res.status(HttpStatus.OK).json({ message: "User logged out successfully!" });
  // }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(
    @Req() req: Request & { user: JwtPayload },
    @Res() res: Response
  ) {
    const userId = req.user.id;

    await this.authService.logout(userId); // Optional: if you're invalidating refresh tokens in DB

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/suspend/:id')
  async suspedUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string, @Body() message: string) {
    return this.authService.suspendUser(id, message)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/reActivated/:id')
  async reActivatedUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.reActivatedUser(id)
  }
}
