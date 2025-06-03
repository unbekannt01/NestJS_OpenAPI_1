import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * ForgotPwdDto
 * This class is used to define the data transfer object for the forgot password request.
 */

export class ForgotPwdDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
