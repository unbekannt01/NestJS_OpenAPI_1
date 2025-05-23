import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

/**
 * RefreshTokenDto
 * This class is used to define the data transfer object for refreshing tokens.
 */
export class RefreshTokenDto {

    @IsUUID()
    @ApiProperty()
    refresh_token: string;
    
}