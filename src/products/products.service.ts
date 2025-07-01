import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { SubCategory } from 'src/categories/entities/sub-categories.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SubCategory)
    private readonly categoryRepository: Repository<SubCategory>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async createProduct(dto: CreateProductDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let subcategory: SubCategory | null = null;
    if (dto.categoryId) {
      subcategory = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!subcategory) throw new NotFoundException('Sub-Category not found');
    }

    let brand: Brand | null = null;
    if (dto.brandId) {
      brand = await this.brandRepository.findOne({
        where: { id: dto.brandId },
      });
      if (!brand) throw new NotFoundException('Brand not found');
    }

    const sku = dto.sku || this.generateSKU(dto.name);

    const product = this.productRepository.create({
      name: dto.name,
      model: dto.model,
      description: dto.description,
      price: dto.price,
      originalPrice: dto.originalPrice,
      sku,
      images: dto.images,
      condition: dto.condition,
      powerType: dto.powerType,
      voltage: dto.voltage,
      weight: dto.weight,
      dimensions: dto.dimensions,
      isFeatured: dto.isFeatured,
      isOnSale: dto.isOnSale,
      warrantyPeriod: dto.warrantyPeriod,
      includedAccessories: dto.includedAccessories,
      compatibleWith: dto.compatibleWith,
      videoUrl: dto.videoUrl,
      stockQuantity: dto.stockQuantity,
      user,
      subCategory: subcategory,
      brand,
    } as Partial<Product>);

    const savedProduct = await this.productRepository.save(product as Product);

    return {
      id: savedProduct.id,
      name: savedProduct.name,
      price: savedProduct.price,
      sku: savedProduct.sku,
      userId: user.id,
    };
  }

  async searchProducts(searchDto: ProductSearchDto) {
    const {
      query,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      powerType,
      condition,
      isOnSale,
      isFeatured,
      sortBy = 'name',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = searchDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.specifications', 'specifications')
      .where('product.isActive = :isActive', { isActive: true });

    // Text search
    if (query) {
      queryBuilder.andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.model ILIKE :query OR brand.name ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Filters
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (brandId) {
      queryBuilder.andWhere('product.brandId = :brandId', { brandId });
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (powerType) {
      queryBuilder.andWhere('product.powerType = :powerType', { powerType });
    }

    if (condition) {
      queryBuilder.andWhere('product.condition = :condition', { condition });
    }

    if (isOnSale) {
      queryBuilder.andWhere('product.isOnSale = :isOnSale', { isOnSale });
    }

    if (isFeatured) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }

    // Sorting
    const validSortFields = [
      'name',
      'price',
      'averageRating',
      'salesCount',
      'createdAt',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getFeaturedProducts(limit = 10) {
    return this.productRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['brand', 'category'],
      order: { averageRating: 'DESC' },
      take: limit,
    });
  }

  async getProductRecommendations(productId: string, limit = 5) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['subCategory', 'subCategory.category', 'brand'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const recommendations = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('subCategory.category', 'category')
      .where('product.id != :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere(
        '(product.subCategoryId = :subCategoryId OR product.brandId = :brandId)',
        {
          subCategoryId: product.subCategory?.id,
          brandId: product.brand?.id,
        },
      )
      .orderBy('product.averageRating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .limit(limit)
      .getMany();

    return recommendations;
  }

  findAll() {
    return this.productRepository.find({
      relations: ['brand', 'category', 'specifications'],
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['brand', 'category', 'specifications', 'reviews'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return this.productRepository.update(id, updateProductDto);
  }

  async remove(id: string) {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully' };
  }

  private generateSKU(productName: string): string {
    const prefix = productName.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
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

        if (category) {
          if (!categoryMap.has(category.id)) {
            categoryMap.set(category.id, {
              id: category.id,
              name: category.name,
              children: [],
            });
          }

          if (subCategory) {
            categoryMap.get(category.id).children.push({
              id: subCategory.id,
              name: subCategory.name,
            });
          }
        }
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
