import { ApiProperty } from '@nestjs/swagger';
import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

/**
 * CreateUserDto
 * This class is used to define the data transfer object for creating a new user.
 * It includes validation rules for each property.
 */
export class CreateUserDto1 {

  @IsEmail()
  @ApiProperty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty()
  // @MinLength(8)
  @ApiProperty()
  password: string;

}
