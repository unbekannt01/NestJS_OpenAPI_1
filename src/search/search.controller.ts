import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/search')
  search(@Query('query') query: string) {
    return this.searchService.searchUser(query);
  }

  // @Get('/recent-search')
  // getRecentSearches(@Query('limit') limit?: number) {
  //   return this.searchService.getRecentSearches(limit);
  // }
}

