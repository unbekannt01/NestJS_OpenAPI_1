import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { PasswordService } from './password.service';
import { ChangePwdDto } from 'src/user/dto/change-pwd-user.dto';
import { ForgotPwdDto } from 'src/auth/dto/forgot-pwd-user.dto';
import { ResetPwdDto } from 'src/auth/dto/reset-pwd-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: 'password', version: '1' })
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @HttpCode(HttpStatus.OK)
  @Post('change-password/:id')
  changepwd(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: string,
    @Body() { password, newpwd }: ChangePwdDto,
  ) {
    return this.passwordService.changepwd(id, password, newpwd);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotpwd(@Body() { email }: ForgotPwdDto) {
    return this.passwordService.forgotPassword(email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetpwd(@Body() { email, newpwd }: ResetPwdDto) {
    return this.passwordService.resetPassword(email, newpwd);
  }
}
