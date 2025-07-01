import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ProductsService } from "./products.service"
import { ProductsController } from "./products.controller"
import { Product } from "./entities/product.entity"
import { ToolSpecification } from "./entities/tool-specification.entity"
import { User } from "src/user/entities/user.entity"
import { Brand } from "src/brands/entities/brand.entity"
import { SubCategory } from "src/categories/entities/sub-categories.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Product, ToolSpecification, User, SubCategory, Brand])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
