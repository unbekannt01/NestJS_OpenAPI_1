import { IsEmail, IsNotEmpty } from "class-validator";

export class ResetPwdDto {

    @IsEmail()
    email : string;

    @IsNotEmpty()
    newpwd : string;
}
