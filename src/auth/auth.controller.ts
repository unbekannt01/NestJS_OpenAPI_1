import {
  Controller,
  Post,
  Body,
  Get,
  NotFoundException,
  Put,
  Param,
  HttpStatus,
  HttpCode,
  Patch,
  BadRequestException,
  Query,
  UseGuards,
  Request,
  Response as Res,
  ValidationPipe,
  UnauthorizedException,
  Req,
  ParseUUIDPipe,
  UsePipes,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  UseFilters,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';
import { LoggingExceptionFilter } from 'src/common/filters/login-exception.filter';
import { IsLoggedInGuard } from './guards/isLoggedin.guard';
import { Admin } from 'src/common/decorators/admin.decorator';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto
  ) {
    return await this.authService.save(registerDto, file);
  }

  // @UseFilters(LoggingExceptionFilter)
  @Public()
  @Post('login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() login: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string; refresh_token: string }> {
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

      return { message: `${role} Login Successfully!`, refresh_token };
    } catch (error) {
      throw new BadRequestException(error.message || 'Login failed');
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Req() request: Request & { cookies: { [key: string]: string } },
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      const accessToken = request.cookies['access_token'];

      if (!accessToken) {
        throw new UnauthorizedException('No access token found.');
      }

      const payload = this.authService.verifyAccessToken(accessToken);
      const id = payload.id;

      await this.authService.logout(id);

      // Clear the access token cookie
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

  @Admin()
  @Get('getAllUsers')
  async getAllUsers() {
    const users = await this.authService.getAllUsers();
    return { message: 'Users fetched successfully!', users };
  }

  @Public()
  @Post('validate-refresh-token')
  async validateRefreshToken(@Body() body: { refresh_token: string }) {
    const isValid = await this.authService.validateRefreshToken(
      body.refresh_token
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { valid: true };
  }

  // @Post('event-tracker')
  // async trackevent(@Body() { event }) {
  //   return this.authService.trackEvent(event);
  // }
}

// @UseGuards(JwtAuthGuard)
// @Get('me')
// getCurrentUser(@Req() req) {
//   const user = req.user; // this comes from the JWT payload
//   return {
//     id: user.id,
//     email: user.email,
//     role: user.role,
//   };
// }
