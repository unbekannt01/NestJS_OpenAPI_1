import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { RecentSearch } from './entity/recent-search.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(RecentSearch) private readonly recentSearchRepository: Repository<RecentSearch>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) { }

  async searchUser(query: string) {
    if (!query || query.trim() === '') {
      throw new NotFoundException('Detail Not Found...! Please write something in a Search...!');
    }

    const normalizedQuery = query.toLowerCase();  // Normalize query to lowercase

    // Save recent search (anonymous)
    await this.recentSearchRepository.save({ query: normalizedQuery });

    // Perform case-insensitive search on multiple fields
    return this.userRepository.find({
      where: [
        { email: ILike(`%${normalizedQuery}%`) },
        { userName: ILike(`%${normalizedQuery}%`) },
        { first_name: ILike(`%${normalizedQuery}%`) },
        { last_name: ILike(`%${normalizedQuery}%`) },
        { mobile_no: ILike(`%${normalizedQuery}%`) },
      ],
      select: ['email', 'userName', 'first_name', 'last_name', 'mobile_no'],
      take: 20,
    });
  }

  // async getRecentSearches(limit = 10) {
  //   return this.recentSearchRepository.find({
  //     order: { createdAt: 'DESC' },
  //     take: limit,
  //   });
  // }

}
