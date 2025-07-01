import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateSubCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
