import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Car } from '../entity/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
