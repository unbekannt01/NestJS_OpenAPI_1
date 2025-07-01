import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Body,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('add')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      throw new Error('User information is missing from request.');
    }
    return this.productsService.createProduct(createProductDto, userId);
  }

  @Get('getAll')
  @Public()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  @Public()
  search(@Query() searchDto: ProductSearchDto) {
    return this.productsService.searchProducts(searchDto);
  }

  @Get('featured')
  @Public()
  getFeatured(@Query('limit') limit?: number) {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/recommendations')
  @Public()
  getRecommendations(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getProductRecommendations(id, limit);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
