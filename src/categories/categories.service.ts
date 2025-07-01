import { Injectable, NotFoundException } from '@nestjs/common';
import { IsNull, type Repository } from 'typeorm';
import { Category } from './entities/categories.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from './entities/sub-categories.entity';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const slug = this.generateSlug(createCategoryDto.name);

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoryRepository.save(category);
  }

  async createSubCategory(createSubCategoryDto: CreateSubCategoryDto) {
    const slug = this.generateSlug(createSubCategoryDto.name);

    const subCategory = this.subCategoryRepository.create({
      ...createSubCategoryDto,
      slug,
    });
  }

  async findAll() {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findTree() {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['subcategories', 'subcategories.products'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((category) => ({
      ...category,
      children: category.subcategories.map((sub) => ({
        ...sub,
        products: sub.products || [],
      })),
    }));
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      updateCategoryDto.slug = this.generateSlug(updateCategoryDto.name);
    }

    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.categoryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
