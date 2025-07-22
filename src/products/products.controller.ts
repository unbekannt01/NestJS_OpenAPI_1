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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Admin } from 'src/common/decorators/admin.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('add-bulk')
  @Admin()
  createBulk(
    @Body() createProductDto: CreateProductDto[],
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      throw new Error('Admin Information is missing from request.');
    }
    return this.productsService.createBulkProducts(createProductDto, userId);
  }

  // @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('getAll')
  @Public()
  findAll() {
    return this.productsService.getAllProducts();
  }

  @Get('search')
  @Public()
  async search(@Query() searchDto: ProductSearchDto) {
    try {
      return await this.productsService.searchProducts(searchDto);
    } catch (error) {
      console.error('Search endpoint error:', error);
      return {
        success: false,
        message: 'Search failed',
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  @Get('featured')
  @Public()
  getFeatured(@Query('limit') limit?: number) {
    return this.productsService.getFeaturedProducts(limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('getById/:id')
  getById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':id/recommendations')
  @Public()
  getRecommendations(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getProductRecommendations(id, limit);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    return this.productsService.update(id, user.userId, updateProductDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
