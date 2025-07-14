import { IsEmail } from 'class-validator';

export class UnblockUserDto {
  @IsEmail()
  email: string;
}
