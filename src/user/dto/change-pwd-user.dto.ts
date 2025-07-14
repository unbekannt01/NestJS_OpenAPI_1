import { IsNotEmpty, IsString } from "class-validator";

export class ChangePwdDto {

    @IsNotEmpty()
    password : string;

    @IsString()
    newpwd : string;
}