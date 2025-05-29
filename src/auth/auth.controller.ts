import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  UseGuards,
  Response as Res,
  ValidationPipe,
  UnauthorizedException,
  Req,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  Version,
  HttpStatus,
} from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Admin } from 'src/common/decorators/admin.decorator';

/**
 * AuthController handles authentication-related operations such as
 * user registration, login, logout, and token management.
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * This endpoint allows users to register using an OTP (One-Time Password).
   */
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.registerUsingOTP(registerDto, file);
  }

  /**
   * Registers a new user.
   * This endpoint allows users to register using an email token.
   */
  @Version('2')
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async registerUsingEmailToken(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.registerUsingEmailToken(registerDto, file);
  }

  /**
   * Registers a new user.
   * This endpoint allows users to register with simple method.
   */
  @Version('3')
  @HttpCode(HttpStatus.CREATED) // for register
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async simpleRegister(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.simpleRegister(registerDto, file);
  }

  /**
   * Logs in a user and returns an access token and refresh token.
   */
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() login: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; access_token: string; refresh_token: string }> {
    try {
      const { role, access_token, refresh_token } =
        await this.authService.loginUser(login.identifier, login.password);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000,
        path: '/',
      });

      return {
        message: `${role} Login Successfully!`,
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Login failed');
    }
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  /**
   * Logs out a user by invalidating their access token.
   */
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const authHeader = request.headers['authorization'];
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        throw new UnauthorizedException('No access token found.');
      }

      const payload = this.authService.verifyAccessToken(accessToken);
      const id = payload.id;

      await this.authService.logout(id);

      response.clearCookie('access_token', {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw new UnauthorizedException('Logout failed.');
    }
  }

  /**
   * Fetches all users.
   */
  @Admin()
  @Get('getAllUsers')
  async getAllUsers() {
    const users = await this.authService.getAllUsers();
    return { message: 'Users fetched successfully!', users };
  }

  /**
   * Validates a refresh token.
   */
  @Public()
  @Post('validate-refresh-token')
  async validateRefreshToken(@Body() body: { refresh_token: string }) {
    const isValid = await this.authService.validateRefreshToken(
      body.refresh_token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { valid: true };
  }
}
