import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsString,
} from 'class-validator';

/**
 * CreateUserDto
 * This class is used to define the data transfer object for creating a new user.
 * It includes validation rules for each property.
 */
export class CreateUserDto1 {

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  password: string;

}
