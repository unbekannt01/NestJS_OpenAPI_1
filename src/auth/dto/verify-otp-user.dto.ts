import { ApiProperty } from "@nestjs/swagger";

export class VerifyOTPDto {

    @ApiProperty()
    email : string;

    @ApiProperty()
    otp : string;
}
