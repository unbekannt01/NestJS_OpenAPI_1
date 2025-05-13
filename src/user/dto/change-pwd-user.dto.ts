import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ChangePwdDto {

    @IsNotEmpty()
    @ApiProperty()
    password : string;

    @IsString()
    @ApiProperty()
    newpwd : string;
}