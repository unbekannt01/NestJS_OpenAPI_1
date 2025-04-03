import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ForgotPwdDto {

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    email : string;
}
