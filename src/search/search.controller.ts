import { Controller, Get, ParseFloatPipe, ParseIntPipe, Query, UseInterceptors } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller({path:'search', version: '1'})
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get('search')
  search(
    @Query('query') query: string,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('sortBy') sortBy: string = 'brand',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    return this.searchService.globalSearch(query, sortBy, sortOrder, minPrice, maxPrice);
  }

  @Get('getAllCars')
  async getAllCars() {
    return this.searchService.getAllCars();
  }

  @Get('recentSearch')
  async getRecent(@Query('limit') limit?: number) {
    return this.searchService.getRecentSearches(limit || 10);
  }
}

