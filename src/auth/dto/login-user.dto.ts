import { IsNotEmpty } from 'class-validator';

/**
 * LoginUserDto
 * This class is used to define the data transfer object for user login.
 */

export class LoginUserDto {
  @IsNotEmpty()
  identifier: string;

  @IsNotEmpty()
  password: string;
}
