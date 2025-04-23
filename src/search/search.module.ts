import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { RecentSearch } from './entity/recent-search.entity';
import { User } from '../user/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([RecentSearch, User])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
