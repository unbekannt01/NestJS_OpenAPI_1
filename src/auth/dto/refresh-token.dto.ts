import { IsUUID } from "class-validator";

export class RefreshTokenDto {

    @IsUUID()
    refresh_token: string;
    
}