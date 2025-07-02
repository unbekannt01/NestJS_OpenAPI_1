import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ReviewController } from "./review.controller"
import { ReviewService } from "./review.service"
import { Review } from "./entities/review.entity"
import { Product } from "src/products/entities/product.entity"
import { User } from "src/user/entities/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, User])],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
