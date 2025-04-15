import { Controller, Body, Get, NotFoundException, Param, UseGuards, Response as Res, Req, Query, Patch, ParseUUIDPipe, UsePipes, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { version } from 'os';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // @Put('/update/:email') 
  // async update(
  //   @Param('email') email: string,
  //   @Body() { first_name, last_name, mobile_no, userName }: UpdateUserDto
  // ) {
  //   try {
  //     const updatedUser = await this.userService.update(
  //       email,
  //       first_name?.trim() || '',
  //       last_name?.trim() || '',
  //       mobile_no?.trim() || '',
  //       userName || ''
  //     );

  //     return { message: "User updated successfully!", user: updatedUser };
  //   } catch (error) {
  //     throw new BadRequestException(error.message || "Failed to update user.");
  //   }
  // }

  @Patch('/update')
  async updateUser(
    @Query(':email') email: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.update(updateUserDto, email);
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
  async getUser(@Param('id', new ParseUUIDPipe({ version: "4" , errorHttpStatusCode : HttpStatus.NOT_ACCEPTABLE })) id: string) {
    console.log(typeof id)
    return this.userService.getUserById(id);
  }
}
