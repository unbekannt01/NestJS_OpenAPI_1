import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { configService } from 'src/common/services/config.service';
const Razorpay = require('razorpay');

@Injectable()
export class PaymentService {
  private razorpay: any;
  private readonly logger = new Logger('PaymentService');

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    // @InjectRepository(User)
    // private userRepository: Repository<User>,
  ) {
    this.razorpay = new Razorpay({
      key_id: configService.getValue('RAZORPAY_KEY_ID'),
      key_secret: configService.getValue('RAZORPAY_KEY_SECRET'),
    });
  }

  // async createOrder1(amount: number, currency = 'INR') {
  //   const options = {
  //     amount: amount * 100,
  //     currency,
  //     receipt: `receipt_${Date.now()}`,
  //     payment_capture: 1, // auto capture
  //   };

  //   return await this.razorpay.orders.create(options);
  // }

  async createRazorpayOrder(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    const { orderId, paymentMethod } = createPaymentIntentDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order is not in pending status');

    const existingPayment = await this.paymentRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (existingPayment?.status === PaymentStatus.COMPLETED)
      throw new BadRequestException('Payment already completed for this order');

    try {
      const razorpayOrder = await this.razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: 'INR',
        receipt: `order_${order.id.slice(0, 8)}_${Date.now()}`,
        payment_capture: 1,
        notes: {
          orderId: order.id,
          userId: userId,
        },
      });

      const payment = await this.paymentRepository.save(
        existingPayment
          ? {
              ...existingPayment,
              razorpayOrderId: razorpayOrder.id,
              amount: order.totalAmount,
              status: PaymentStatus.PENDING,
            }
          : this.paymentRepository.create({
              order,
              user: order.user,
              amount: order.totalAmount,
              currency: 'INR',
              paymentMethod,
              razorpayOrderId: razorpayOrder.id,
              status: PaymentStatus.PENDING,
            }),
      );

      return {
        razorpayOrderId: razorpayOrder.id,
        paymentId: payment.id,
        amount: order.totalAmount,
        currency: 'INR',
        key: configService.getValue('RAZORPAY_KEY_ID'),
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
        },
        user: {
          name: `${order.user.first_name} ${order.user.last_name}`,
          email: order.user.email,
          contact: order.user.mobile_no || '',
        },
      };
    } catch (error) {
      this.logger.error('Error creating Razorpay order', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  verifySignature(rawBody: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  async verifyRazorpayPayment(
    userId: string,
    verifyDto: {
      paymentId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      verifyDto;

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, user: { id: userId } },
      relations: ['order', 'user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const generatedSignature = crypto
      .createHmac('sha256', configService.getValue('RAZORPAY_KEY_SECRET'))
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new BadRequestException(
        'Invalid signature. Payment verification failed.',
      );
    }

    const order = payment.order;
    order.status = OrderStatus.CONFIRMED;
    order.deliveredAt = new Date();

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = PaymentStatus.COMPLETED;

    // Save both in correct order
    await this.orderRepository.save(order);
    await this.paymentRepository.save(payment);

    return {
      success: true,
      message: 'Payment verified and records updated successfully',
    };
  }

  async processWebhookPayment(payload: any) {
    const razorpayOrderId = payload.order_id;
    const razorpayPaymentId = payload.id;

    const payment = await this.paymentRepository.findOne({
      where: { razorpayOrderId },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for orderId: ${razorpayOrderId}`);
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment already completed: ${payment.id}`);
      return;
    }

    const order = payment.order;

    order.status = OrderStatus.CONFIRMED;
    order.deliveredAt = new Date();

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = PaymentStatus.COMPLETED;
    payment.razorpaySignature = 'Webhook verified (server-side)';

    await this.orderRepository.save(order);
    await this.paymentRepository.save(payment);

    this.logger.log(`Payment verified & updated for order ${order.id}`);
  }

  // async createRazorpayOrder(
  //   userId: string,
  //   createPaymentIntentDto: CreatePaymentIntentDto,
  // ) {
  //   const { orderId, paymentMethod } = createPaymentIntentDto;

  //   // Get order details
  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId, user: { id: userId } },
  //     relations: ['user', 'orderItems', 'orderItems.product'],
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }

  //   if (order.status !== OrderStatus.PENDING) {
  //     throw new BadRequestException('Order is not in pending status');
  //   }

  //   // Check if payment already exists for this order
  //   const existingPayment = await this.paymentRepository.findOne({
  //     where: { order: { id: orderId } },
  //   });

  //   if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
  //     throw new BadRequestException('Payment already completed for this order');
  //   }

  //   try {
  //     // Create Razorpay Order
  //     const razorpayOrder = await this.razorpay.orders.create({
  //       amount: Math.round(order.totalAmount * 100), // Convert to paise (smallest currency unit)
  //       currency: 'INR',
  //       receipt: `order_${order.id.slice(0, 32)}`,
  //       notes: {
  //         orderId: order.id,
  //         userId: userId,
  //       },
  //     });

  //     // Create or update payment record
  //     let payment: Payment;
  //     if (existingPayment) {
  //       existingPayment.razorpayOrderId = razorpayOrder.id;
  //       existingPayment.amount = order.totalAmount;
  //       existingPayment.status = PaymentStatus.PENDING;
  //       payment = await this.paymentRepository.save(existingPayment);
  //     } else {
  //       payment = this.paymentRepository.create({
  //         order,
  //         user: order.user,
  //         amount: order.totalAmount,
  //         currency: 'INR',
  //         paymentMethod,
  //         razorpayOrderId: razorpayOrder.id,
  //         status: PaymentStatus.PENDING,
  //       });
  //       payment = await this.paymentRepository.save(payment);
  //     }

  //     return {
  //       razorpayOrderId: razorpayOrder.id,
  //       paymentId: payment.id,
  //       amount: order.totalAmount,
  //       currency: 'INR',
  //       key: configService.getValue('RAZORPAY_KEY_ID'),
  //       order: {
  //         id: order.id,
  //         totalAmount: order.totalAmount,
  //       },
  //       user: {
  //         name: order.user.first_name + ' ' + order.user.last_name,
  //         email: order.user.email,
  //         contact: order.user.mobile_no || '',
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error('Error creating Razorpay order:', error);
  //     throw new BadRequestException('Failed to create payment order');
  //   }
  // }

  // async getUserPayments(userId: string) {
  //   return this.paymentRepository.find({
  //     where: { user: { id: userId } },
  //     relations: ['order'],
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  // async getPayment(paymentId: string, userId?: string) {
  //   const whereCondition: any = { id: paymentId };
  //   if (userId) {
  //     whereCondition.user = { id: userId };
  //   }

  //   const payment = await this.paymentRepository.findOne({
  //     where: whereCondition,
  //     relations: [
  //       'order',
  //       'order.orderItems',
  //       'order.orderItems.product',
  //       'user',
  //     ],
  //   });

  //   if (!payment) {
  //     throw new NotFoundException('Payment not found');
  //   }

  //   return payment;
  // }

  // async getAllPayments() {
  //   return this.paymentRepository.find({
  //     relations: ['order', 'user'],
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  // async refundPayment(paymentId: string) {
  //   const payment = await this.paymentRepository.findOne({
  //     where: { id: paymentId },
  //     relations: ['order'],
  //   });

  //   if (!payment) {
  //     throw new NotFoundException('Payment not found');
  //   }

  //   if (payment.status !== PaymentStatus.COMPLETED) {
  //     throw new BadRequestException('Payment is not completed');
  //   }

  //   if (!payment.razorpayPaymentId) {
  //     throw new BadRequestException('Razorpay payment ID not found');
  //   }

  //   try {
  //     // Create refund in Razorpay
  //     const refund = await this.razorpay.payments.refund(
  //       payment.razorpayPaymentId,
  //       {
  //         amount: Math.round(payment.amount * 100),
  //         speed: 'normal',
  //         notes: {
  //           reason: 'Customer requested refund',
  //           orderId: payment.order.id,
  //         },
  //       },
  //     );

  //     // Update payment status
  //     payment.status = PaymentStatus.REFUNDED;
  //     payment.refundedAt = new Date();
  //     payment.razorpayRefundId = refund.id;
  //     payment.metadata = {
  //       ...payment.metadata,
  //       refund: refund,
  //     };
  //     await this.paymentRepository.save(payment);

  //     // Update order status
  //     payment.order.status = OrderStatus.CANCELLED;
  //     await this.orderRepository.save(payment.order);

  //     return {
  //       success: true,
  //       refund,
  //       message: 'Payment refunded successfully',
  //     };
  //   } catch (error) {
  //     this.logger.error('Error processing refund:', error);
  //     throw new BadRequestException('Failed to process refund');
  //   }
  // }

  // async capturePayment(paymentId: string, amount: number) {
  //   try {
  //     const capturedPayment = await this.razorpay.payments.capture(
  //       paymentId,
  //       amount * 100,
  //       'INR',
  //     );

  //     // Update payment record
  //     const payment = await this.paymentRepository.findOne({
  //       where: { razorpayPaymentId: paymentId },
  //       relations: ['order'],
  //     });

  //     if (payment) {
  //       payment.status = PaymentStatus.COMPLETED;
  //       payment.paidAt = new Date();
  //       payment.metadata = {
  //         ...payment.metadata,
  //         capturedPayment,
  //       };
  //       await this.paymentRepository.save(payment);

  //       // Update order status
  //       payment.order.status = OrderStatus.CONFIRMED;
  //       await this.orderRepository.save(payment.order);
  //     }

  //     return {
  //       success: true,
  //       capturedPayment,
  //       message: 'Payment captured successfully',
  //     };
  //   } catch (error) {
  //     this.logger.error('Error capturing payment:', error);
  //     throw new BadRequestException('Failed to capture payment');
  //   }
  // }

  // async handleRazorpayWebhook(req: Request) {
  //   const webhookSecret = configService.getValue('RAZORPAY_WEBHOOK_SECRET');
  //   const webhookSignature = req.headers['x-razorpay-signature'] as string;

  //   if (!webhookSignature) {
  //     throw new BadRequestException('Missing webhook signature');
  //   }

  //   try {
  //     // Verify webhook signature
  //     const expectedSignature = crypto
  //       .createHmac('sha256', webhookSecret)
  //       .update(JSON.stringify(req.body))
  //       .digest('hex');

  //     if (expectedSignature !== webhookSignature) {
  //       throw new BadRequestException('Invalid webhook signature');
  //     }

  //     const event = req.body;

  //     // Handle different webhook events
  //     switch (event.event) {
  //       case 'payment.captured':
  //         await this.handlePaymentCaptured(event.payload.payment.entity);
  //         break;
  //       case 'payment.failed':
  //         await this.handlePaymentFailed(event.payload.payment.entity);
  //         break;
  //       case 'refund.created':
  //         await this.handleRefundCreated(event.payload.refund.entity);
  //         break;
  //       default:
  //         this.logger.log(`Unhandled webhook event: ${event.event}`);
  //     }

  //     return { status: 'ok' };
  //   } catch (error) {
  //     this.logger.error('Webhook processing error:', error);
  //     throw new BadRequestException('Webhook processing failed');
  //   }
  // }

  // private async handlePaymentCaptured(paymentData: any) {
  //   const payment = await this.paymentRepository.findOne({
  //     where: { razorpayPaymentId: paymentData.id },
  //     relations: ['order'],
  //   });

  //   if (payment) {
  //     payment.status = PaymentStatus.COMPLETED;
  //     payment.paidAt = new Date();
  //     payment.metadata = {
  //       ...payment.metadata,
  //       webhookPayment: paymentData,
  //     };
  //     await this.paymentRepository.save(payment);

  //     // Update order status
  //     payment.order.status = OrderStatus.CONFIRMED;
  //     await this.orderRepository.save(payment.order);

  //     this.logger.log(`Payment ${payment.id} captured via webhook`);
  //   }
  // }

  // private async handlePaymentFailed(paymentData: any) {
  //   const payment = await this.paymentRepository.findOne({
  //     where: { razorpayPaymentId: paymentData.id },
  //     relations: ['order'],
  //   });

  //   if (payment) {
  //     payment.status = PaymentStatus.FAILED;
  //     payment.failureReason = paymentData.error_description || 'Payment failed';
  //     payment.metadata = {
  //       ...payment.metadata,
  //       webhookPayment: paymentData,
  //     };
  //     await this.paymentRepository.save(payment);

  //     this.logger.log(`Payment ${payment.id} failed via webhook`);
  //   }
  // }

  // private async handleRefundCreated(refundData: any) {
  //   const payment = await this.paymentRepository.findOne({
  //     where: { razorpayPaymentId: refundData.payment_id },
  //     relations: ['order'],
  //   });

  //   if (payment) {
  //     payment.status = PaymentStatus.REFUNDED;
  //     payment.refundedAt = new Date();
  //     payment.razorpayRefundId = refundData.id;
  //     payment.metadata = {
  //       ...payment.metadata,
  //       webhookRefund: refundData,
  //     };
  //     await this.paymentRepository.save(payment);

  //     // Update order status
  //     payment.order.status = OrderStatus.CANCELLED;
  //     await this.orderRepository.save(payment.order);

  //     this.logger.log(`Payment ${payment.id} refunded via webhook`);
  //   }
  // }
}
