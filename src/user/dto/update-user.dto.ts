import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto{
    
    @ApiProperty()
    first_name : string;

    @ApiProperty()
    last_name : string;
}
