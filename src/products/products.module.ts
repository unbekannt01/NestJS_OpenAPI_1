import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ProductsService } from "./products.service"
import { ProductsController } from "./products.controller"
import { Product } from "./entities/product.entity"
import { ToolSpecification } from "./entities/tool-specification.entity"
import { User } from "src/user/entities/user.entity"
import { Category } from "src/categories/entities/categories.entity"
import { Brand } from "src/brands/entities/brand.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Product, ToolSpecification, User, Category, Brand])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
