import {
  Controller,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  Headers,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { Request } from 'express';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { configService } from 'src/common/services/config.service';

@Controller({ path: 'payment', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @UseGuards(AuthGuard('jwt'))
  async createOrder(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;
    return await this.paymentService.createRazorpayOrder(
      userId,
      createPaymentIntentDto,
    );
  }

  @Post('verify')
  async verifyPayment(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;
    return this.paymentService.verifyRazorpayPayment(userId, confirmPaymentDto);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = (req.body as Buffer).toString();
    const secret = configService.getValue('RAZORPAY_WEBHOOK_SECRET');

    const isValid = await this.paymentService.verifySignature(
      rawBody,
      signature,
      secret,
    );

    if (!isValid) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    const payload = JSON.parse(rawBody);
    const paymentEntity = payload?.payload?.payment?.entity;

    if (payload.event === 'payment.captured' && paymentEntity) {
      await this.paymentService.processWebhookPayment(paymentEntity);
    }

    return { success: true, message: 'Webhook processed' };
  }

  // @Post('create-order')
  // @UseGuards(AuthGuard('jwt'))
  // async createRazorpayOrder(
  //   @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  //   @Req() req: Request,
  // ) {
  //   const userId = (req.user as { id: string })?.id;
  //   return this.paymentService.createRazorpayOrder(
  //     userId,
  //     createPaymentIntentDto,
  //   );
  // }

  // @Get('my-payments')
  // async getMyPayments(@Req() req: Request) {
  //   const userId = (req.user as { id: string})?.id;
  //   return this.paymentService.getUserPayments(userId);
  // }

  // @Get(':id')
  // async getPayment(@Param('id') id: string, @Req() req: Request) {
  //   const userId = (req.user as { id: string})?.id;
  //   return this.paymentService.getPayment(id, userId);
  // }

  // @Admin()
  // @Get()
  // async getAllPayments() {
  //   return this.paymentService.getAllPayments();
  // }

  // @Admin()
  // @Patch(':id/refund')
  // async refundPayment(@Param('id') id: string) {
  //   return this.paymentService.refundPayment(id);
  // }

  // @Public()
  // @Post('webhook')
  // async handleWebhook(@Req() req: Request) {
  //   return this.paymentService.handleRazorpayWebhook(req);
  // }

  // @Post('capture/:paymentId')
  // async capturePayment(
  //   @Param('paymentId') paymentId: string,
  //   @Body() body: { amount: number },
  // ) {
  //   return this.paymentService.capturePayment(paymentId, body.amount);
  // }
}
