import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { BrandsService } from './brand.service';
import { Admin } from 'src/common/decorators/admin.decorator';

@Controller({ path: 'brands', version: '1' })
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post('add-brand')
  @Admin()
  create(createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get('get-all-brand')
  @Public()
  findAll() {
    return this.brandsService.findAll();
  }

  @Get('featured')
  @Public()
  findFeatured() {
    return this.brandsService.findFeatured();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @Admin()
  update(@Param('id') id: string, updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
