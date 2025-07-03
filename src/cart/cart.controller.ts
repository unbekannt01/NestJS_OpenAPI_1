import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller({ path: 'cart', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.cartService.getCart(userId);
  }

  @Post('add/:productId')
  addToCart(
    @Param('productId') productId: string,
    @Query('quantity') quantity: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;
    return this.cartService.addToCart(userId, productId, quantity);
  }

  @Patch('update/:itemId')
  updateCartItem(
    @Param('itemId') itemId: string,
    @Query('quantity') quantity: number,
  ) {
    return this.cartService.updateCartItem(itemId, quantity);
  }

  @Delete('remove/:itemId')
  async removeFromCart(@Param('itemId') itemId: string) {
    await this.cartService.removeFromCart(itemId);
    return { message: 'Removed from the Cart...!' };
  }

  @Delete('clear')
  clearCart(@Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.cartService.clearCart(userId);
  }
}
