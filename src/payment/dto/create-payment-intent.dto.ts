import { IsUUID, IsEnum, IsOptional } from "class-validator"
import { PaymentMethod } from "../entities/payment.entity"

export class CreatePaymentIntentDto {
  @IsUUID()
  orderId: string

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod: PaymentMethod = PaymentMethod.CARD
}
