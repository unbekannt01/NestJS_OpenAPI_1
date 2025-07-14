import { IsEmail } from 'class-validator';

export class ResendOTPDto {
  @IsEmail()
  email: string;
}
