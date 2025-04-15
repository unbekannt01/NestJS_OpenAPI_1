import { Controller, Body, Get, NotFoundException, Put, Param, BadRequestException, UseGuards, Response as Res, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
  @Get('profile')
  async getProfile(@Req() req : any) {
    const userId = req.user.id; // Get user ID from JWT token
    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

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
