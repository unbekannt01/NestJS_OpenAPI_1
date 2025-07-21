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
  UploadedFile,
  HttpCode,
  Version,
  HttpStatus,
  UseInterceptors,
  Delete,
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
import { Request, Express } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { GatewayService } from 'src/gateway/gateway.service';
import { UserService } from 'src/user/user.service';
import { UserStatus } from 'src/user/entities/user.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly gateWayService: GatewayService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
    }),
  )
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.registerUsingOTP(registerDto, file);
  }

  @Version('2')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
    }),
  )
  async registerUsingEmailToken(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.registerUsingEmailToken(registerDto, file);
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Version('3')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
    }),
  )
  async simpleRegister(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.simpleRegister(registerDto, file);
  }

  // @Throttle({ default: { limit: 2, ttl: 3 * 1000 } })
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() login: LoginUserDto,
  ): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    status: UserStatus;
  }> {
    try {
      const { user, role, access_token, refresh_token } =
        await this.authService.loginUser(login.identifier, login.password);

      this.gateWayService.notifyuserlogin(user.email);

      return {
        message: `${role} Login Successfully!`,
        access_token,
        refresh_token,
        status: user.status,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Login failed');
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = request.user as { id: string };
      if (!user?.id) {
        throw new UnauthorizedException('Invalid User Session...!');
      }

      await this.authService.logout(user.id);
      const fullUser = await this.userService.getUserById(user.id);
      if (fullUser && fullUser.email) {
        this.gateWayService.notifyuserlogout(fullUser.email);
      }

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
      body.refresh_token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { valid: true };
  }

  // @Public()
  // @Get('set-session')
  // setSession(@Req() req: Request) {
  //   req.session['user'] = { name: 'John', role: 'admin' };
  //   return 'Session set';
  // }

  @Get('profile')
  @UseGuards(AuthGuard('session'))
  getSession(@Req() req: Request) {
    return req.session['user'];
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async removeAvatar(@Req() req: Request): Promise<string> {
    if (!req.user || !(req.user as any).id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = (req.user as any).id;
    return this.authService.removeAvatar(userId);
  }
}
