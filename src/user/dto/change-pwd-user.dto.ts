import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

/**
 * ChangePwdDto
 * This DTO is used for changing the password of a user.
 */
export class ChangePwdDto {

    @IsNotEmpty()
    @ApiProperty()
    password : string;

    @IsString()
    @ApiProperty()
    newpwd : string;
}