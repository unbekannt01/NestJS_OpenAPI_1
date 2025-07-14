import { IsNotEmpty, IsUUID } from 'class-validator';

export class LogoutUserDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
