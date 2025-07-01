import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  Req,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Admin } from 'src/common/decorators/admin.decorator';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { Request } from 'express';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Admin()
  @Post('add-category')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Admin()
  @Post('add-subcategory')
  createSubCategory(
    @Body() createCategoryDto: CreateSubCategoryDto,
    @Req() req: Request,
  ) {
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

  @Patch('updateCategory/:id')
  @Admin()
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Patch('updateSubCategory/:id')
  @Admin()
  updateSubCategory(@Param('id') id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    return this.categoriesService.updateSubCategory(id, updateSubCategoryDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
