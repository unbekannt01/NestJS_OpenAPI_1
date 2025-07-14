import { ApiProperty } from '@nestjs/swagger';
import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @Transform(({ value }) => value.toLowerCase())
  userName: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  first_name: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  last_name: string;

  @IsEmail()
  @ApiProperty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  // @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  //   message:
  //     'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  // })
  password: string;

  @IsOptional()
  @Matches(/^\+\d{10,15}$/)
  @ApiProperty()
  mobile_no: string;

  @IsOptional()
  @ApiProperty({ type: 'string', default: 'yyyy-mm-dd' })
  birth_date: Date | null;

  @ApiProperty()
  @IsOptional()
  avatar?: string;
}
