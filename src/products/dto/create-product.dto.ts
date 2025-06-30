import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean, Min } from "class-validator"
import { PowerType, ToolCondition } from "../entities/product.entity"

export class CreateProductDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsEnum(ToolCondition)
  condition?: ToolCondition

  @IsOptional()
  @IsEnum(PowerType)
  powerType?: PowerType

  @IsOptional()
  @IsString()
  voltage?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number

  @IsOptional()
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean

  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean

  @IsOptional()
  @IsString()
  warrantyPeriod?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedAccessories?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleWith?: string[]

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsNumber()
  @Min(0)
  stockQuantity: number
}
