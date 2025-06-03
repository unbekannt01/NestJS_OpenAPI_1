import { IsEmail } from 'class-validator';

/**
 * UnblockUserDto
 * This DTO is used for unblocking a user.
 */
export class UnblockUserDto {
  @IsEmail()
  email: string;
}
