import { IsNotEmpty, IsString } from "class-validator";

/**
 * ChangePwdDto
 * This DTO is used for changing the password of a user.
 */
export class ChangePwdDto {

    @IsNotEmpty()
    password : string;

    @IsString()
    newpwd : string;
}