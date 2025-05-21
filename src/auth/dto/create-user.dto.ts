import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "@nestjs/class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    @Transform(({ value }) => value.toLowerCase())
    userName: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    first_name: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    last_name: string;

    @IsEmail()
    @ApiProperty()
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @IsNotEmpty()
    // @MinLength(8)
    @ApiProperty()
    password: string;

    @IsNotEmpty()
    @Matches(/^\+\d{10,15}$/)
    @ApiProperty()
    mobile_no: string;

    @ApiProperty({ type: 'string', default: "yyyy-mm-dd" })
    @IsNotEmpty()
    birth_date: Date | null;

    @ApiProperty()
    @IsOptional()
    avatar? : string;
}

