import { ApiProperty } from '@nestjs/swagger';
import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/**
 * CreateUserDto
 * This class is used to define the data transfer object for creating a new user.
 * It includes validation rules for each property.
 */
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @Transform(({ value }) => value.toLowerCase())
  userName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  first_name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  last_name: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty()
  // @MinLength(8)
  @ApiProperty()
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/)
  @ApiProperty()
  mobile_no: string;

  @IsOptional()
  @ApiProperty({ type: 'string', default: 'yyyy-mm-dd' })
  @IsNotEmpty()
  birth_date: Date | null;

  @ApiProperty()
  @IsOptional()
  avatar?: string;
}
