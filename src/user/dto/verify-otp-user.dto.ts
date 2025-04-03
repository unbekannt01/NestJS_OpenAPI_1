import { ApiProperty } from "@nestjs/swagger";
import { OtpType } from "../entities/user.entity";
import { IsEmail, IsNotEmpty } from "class-validator";

export class VerifyOTPDto {

    @IsEmail()
    @ApiProperty()
    email : string;

    @IsNotEmpty()
    @ApiProperty()
    otp : string;
}
