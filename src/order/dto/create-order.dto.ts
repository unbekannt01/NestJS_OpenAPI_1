import { IsObject, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

class AddressDto {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export class CreateOrderDto {
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress: AddressDto
}
