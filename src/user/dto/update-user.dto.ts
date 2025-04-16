import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  @ApiProperty()
  userName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  first_name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  last_name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  mobile_no?: string;

  @IsOptional()
  @ApiProperty({ type: 'string', default: "yyyy-mm-dd" })
  birth_date?: Date | null; // Ensure TypeORM can handle null correctly
}
