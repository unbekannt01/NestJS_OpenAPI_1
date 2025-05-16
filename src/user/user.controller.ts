import {
  Controller,
  Body,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  Response as Res,
  Req,
  Query,
  Patch,
  ParseUUIDPipe,
  HttpStatus,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatarFile: Express.Multer.File,
    @Req() req: Request & { user: JwtPayload },
  ) {
    if (req.user.id !== id) {
      throw new UnauthorizedException(
        'You are not authorized to update profile...!',
      );
    }
    return await this.userService.updateUser(
      req.user.id,
      updateUserDto,
      avatarFile,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: Request & { user: JwtPayload }) {
    const { role } = req.user;
    const user = await this.userService.getUserById(req.user.id);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return {
      message: `${role} profile fetched successfully!`,
      user,
    };
  }

  @Get('getUserById/:id')
  @UseInterceptors(CacheInterceptor)
  async getUser(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
  ) {
    const user = await this.userService.getUserById(id);
    return user;
  }

  @Get('user')
  @UseInterceptors(CacheInterceptor)
  async user(@Req() request: Request & { cookies: { [key: string]: string } }) {
    try {
      const cookie = request.cookies['access_token'];

      if (!cookie) {
        throw new UnauthorizedException('No access token found.');
      }

      const data = await this.jwtService.verifyAsync<JwtPayload>(cookie, {
        secret: process.env.JWT_SECRET,
      });

      if (!data || !data.id) {
        throw new UnauthorizedException('Invalid token data.');
      }

      const user = await this.userService.getUserById(data.id);

      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }

  @Get('pagination')
  async findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.userService.getAllUser(paginationDto);
  }

  // // Example : Why need middlewares
  // @Get('/getUser')
  // async getUserByEmail(@Query('email') email: string) {
  //   return { message : 'true' }
  // }

  @Patch('remove-avatar/:id')
  async removeAvatar(@Param('id') id: string) {
    return this.userService.removeAvatar(id);
  }
}
