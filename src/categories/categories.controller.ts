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
    // @Req() req: Request,
  ) {
    return this.categoriesService.createSubCategory(createCategoryDto);
  }

  @Get('getAll')
  @Public()
  findAll() {
    return this.categoriesService.findAll();
  }

  // Get only main categories (for dropdown)
  @Get('main')
  @Public()
  getMainCategories() {
    return this.categoriesService.getMainCategories();
  }

  @Get(':categoryId/subcategories')
  @Public()
  getSubCategoriesByCategoryId(@Param('categoryId') categoryId: string) {
    return this.categoriesService.getSubCategoriesByCategoryId(categoryId);
  }

  @Admin()
  @Get('tree')
  @Public()
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoriesService.findCategoryOrSubcategoryById(id);
  }

  @Patch('updateCategory/:id')
  @Admin()
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Patch('updateSubCategory/:id')
  @Admin()
  updateSubCategory(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(id, updateSubCategoryDto);
  }

  @Delete('deteteCategory/:id')
  @Admin()
  removecategory(@Param('id') id: string) {
    return this.categoriesService.removeCategory(id);
  }

  @Delete('deleteSubcategory/:id')
  @Admin()
  removesubcategory(@Param('id') id: string) {
    return this.categoriesService.removeSubCategory(id);
  }
}
