import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPwdDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
