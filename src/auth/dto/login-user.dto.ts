import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

/**
 * LoginUserDto
 * This class is used to define the data transfer object for user login.
 */

export class LoginUserDto {

    @IsNotEmpty()
    email : string;

    @IsNotEmpty()
    password : string;
}
