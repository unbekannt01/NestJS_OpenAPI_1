import { Controller, Body, Get, NotFoundException, Param, UseGuards, Response as Res, Req, Query, Patch, ParseUUIDPipe, UsePipes, HttpStatus, Post, UnauthorizedException, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  async updateUser(
    @Query('email') email: string,
    @Body() updateUserDto: UpdateUserDto, currentUser: string,
    @Req() req: Request & { user: JwtPayload }
  ) {
    // Check if user is trying to update their own profile
    if (req.user.email !== email) {
      throw new UnauthorizedException('You are not authorized to update profile...!');
    }

    return await this.userService.updateUser(email, updateUserDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
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
    return this.userService.getUserById(id);
  }

  // // Example : Why need middlewares
  // @Get('/getUser')
  // async getUserByEmail(@Query('email') email: string) {   
  //   return { message : 'true' }
  // }
}
