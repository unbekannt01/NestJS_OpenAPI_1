import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const product = await this.productRepository.findOne({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: createReviewDto.productId },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = this.reviewRepository.create({
      user: user as { id: string },
      product,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update product average rating
    await this.updateProductRating(createReviewDto.productId);

    return savedReview;
  }

  async getProductReviews(productId: string, page: number, limit: number) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(userId: string) {
    return this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId } },
    });

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.productRepository.update(productId, {
      averageRating: Math.round(averageRating * 100) / 100,
      reviewCount: reviews.length,
    });
  }
}
