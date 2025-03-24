/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/register')
  create(@Body() createUserDto: CreateUserDto) {
    const user = this.userService.save(createUserDto);
    return user;
  }

  @ApiBearerAuth()
  @Post('/login')
  async login(
    @Request() req,
    @Body() { email , password } : LoginUserDto) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.userService.login(email,password, token);
  }

  @Get('/GetAll')
  async getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
}
