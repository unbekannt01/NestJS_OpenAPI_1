import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { BrandsService } from './brand.service';
import { Admin } from 'src/common/decorators/admin.decorator';

@Controller({ path: 'brands', version: '1' })
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post('add')
  @Admin()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Post('bulk')
  @Admin()
  createBulk(@Body() createBrandDto: CreateBrandDto[]) {
    return this.brandsService.createMultiple(createBrandDto);
  }

  @Get('getAll')
  @Public()
  findAll() {
    return this.brandsService.findAll();
  }

  @Public()
  @Get('tree')
  getBrandsWithCategoriesTree() {
    return this.brandsService.findBrandsWithCategoriesTree();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @Admin()
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
