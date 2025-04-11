import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class LogoutUserDto {

    @IsEmail()
    @ApiProperty()
    email : string;

}
