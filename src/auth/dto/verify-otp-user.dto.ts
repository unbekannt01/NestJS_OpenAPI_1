import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsInt } from "class-validator";

export class VerifyOTPDto {

    @IsEmail()
    @ApiProperty()
    email : string;

    @IsInt()
    @ApiProperty()
    otp : string;
}
