import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    const slug = this.generateSlug(createBrandDto.name);

    const brand = this.brandRepository.create({
      ...createBrandDto,
      slug,
    });

    return this.brandRepository.save(brand);
  }

  async createMultiple(createBrandDto: CreateBrandDto[]) {
    const brands = await this.brandRepository.create(createBrandDto);
    return await this.brandRepository.save(brands);
  }

  async findAll() {
    return this.brandRepository.find({
      where: { isActive: true },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: [
        'products',
        // 'products.subCategory',
        // 'product.subCategory.category',
      ],
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.findOne(id);

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      updateBrandDto.slug = this.generateSlug(updateBrandDto.name);
    }

    await this.brandRepository.update(id, updateBrandDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.brandRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Brand not found');
    }

    return { message: 'Brand deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getMainBrands() {
    try {
      const brand = await this.brandRepository.find({
        where: {
          isActive: true,
        },
        order: { name: 'ASC'},
        select: ['id','name','description'],
      });

      return {
        success: true,
        message: 'Brand Fetched successfully',
        data: brand,
      };
    } catch (error) {
      console.log('Error fetching brands:', error)
      return {
        success: false,
        message: 'Failed to fetch brands',
        date: [],
      }
    }
  }

  async findBrandsWithCategoriesTree(): Promise<any[]> {
    const brands = await this.brandRepository.find({
      relations: [
        'products',
        'products.subCategory',
        'products.subCategory.category',
      ],
    });

    const result = brands.map((brand) => {
      const categoryMap = new Map<string, any>();

      brand.products.forEach((product) => {
        const subCategory = product.subCategory;
        const category = subCategory?.category;
        if (!category) return;

        // Group by category
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            id: category.id,
            name: category.name,
            subcategories: [],
          });
        }

        // Add subcategory under its parent category
        categoryMap.get(category.id).subcategories.push({
          id: subCategory.id,
          name: subCategory.name,
        });
      });

      return {
        id: brand.id,
        name: brand.name,
        categories: [...categoryMap.values()],
      };
    });

    return result;
  }
}
