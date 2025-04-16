import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class RefreshTokenDto {

    @IsUUID()
    @ApiProperty()
    refresh_token: string;
    
}