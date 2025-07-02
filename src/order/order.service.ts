import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from 'src/cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cartService: CartService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate totals
    const subtotal = cart.total;
    const taxAmount = subtotal * 0.08; 
    const shippingCost = subtotal > 100 ? 0 : 15;
    const totalAmount = subtotal + taxAmount + shippingCost;

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      user: user as { id: string },
      totalAmount,
      shippingCost,
      taxAmount,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        order: savedOrder,
        product: cartItem.product,
        quantity: cartItem.quantity,
        price: cartItem.price,
        totalPrice: cartItem.price * cartItem.quantity,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    // Clear cart
    await this.cartService.clearCart(userId);

    return this.getOrder(savedOrder.id, userId);
  }

  async getUserOrders(userId: string, page: number, limit: number) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(orderId: string, userId?: string) {
    const whereCondition: any = { id: orderId };
    if (userId) {
      whereCondition.user = { id: userId };
    }

    const order = await this.orderRepository.findOne({
      where: whereCondition,
      relations: [
        'orderItems',
        'orderItems.product',
        'orderItems.product.brand',
        'user',
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders(page: number, limit: number) {
    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['user', 'orderItems'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    return this.orderRepository.save(order);
  }
}
