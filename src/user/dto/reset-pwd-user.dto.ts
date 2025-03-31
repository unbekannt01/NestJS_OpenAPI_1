import { ApiProperty } from "@nestjs/swagger";

export class ResetPwdDto {

    @ApiProperty()
    newpwd : string;
}
