import { ApiProperty } from "@nestjs/swagger";
import { IS_LENGTH, IsEmail, IsNotEmpty, IsNumber, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    first_name : string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    last_name : string;

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    email : string;

    @IsNotEmpty()
    // @MinLength(8)
    @ApiProperty()
    password : string;

    @IsNotEmpty()
    @Matches(/^\+\d{10,15}$/)
    @ApiProperty()
    mobile_no : string;
}
