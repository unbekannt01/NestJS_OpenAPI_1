import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query, UseGuards, Request, Response as Res } from '@nestjs/common';
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
import { UserRole } from './entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './Guard/roles.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express'


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.save(createUserDto);
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
  @Post('/login')
  async login(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const { access_token, refresh_token, message } = await this.userService.login(email, password);

    // Set the access_token in a cookie
    res.cookie('access_token', access_token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
      sameSite: 'strict', // Prevents the cookie from being sent with cross-site requests
      maxAge: 60 * 60 * 1000, // 1 hour expiration
    });

    return res.status(HttpStatus.OK).json({ message, refresh_token });
  }

  @HttpCode(HttpStatus.OK)
  @Post('/changepwd')
  changepwd(@Body() { email, password, newpwd }: ChangePwdDto) {
    return this.userService.changepwd(email, password, newpwd);
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

  // @HttpCode(HttpStatus.OK)
  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateuserDto: UpdateUserDto
  // ) {
  //   return this.userService.update(id, updateuserDto);
  // }

  @Put("/:email")
  async update(
    @Param("email") email: string,
    @Body() { first_name, last_name, mobile_no, userName }: UpdateUserDto
  ) {
    try {
      const updatedUser = await this.userService.update(
        email.toLowerCase(),
        first_name?.trim() || '',
        last_name?.trim() || '',
        mobile_no?.trim() || '',
        userName || ''
      );

      return { message: "User updated successfully!", user: updatedUser };
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to update user.");
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(@Body() { email }: LogoutUserDto, @Res() res: Response) {
    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    await this.userService.logout(email.toLowerCase());

    // Clear the access_token cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(HttpStatus.OK).json({ message: "User logged out successfully!" });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("/profile")
  async getProfile(@Query("email") email: string) {
    if (!email) throw new BadRequestException("Email is required.");

    const user = await this.userService.getUserByEmail(email.toLowerCase());

    if (!user) throw new NotFoundException("No user found with this email.");

    return { message: "User profile fetched successfully!", user };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Ensure the required role is ADMIN
  @Get("/getAllUsers")
  async getAllUsers() {
    const user = await this.userService.getAllUsers();
    return { message: 'Users fetched successfully!', user };
  }

  @Post("/refresh-token")
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refreshToken(refreshTokenDto.refresh_token)
  }
}
