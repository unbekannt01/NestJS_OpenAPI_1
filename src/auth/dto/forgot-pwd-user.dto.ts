import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

/**
 * ForgotPwdDto
 * This class is used to define the data transfer object for the forgot password request.
 */

export class ForgotPwdDto {

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    email : string;
}
