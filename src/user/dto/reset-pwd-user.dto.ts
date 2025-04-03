import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ResetPwdDto {

    @IsEmail()
    @ApiProperty()
    email : string;

    @IsNotEmpty()
    @ApiProperty()
    newpwd : string;
}
