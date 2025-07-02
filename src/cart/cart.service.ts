import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getCart(userId: string) {
    const cartItems = await this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.brand'],
    });

    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      items: cartItems,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already exists in cart
    let cartItem = await this.cartRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartRepository.create({
        user: user as { id: string },
        product,
        quantity,
        price: product.price,
      });
    }

    return this.cartRepository.save(cartItem);
  }

  async updateCartItem(itemId: string, quantity: number) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: itemId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      return this.cartRepository.remove(cartItem);
    }

    cartItem.quantity = quantity;
    return this.cartRepository.save(cartItem);
  }

  async removeFromCart(itemId: string) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: itemId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartRepository.remove(cartItem);
  }

  async clearCart(userId: string) {
    await this.cartRepository.delete({ user: { id: userId } });
    return { message: 'Cart cleared successfully' };
  }
}
