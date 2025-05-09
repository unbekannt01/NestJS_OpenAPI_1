import { Controller, Body, Get, NotFoundException, Param, UseGuards, Response as Res, Req, Query, Patch, ParseUUIDPipe, UsePipes, HttpStatus, Post, UnauthorizedException, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) { }

  @Patch('/update')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Query('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatarFile: Express.Multer.File,
    @Req() req: Request & { user: JwtPayload }
  ) {
    if (req.user.email !== email) {
      throw new UnauthorizedException('You are not authorized to update profile...!');
    }
    return await this.userService.updateUser(email, updateUserDto, req.user.email, avatarFile); // assuming currentUser is req.user.email
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/profile')
  async getProfile(@Req() req: Request & { user: JwtPayload }) {
    const { role } = req.user;
    const user = await this.userService.getUserById(req.user.id);

    if (!user) {
      throw new NotFoundException("User profile not found");
    }
    return {
      message: `${role} profile fetched successfully!`,
      user,
    };
  }

  @Get('/getUserById/:id')
  async getUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    console.log(typeof id)
    const user = await this.userService.getUserById(id);
    return user;
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('/user')
  async user(@Req() request: Request & { cookies: { [key: string]: string } }) {
    try {
      const cookie = request.cookies['access_token']; // corrected cookie name

      if (!cookie) {
        throw new UnauthorizedException('No access token found.');
      }

      const data = await this.jwtService.verifyAsync<JwtPayload>(cookie, { secret: process.env.JWT_SECRET });

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

  @Get('/pagination')
  async findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.userService.getAllUser(paginationDto);
  }

  // // Example : Why need middlewares
  // @Get('/getUser')
  // async getUserByEmail(@Query('email') email: string) {   
  //   return { message : 'true' }
  // }
}
