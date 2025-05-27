import {
  Controller,
  Post,
  Body,
  Response as Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller({ path: 'auth', version: '3' })
export class Auth3Controller {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * This endpoint allows users to register with their details and an avatar image.
   */
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.simpleRegister(registerDto, file);
  }
}
