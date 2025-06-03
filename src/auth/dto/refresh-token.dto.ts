import { IsUUID } from "class-validator";

/**
 * RefreshTokenDto
 * This class is used to define the data transfer object for refreshing tokens.
 */
export class RefreshTokenDto {

    @IsUUID()
    refresh_token: string;
    
}