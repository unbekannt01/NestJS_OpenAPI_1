import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

/**
 * UnblockUserDto
 * This DTO is used for unblocking a user.
 */
export class UnblockUserDto {

    @IsEmail()
    @ApiProperty()
    email: string;
    
}
