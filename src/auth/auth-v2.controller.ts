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

@Controller({ path: 'auth', version: '2' })
export class Auth2Controller {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * This endpoint allows users to register using an email token.
   */
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: CreateUserDto,
  ) {
    return await this.authService.registerUsingEmailToken(registerDto, file);
  }
}
