import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ToolSpecification } from './entities/tool-specification.entity';
import { User } from 'src/user/entities/user.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { SubCategory } from 'src/categories/entities/sub-categories.entity';
import { FileUploadUsingCloudinaryService } from 'src/file-upload-using-cloudinary/file-upload-using-cloudinary.service';
import { UploadFile } from 'src/file-upload/entities/file-upload.entity';
import { CloudinaryModule } from 'src/common/services/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ToolSpecification,
      User,
      SubCategory,
      Brand,
      UploadFile
    ]),
    CloudinaryModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService, FileUploadUsingCloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
