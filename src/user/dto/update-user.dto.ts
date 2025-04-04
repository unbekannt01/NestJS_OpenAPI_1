import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty()
    userName?: string;

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
