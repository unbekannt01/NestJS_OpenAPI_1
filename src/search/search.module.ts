import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { RecentSearch } from './entity/recent-search.entity';
import { User } from '../user/entities/user.entity';
import { Car } from './entity/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecentSearch, User, Car])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
