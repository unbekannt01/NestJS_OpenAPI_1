import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../entities/user.entity";

export class RefreshTokenDto {
    @ApiProperty()
    token : string;

    @ApiProperty()
    userId : string;

    @ApiProperty()
    role : UserRole;
}