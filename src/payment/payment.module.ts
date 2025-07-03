import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PaymentController } from "./payment.controller"
import { PaymentService } from "./payment.service"
import { Payment } from "./entities/payment.entity"
import { Order } from "../order/entities/order.entity"
import { User } from "../user/entities/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, User])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
