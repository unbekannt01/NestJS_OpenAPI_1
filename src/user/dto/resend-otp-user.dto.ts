import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendOTPDto {

    @IsEmail()
    @ApiProperty()
    email : string;

}
