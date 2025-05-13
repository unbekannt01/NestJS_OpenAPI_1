import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query, UseGuards, Request, Response as Res, ValidationPipe, UnauthorizedException, Req, ParseUUIDPipe, UsePipes, Delete, UseInterceptors, UploadedFile, ParseFilePipeBuilder } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChangePwdDto } from 'src/user/dto/change-pwd-user.dto';
import { ForgotPwdDto } from './dto/forgot-pwd-user.dto';
import { ResetPwdDto } from './dto/reset-pwd-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express'
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from 'src/user/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from 'src/user/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(@UploadedFile() file: Express.Multer.File, @Body() registerDto: CreateUserDto) {
    return await this.authService.save(registerDto, file);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @UsePipes(ValidationPipe)
  async login(@Body() login: LoginUserDto, @Res({ passthrough: true }) res: Response): Promise<{ message: string; refresh_token: string; }> {
    try {
      const { role, access_token, refresh_token } = await this.authService.loginUser(login.identifier, login.password);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
        path: '/'
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

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(
    @Req() request: Request & { cookies: { [key: string]: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const accessToken = request.cookies['access_token'];

      if (!accessToken) {
        throw new UnauthorizedException('No access token found.');
      }

      const payload = this.authService.verifyAccessToken(accessToken); // You'll create this method
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

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Post('/changepwd/:id')
  changepwd(
    @Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string,
    @Body() { password, newpwd }: ChangePwdDto) {
    return this.authService.changepwd(id, password, newpwd);
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/suspend/:id')
  async suspendUser(
    @Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string,
    @Body() body: { message: string } // Expecting object with message property
  ) {
    const { message } = body;
    return this.authService.suspendUser(id, message);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/reActivated/:id')
  async reActivatedUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.reActivatedUser(id)
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/unblock/:id')
  async unblockUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.unblockUser(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('/softDelete/:id')
  async softDeleteUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.softDeleteUser(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/restore/:id')
  async reStoreUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.reStoreUser(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('/hardDelete/:id')
  async permanantDeleteUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.authService.hardDelete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req) {
    const user = req.user; // this comes from the JWT payload
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("/getAllUsers")
  async getAllUsers() {
    const users = await this.authService.getAllUsers();  // Ensure this returns an array of users
    return { message: 'Users fetched successfully!', users }; // Use `users` in the response object, not `user`
  }

  @Post('validate-refresh-token')
  async validateRefreshToken(@Body() body: { refresh_token: string }) {
    const isValid = await this.authService.validateRefreshToken(body.refresh_token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { valid: true };
  }
}

