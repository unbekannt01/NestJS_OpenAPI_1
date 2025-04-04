import { ApiProperty } from "@nestjs/swagger";
import { OtpType } from "../entities/user.entity";
import { IsEmail, IsNotEmpty } from "class-validator";

export class VerifyOTPDto {

    @ApiProperty()
    email : string;

    @ApiProperty()
    otp : string;
}
