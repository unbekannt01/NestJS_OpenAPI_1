import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Car } from '../entity/car.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Car) private readonly userRepository: Repository<Car>,
  ) {}

  async searchUsers(query: string) {
    if (!query) return [];
    return this.userRepository.find({
      where: [
        { manufacturer: ILike(`%${query}%`) },
        { vehicle: ILike(`%${query}%`) },
        { model: ILike(`%${query}%`) },
        { type: ILike(`%${query}%`) },
        { fuel: ILike(`%${query}%`) },
        { color: ILike(`%${query}%`) },
        { vrm: ILike(`%${query}%`) },
      ],
      select: [
       'manufacturer',
       'vehicle',
       'model',
       'type',
       'fuel',
       'color',
       'vrm' 
      ],
      take: 20,
    });
  }
}
