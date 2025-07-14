import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsString,
} from 'class-validator';

export class CreateUserDto1 {

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  password: string;

}
