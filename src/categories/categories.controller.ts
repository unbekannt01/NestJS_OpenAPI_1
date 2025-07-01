import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Admin } from 'src/common/decorators/admin.decorator';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Admin()
  @Post('add')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Admin()
  @Post('add-subcategory')
  createSubCategory(@Body() createCategoryDto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(createCategoryDto);
  }

  @Get('getAll')
  @Public()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @Public()
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Admin()
  update(@Param('id') id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
