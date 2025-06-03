import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * LogoutUserDto
 * This class is used to define the data transfer object for user logout.
 */

export class LogoutUserDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
