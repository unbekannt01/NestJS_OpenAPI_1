import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOTPDto } from './dto/verify-otp-user.dto';
import { ResendOTPDto } from './dto/resend-otp-user.dto';
import { LogoutUserDto } from './dto/logout-user.dto';
import { ChangePwdDto } from './dto/change-pwd-user.dto';
import { ForgotPwdDto } from './dto/forgot-pwd-user.dto';
import { ResetPwdDto } from './dto/reset-pwd-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
      return this.userService.save(createUserDto);
  }

  @Post("/verify-otp")
  verifyOtp(@Body() verifyOtpDto: { otp: string; email: string }) {
    return this.userService.verifyOtp(verifyOtpDto.otp, verifyOtpDto.email);
  }

  @Post('/resend-otp')
  resendOtp(@Body() { email }: ResendOTPDto) {
    return this.userService.resendOtp(email);
  }

  @Post('/login')
  login(@Body() { email, password }: LoginUserDto) {
    return this.userService.login(email, password);
  }

  @Post('/changepwd')
  changepwd(@Body() { email, password, newpwd }: ChangePwdDto) {
    return this.userService.changepwd(email, password, newpwd);
  }

  @Post('/forgotpwd')
  forgotpwd(@Body() { email }: ForgotPwdDto) {
    return this.userService.forgotPassword(email);
  }

  @Post('/resetpwd')
  resetpwd(@Body() { email, newpwd }: ResetPwdDto) {
    return this.userService.resetPassword(email, newpwd);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateuserDto: UpdateUserDto
  ) {
    return this.userService.update(id, updateuserDto);
  }

  @Post('/logout')
  logout(@Body() { email }: LogoutUserDto) {
    return this.userService.logout(email);
  }

  @Get("/profile")
  async getProfile(@Query("email") email: string) {
    if (!email) throw new BadRequestException("Email is required.");
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }
}
