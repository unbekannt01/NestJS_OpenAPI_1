import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class LoginUserDto {

    @IsNotEmpty()
    @ApiProperty()
    identifier : string;

    @IsNotEmpty()
    @ApiProperty()
    password : string;
}
