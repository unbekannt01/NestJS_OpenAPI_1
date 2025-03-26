/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/register')
  create(@Body() createUserDto: CreateUserDto) {
    const user = this.userService.save(createUserDto);
    return user;
  }

  @Post('/login')
  async login(
    @Body() { email , password } : LoginUserDto) {
    return this.userService.login(email,password);
  }

  @Get('/GetAll')
  async getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
}
