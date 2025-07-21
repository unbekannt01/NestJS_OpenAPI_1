import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Admin } from 'src/common/decorators/admin.decorator';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller({ path: 'orders', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Throttle({ default: { limit: 1, ttl: 30000 }})
  @Post('create')
  createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.orderService.createOrder(userId, createOrderDto);
  }

  @Get('my-orders')
  getMyOrders(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = (req.user as { id: string })?.id;
    return this.orderService.getUserOrders(userId, page, limit);
  }

  @Get('history') // You can choose a different path, e.g., 'all-orders'
  async getOrderHistory(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId = (req.user as { id: string })?.id;
    return this.orderService.getAllOrders(userId, page, limit);
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.orderService.getOrder(id, userId);
  }

  @Admin()
  @Get()
  getAllOrders(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = (req.user as { id: string })?.id;
    return this.orderService.getAllOrders(userId, page, limit);
  }

  @Admin()
  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, updateStatusDto.status);
  }

  // This endpoint is temporary for confirming orders
  @Patch('confirm/:orderId')
  confirmOrder(@Param('orderId') orderId: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.orderService.confirmOrder(orderId, userId);
  }

  @Delete(':id')
  deleteOrder(@Req() req: Request, @Param('id') orderId: string) {
    const userId = (req.user as { id: string }).id;
    return this.orderService.deleteOrder(orderId, userId);
  }
}
