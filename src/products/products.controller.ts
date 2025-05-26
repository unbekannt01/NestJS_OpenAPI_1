import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: 'product', version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('add')
  async create(@Body() createProductDto: CreateProductDto, @UserId() userId: string) {
    return this.productsService.createProduct(createProductDto, userId);
  }

  @Public()
  @Get('getall')
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete('deleteProduct/:id')
  delete(@Param('id') id:string){
    return this.productsService.remove(id)
  }
}
