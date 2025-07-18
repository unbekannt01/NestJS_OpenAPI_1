import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, type Repository } from 'typeorm';
import { Category } from './entities/categories.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from './entities/sub-categories.entity';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto[]) {
    // const slug = this.generateSlug(createCategoryDto.name);

    const category = await this.categoryRepository.create(
      createCategoryDto,
      // slug,
    );

    return this.categoryRepository.save(category);
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slug = this.generateSlug(dto.name);
    let counter = 1;

    // Check if slug already exists and generate unique one
    while (await this.subCategoryRepository.findOne({ where: { slug } })) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      counter++;
    }

    const subCategory = this.subCategoryRepository.create({
      ...dto,
      slug,
      categoryId: dto.categoryId,
    });

    return this.subCategoryRepository.save(subCategory);
  }

  async createSubCategory1(dtos: CreateSubCategoryDto[]) {
    const subCategories: SubCategory[] = [];

    for (const dto of dtos) {
      if (!dto.categoryId) {
        throw new BadRequestException(
          `Missing categoryId for subcategory: ${dto.name}`,
        );
      }

      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} not found`,
        );
      }

      const slug = this.generateSlug(dto.name);

      const subCategory = this.subCategoryRepository.create({
        ...dto,
        slug,
        categoryId: dto.categoryId,
      });

      subCategories.push(subCategory);
    }

    return this.subCategoryRepository.save(subCategories);
  }

  async findAll() {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['subcategories'],
      select: ['id', 'name', 'description'],
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

  async findCategoryOrSubcategoryById(id: string) {
    // Try to find in Category first
    const category = await this.categoryRepository.findOne({
      where: { id },
      select: ['id', 'name', 'description'],
    });

    if (category) {
      return {
        type: 'category',
        data: category,
      };
    }

    // If not found, try in SubCategory
    const subcategory = await this.subCategoryRepository.findOne({
      where: { id },
      select: ['id', 'name', 'description', 'categoryId'],
    });

    if (subcategory) {
      return {
        type: 'subcategory',
        data: subcategory,
      };
    }

    throw new NotFoundException(
      'No category or subcategory found with the given ID',
    );
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findCategoryOrSubcategoryById(id);

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== category.data.name
    ) {
      updateCategoryDto.slug = this.generateSlug(updateCategoryDto.name);
    }

    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findCategoryOrSubcategoryById(id);
  }

  async updateSubCategory(
    id: string,
    updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    const category = await this.findCategoryOrSubcategoryById(id);

    if (
      updateSubCategoryDto.name &&
      updateSubCategoryDto.name !== category.data.name
    ) {
      updateSubCategoryDto.slug = this.generateSlug(updateSubCategoryDto.name);
    }
    await this.subCategoryRepository.update(id, updateSubCategoryDto);
    return this.findCategoryOrSubcategoryById(id);
  }

  async removeCategory(id: string) {
    const result = await this.categoryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'Category deleted successfully' };
  }

  async removeSubCategory(id: string) {
    const result = await this.subCategoryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Subcategory not found');
    }
    return { message: 'Subcategory deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getMainCategories() {
    try {
      const categories = await this.categoryRepository.find({
        where: {
          isActive: true,
        },
        order: { name: 'ASC' },
        select: ['id', 'name', 'description', 'isActive'],
      });

      return {
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
      };
    } catch (error) {
      console.error('Error fetching main categories:', error);
      return {
        success: false,
        message: 'Failed to fetch categories',
        data: [],
      };
    }
  }

  // Get subcategories by category ID
  async getSubCategoriesByCategoryId(categoryId: string) {
    try {
      const subCategories = await this.subCategoryRepository.find({
        where: {
          categoryId: categoryId,
          isActive: true,
        },
        order: { name: 'ASC' },
        select: ['id', 'name', 'description', 'categoryId', 'isActive'],
      });

      return {
        success: true,
        message: 'Subcategories fetched successfully',
        data: subCategories,
      };
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return {
        success: false,
        message: 'Failed to fetch subcategories',
        data: [],
      };
    }
  }
}
