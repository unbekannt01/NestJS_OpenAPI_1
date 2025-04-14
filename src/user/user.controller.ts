import { Controller, Post, Body, Get, NotFoundException, Put, Param, HttpStatus, HttpCode, Patch, BadRequestException, Query, UseGuards, Request, Response as Res, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

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

  @UseGuards(JwtAuthGuard)
  @Get("/profile")
  async getProfile(@Body("email") email: string) {
    if (!email) throw new BadRequestException("Email is required.");

    const user = await this.userService.getUserByEmail(email.toLowerCase());

    if (!user) throw new NotFoundException("No user found with this email.");

    return { message: "User profile fetched successfully!", user };
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN) // Ensure the required role is ADMIN
  @Get("/getAllUsers")
  async getAllUsers() {
    const user = await this.userService.getAllUsers();
    return { message: 'Users fetched successfully!', user };
  }
}
