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

  async findAll() {
    return this.brandRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findFeatured() {
    return this.brandRepository.find({
      where: { isActive: true, isFeatured: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products', 'products.category', 'product.category.parent'],
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

  // async findBrandsWithCategoriesTree(): Promise<any[]> {
  //   const brands = await this.brandRepository.find({
  //     relations: ['products', 'products.category', 'products.category.parent'],
  //   });

  //   const result = brands.map((brand) => {
  //     const categoryMap = new Map();

  //     brand.products.forEach((product) => {
  //       const cat = product.category;

  //       if (cat?.category?.id) {
  //         // It's a subcategory
  //         if (!categoryMap.has(cat.category.id)) {
  //           categoryMap.set(cat.category.id, {
  //             id: cat.category.id,
  //             name: cat.category.name,
  //             children: [],
  //           });
  //         }
  //         categoryMap.get(cat.category.id).children.push({
  //           id: cat.id,
  //           name: cat.name,
  //         });
  //       } else {
  //         // It's a top-level category
  //         if (!categoryMap.has(cat.id)) {
  //           categoryMap.set(cat.id, {
  //             id: cat.id,
  //             name: cat.name,
  //             children: [],
  //           });
  //         }
  //       }
  //     });

  //     return {
  //       id: brand.id,
  //       name: brand.name,
  //       categories: [...categoryMap.values()],
  //     };
  //   });

  //   return result;
  // }
}
