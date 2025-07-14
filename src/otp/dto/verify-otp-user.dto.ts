import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
