import { Controller, Body, Get, NotFoundException, Param, UseGuards, Response as Res, Req, Query, Patch, ParseUUIDPipe, UsePipes, HttpStatus, Post, UnauthorizedException, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UnblockUserDto } from './dto/unblock-user.dto';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Ensure the required role is ADMIN
  @Get("/getAllUsers")
  async getAllUsers() {
    const user = await this.userService.getAllUsers();
    return { message: 'Users fetched successfully!', user };
  }

  @Get('/getUserById/:id')
  async getUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    console.log(typeof id)
    return this.userService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can unblock users
  @Post('/unblock')
  async unblockUser(@Body() unblockUserDto: UnblockUserDto) {
    return this.userService.unblockUser(unblockUserDto.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can softDelete users
  @Delete('/softDelete/:id')
  async softDeleteUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.userService.softDeleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/restore/:id')
  async reStoreUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.userService.reStoreUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can hardDelete users
  @Delete('/hardDelete/:id')
  async permanantDeleteUser(@Param('id', new ParseUUIDPipe({ version: "4", errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
    return this.userService.hardDelete(id);
  }

  @Get('/search')
  search(@Query('query') query: string) {
    return this.userService.searchUser(query);
  }
  
  @Get('/recent-search')
  getRecentSearches(@Query('limit') limit?: number) {
    return this.userService.getRecentSearches(limit);
  }

  // // Example : Why need middlewares
  // @Get('/getUser')
  // async getUserByEmail(@Query('email') email: string) {   
  //   return { message : 'true' }
  // }
}
