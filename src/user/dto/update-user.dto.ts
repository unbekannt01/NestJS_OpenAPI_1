import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    first_name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    last_name? : string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    mobile_no? : string;
}
