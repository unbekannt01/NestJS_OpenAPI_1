import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    if (dto.subCategoryId) {
      subcategory = await this.categoryRepository.findOne({
        where: { id: dto.subCategoryId },
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
      ...dto,
      sku,
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

  async createBulkProducts(dtos: CreateProductDto[], userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingSkus = new Set<string>();
    const batchSkus = new Set<string>();

    const generatedDtos = await Promise.all(
      dtos.map(async (dto) => {
        let baseSku = this.generateSKU(dto.name);
        let uniqueSku = baseSku;
        let counter = 1;

        while (
          existingSkus.has(uniqueSku) ||
          batchSkus.has(uniqueSku) ||
          (await this.productRepository.findOne({ where: { sku: uniqueSku } }))
        ) {
          uniqueSku = `${baseSku}-${counter++}`;
        }

        batchSkus.add(uniqueSku);

        return {
          ...dto,
          sku: uniqueSku,
        };
      }),
    );

    const products = await Promise.all(
      generatedDtos.map(async (dto) => {
        const subCategory = dto.subCategoryId
          ? await this.categoryRepository.findOneBy({ id: dto.subCategoryId })
          : null;

        const brand = dto.brandId
          ? await this.brandRepository.findOneBy({ id: dto.brandId })
          : null;

        return this.productRepository.create({
          ...dto,
          user,
          subCategory,
          brand,
        } as Partial<Product>);
      }),
    );

    return this.productRepository.save(products);
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
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.subCategory', 'subCategory')
      .leftJoin('subCategory.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    // Select only required fields
    queryBuilder.select([
      'product.id',
      'product.name',
      'product.model',
      'product.price',
      'product.originalPrice',
      'product.images',
      'product.brandId',
      'product.subCategoryId',
      'product.stockQuantity',
      'brand.id',
      'brand.name',
      'subCategory.id',
      'subCategory.name',
      'category.id',
      'category.name',
    ]);

    // Text search
    if (query) {
      queryBuilder.andWhere(
        `(product.name ILIKE :query OR product.description ILIKE :query OR product.model ILIKE :query OR brand.name ILIKE :query)`,
        { query: `%${query}%` },
      );
    }

    // Filters
    if (categoryId) {
      queryBuilder.andWhere('subCategory.categoryId = :categoryId', {
        categoryId,
      });
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

    // Manual projection of simplified result
    const result = products.map((product: Product) => ({
      id: product.id,
      name: product.name,
      model: product.model,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images,
      stockQuantity: product.stockQuantity,
      brandName: product.brand?.name,
      brandId: product.brandId,
      subCategoryName: product.subCategory?.name,
      SubCategoryId: product.subCategory?.id,
      categoryName: product.subCategory?.category?.name,
      categoryId: product.subCategory?.category?.id,
    }));

    return {
      products: result,
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
      // relations: ['subCategory'],
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

  async getAllProducts() {
    const products = await this.productRepository.find({
      relations: ['brand', 'subCategory', 'subCategory.category'],
      where: { isActive: true },
    });

    return products.map((product) => ({
      ...product,
      brandName: product.brand?.name || null,
      subCategoryName: product.subCategory?.name || null,
      categoryName: product.subCategory?.category?.name || null,
    }));
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['brand', 'subCategory'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      brandName: product.brand?.name ?? '',
      subCategoryName: product.subCategory?.name ?? '',
    };
  }

   async findOneWithDetails(id: number): Promise<any> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Return with computed fields for your frontend
    return {
      id: product.id,
      name: product.name,
      model: product.model,
      price: product.price,
      originalPrice: product.originalPrice,
      stockQuantity: product.stockQuantity,
      brandId: product.brandId,
      brandName: product.brand?.name || '',
      subCategoryId: product.subCategoryId,
      subCategoryName: product.subCategory?.name || '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async findById(id: string) {
    return await this.productRepository.findOne({ where: { id } });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    if (!updateProductDto || Object.keys(updateProductDto).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    await this.productRepository.update(id, updateProductDto);
    return { message: 'Product Update Successfully...!' };
  }

  async remove(id: string) {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully' };
  }

  generateSKU(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toUpperCase()
      .substring(0, 20);
  }

  // async findBrandsWithCategoriesTree(): Promise<any[]> {
  //   const brands = await this.brandRepository.find({
  //     relations: [
  //       'products',
  //       'products.subCategory',
  //       'products.subCategory.category',
  //     ],
  //   });

  //   const result = brands.map((brand) => {
  //     const categoryMap = new Map<string, any>();

  //     brand.products.forEach((product) => {
  //       const subCategory = product.subCategory;
  //       const category = subCategory?.category;

  //       if (category) {
  //         if (!categoryMap.has(category.id)) {
  //           categoryMap.set(category.id, {
  //             id: category.id,
  //             name: category.name,
  //             children: [],
  //           });
  //         }

  //         if (subCategory) {
  //           categoryMap.get(category.id).children.push({
  //             id: subCategory.id,
  //             name: subCategory.name,
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
}
