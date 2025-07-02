import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Request } from 'express';

@Controller({ path: 'reviews', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createReview(createReviewDto: CreateReviewDto, @Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.reviewService.createReview(userId, createReviewDto);
  }

  @Get('product/:productId')
  @Public()
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewService.getProductReviews(productId, page, limit);
  }

  @Get('my-reviews')
  @UseGuards(AuthGuard('jwt'))
  getMyReviews(@Req() req: Request) {
    const userId = (req.user as { id: string })?.id;
    return this.reviewService.getUserReviews(userId);
  }
}
