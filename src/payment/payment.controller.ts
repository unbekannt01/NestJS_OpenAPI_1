import { Controller, Post, Body, UseGuards, Query, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { Request } from 'express';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

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
