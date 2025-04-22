import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { SearchService } from './search.service';
import { RecentSearchInterceptor } from 'src/common/interceptors/recent-search.interceptor';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseInterceptors(RecentSearchInterceptor)
  @Get()
  async search(@Query('query') query: string) {
    return this.searchService.searchUsers(query || '');
  }
}

