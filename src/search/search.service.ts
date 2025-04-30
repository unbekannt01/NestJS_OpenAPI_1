import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { RecentSearch } from './entity/recent-search.entity';
import { User } from 'src/user/entities/user.entity';
import { Car } from './entity/car.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(RecentSearch) private readonly recentSearchRepository: Repository<RecentSearch>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async globalSearch(
    query: string,
    sortBy: string = 'brand',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    minPrice?: number,
    maxPrice?: number
  ) {
    if (!query || query.trim() === '') {
      throw new NotFoundException('Detail Not Found...! Please write something in a Search...!');
    }

    const normalizedQuery = query.toLowerCase();

    // Save recent search
    await this.recentSearchRepository.save({ query: normalizedQuery });

    // User search
    const userResults = await this.userRepository.find({
      where: [
        { email: ILike(`%${normalizedQuery}%`) },
        { userName: ILike(`%${normalizedQuery}%`) },
        { first_name: ILike(`%${normalizedQuery}%`) },
        { last_name: ILike(`%${normalizedQuery}%`) },
        { mobile_no: ILike(`%${normalizedQuery}%`) },
      ],
      select: ['id', 'email', 'userName', 'first_name', 'last_name', 'mobile_no'],
      take: 20,
    });

    // Car search (raw results first)
    const rawCarResults = await this.carRepository.find({
      where: [
        { brand: ILike(`%${normalizedQuery}%`) },
        { type: ILike(`%${normalizedQuery}%`) },
        { transmission: ILike(`%${normalizedQuery}%`) },
        { fuel: ILike(`%${normalizedQuery}%`) },
      ],
      select: ['id', 'brand', 'type', 'transmission', 'fuel', 'price'],
      order: { [sortBy]: sortOrder },
      take: 50, 
    });

    // Apply easy price filter
    const carResults = rawCarResults
      .filter(car => {
        const meetsMin = minPrice ? car.price >= minPrice : true;
        const meetsMax = maxPrice ? car.price <= maxPrice : true;
        return meetsMin && meetsMax;
      })
      // .slice(0, 20); // limit final results to 20

    return {
      users: userResults || null,
      cars: carResults || null,
    };
  }

  async getRecentSearches(limit: number = 10): Promise<string[]> {
    const results = await this.recentSearchRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return results.map(search => search.query);
  }

  async getAllCars(): Promise<Car[]> {
    return this.carRepository.find();
  }
}

