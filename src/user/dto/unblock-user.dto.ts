import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class UnblockUserDto {

    @IsEmail()
    @ApiProperty()
    email: string;
    
}
