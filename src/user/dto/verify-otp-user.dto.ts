import { ApiProperty } from "@nestjs/swagger";
import { OtpType } from "../entities/user.entity";

export class VerifyOTPDto {

    @ApiProperty()
    email : string;

    @ApiProperty()
    otp : string;
}
