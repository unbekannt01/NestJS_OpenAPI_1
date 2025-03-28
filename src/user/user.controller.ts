import { Controller, Post, Body, Get, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOTPDto } from './dto/verify-otp-user.dto';
import { ResendOTPDto } from './dto/resend-otp-user.dto';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.save(createUserDto);
  } 

  @Post('/verify-otp')
  verifyOtp(@Body() verifyotp : VerifyOTPDto) {
    return this.userService.verifyOtp(verifyotp.email, verifyotp.otp);
  }

  @Post('/resend-otp')
  async resendOtp(@Body() { email }: ResendOTPDto) {
    return this.userService.resendOtp(email);
  }

  @Post('/login')
  login(@Body() { email, password }: LoginUserDto) {
    return this.userService.login(email, password);
  }

}
