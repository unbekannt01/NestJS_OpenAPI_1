import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateUserDto {

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    first_name?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    last_name? : string;

    @IsNotEmpty()
    @ApiProperty()
    mobile_no? : string;
}
