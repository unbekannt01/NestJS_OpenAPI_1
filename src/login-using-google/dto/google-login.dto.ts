import { IsNotEmpty, IsString } from 'class-validator';

/**
 * GoogleLoginDto
 * This class is used to define the data transfer object for Google login.
 */
export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  credential: string;
}
