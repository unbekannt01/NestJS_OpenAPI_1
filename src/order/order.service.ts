import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CartService } from 'src/cart/cart.service';

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
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subtotal = cart.total;
    const taxAmount = subtotal * 0.08;
    const shippingCost = subtotal > 100 ? 0 : 15;
    const totalAmount = subtotal + taxAmount + shippingCost;

    const order = this.orderRepository.create({
      orderNumber,
      user: { id: userId },
      totalAmount,
      shippingCost,
      taxAmount,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

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
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
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

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      userId: order.user.id,
      orderItems: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        product: {
          id: item.product.id,
          name: item.product.name,
        },
      })),
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
    };
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

  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        user: { id: userId },
      },
    });

    if (!order) throw new NotFoundException('Order Not Found...!');

    await this.orderRepository.delete(orderId);
    return { message: 'Order Removed Successfully...!' };
  }
}
