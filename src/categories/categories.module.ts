import { Module } from "@nestjs/common"
import { CategoriesService } from "./categories.service"
import { CategoriesController } from "./categories.controller"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Category } from "./entities/categories.entity"
import { SubCategory } from "./entities/sub-categories.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Category, SubCategory])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
