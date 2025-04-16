import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ChangePwdDto {

    @IsEmail()
    @ApiProperty()
    email:string

    @IsNotEmpty()
    @ApiProperty()
    password : string;

    @IsString()
    @ApiProperty()
    newpwd : string;
}