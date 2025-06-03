import { IsEmail } from 'class-validator';

/**
 * ResendOTPDto
 * This class is used to define the data transfer object for resending OTP.
 */
export class ResendOTPDto {
  @IsEmail()
  email: string;
}
