import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  ILike,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
} from 'typeorm';
import { RecentSearch } from './entity/recent-search.entity';
import { User } from 'src/user/entities/user.entity';
import { Car } from './entity/car.entity';
import { PaginationQueryDto } from 'src/user/dto/pagination-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(RecentSearch)
    private readonly recentSearchRepository: Repository<RecentSearch>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async globalSearch(
  //   paginationDto: PaginationQueryDto & {
  //     query?: string;
  //     minPrice?: number;
  //     maxPrice?: number;
  //     sortBy?: string;
  //     sortOrder?: 'ASC' | 'DESC';
  //   },
  // ) {
  //   const {
  //     limit = 10,
  //     offset = 0,
  //     query,
  //     minPrice,
  //     maxPrice,
  //     sortBy = 'brand',
  //     sortOrder = 'ASC',
  //   } = paginationDto;

  //   const where: any[] = [];

  //   if (query && query.trim() !== '') {
  //     const normalizedQuery = query.toLowerCase();
  //     where.push(
  //       { brand: ILike(`%${normalizedQuery}%`) },
  //       { type: ILike(`%${normalizedQuery}%`) },
  //       { transmission: ILike(`%${normalizedQuery}%`) },
  //       { fuel: ILike(`%${normalizedQuery}%`) },
  //     );
  //   }

  //   // Apply price filtering
  //   if (minPrice !== undefined || maxPrice !== undefined) {
  //     where.forEach((cond, index) => {
  //       where[index] = {
  //         ...cond,
  //         price:
  //           minPrice && maxPrice
  //             ? Between(minPrice, maxPrice)
  //             : minPrice
  //               ? MoreThanOrEqual(minPrice)
  //               : LessThanOrEqual(maxPrice),
  //       };
  //     });
  //   }

  //   const [cars, total] = await this.carRepository.findAndCount({
  //     where: where.length > 0 ? where : undefined,
  //     order: { [sortBy]: sortOrder },
  //     take: limit,
  //     skip: offset,
  //   });

  //   return {
  //     data: cars,
  //     total,
  //     limit,
  //     offset,
  //     nextPage: total > offset + limit ? offset + limit : null,
  //   };
  // }

  async globalSearch(
    paginationDto: PaginationQueryDto & {
      query?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ) {
    const {
      limit = 10,
      offset = 0,
      query,
      minPrice,
      maxPrice,
      sortBy = 'brand',
      sortOrder = 'ASC',
    } = paginationDto;

    const parsedLimit = Number(limit) || 10;
    const parsedOffset = Number(offset) || 0;

    const queryBuilder = this.carRepository.createQueryBuilder('car');

    if (query?.trim()) {
      const normalizedQuery = `%${query.toLowerCase()}%`;
      queryBuilder.andWhere(
        `(LOWER(car.brand) ILIKE :q OR LOWER(car.type) ILIKE :q OR LOWER(car.transmission) ILIKE :q OR LOWER(car.fuel) ILIKE :q)`,
        { q: normalizedQuery },
      );
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('car.price BETWEEN :min AND :max', {
        min: minPrice,
        max: maxPrice,
      });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('car.price >= :min', { min: minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('car.price <= :max', { max: maxPrice });
    }

    queryBuilder
      .orderBy(`car.${sortBy}`, sortOrder)
      .skip(parsedOffset)
      .take(parsedLimit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      total: total,
      limit: parsedLimit,
      offset: parsedOffset,
      nextPage:
        total > parsedOffset + parsedLimit ? parsedOffset + parsedLimit : null,
    };
  }

  async getRecentSearches(limit: number = 10): Promise<string[]> {
    const results = await this.recentSearchRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return results.map((search) => search.query);
  }

  async getAllUser(paginationDto: PaginationQueryDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [products, total] = await this.carRepository.findAndCount({
      take: limit,
      skip: offset,
    });

    return {
      data: products,
      total: total,
      limit,
      offset,
      nextPage: total > offset + limit ? offset + limit : null,
    };
  }
}

// async getAllCars(): Promise<Car[]> {
//   return this.carRepository.find();
// }
