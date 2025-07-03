import { IsUUID, IsString } from "class-validator"

export class ConfirmPaymentDto {
  @IsUUID()
  paymentId: string

  @IsString()
  razorpayOrderId: string

  @IsString()
  razorpayPaymentId: string

  @IsString()
  razorpaySignature: string
}
