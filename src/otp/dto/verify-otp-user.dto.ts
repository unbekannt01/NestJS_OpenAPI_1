import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * VerifyOTPDto
 * This class is used to define the data transfer object for verifying OTP.
 */
export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
