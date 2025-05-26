import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createProduct(dto: CreateProductDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = this.productRepository.create({
      ...dto,
      user,
    });

    const savedProduct = await this.productRepository.save(product);

    return {
      id: savedProduct.id,
      name: savedProduct.name,
      qty: savedProduct.qty,
      price: savedProduct.price,
      userId: user.id,
    };
  }

  findAll() {
    return this.productRepository.find();
  }

  findOne(id: string) {
    return this.productRepository.findOneBy({ id });
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
}
