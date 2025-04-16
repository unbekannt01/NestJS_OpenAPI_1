import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class LogoutUserDto {

    @IsNotEmpty()
    @IsUUID()
    @ApiProperty()
    id : string;
}
