import { Controller, Get, Logger, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { PaginationQueryDto } from 'src/user/dto/pagination-query.dto';
import { Public } from 'src/user/decorators/public.decorator';

@Public()
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  async globalSearch(
    @Query()
    paginationDto: PaginationQueryDto & {
      query?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ) {
    return this.searchService.globalSearch(paginationDto);
  }

  @Get('recentSearch')
  async getRecent(@Query('limit') limit?: number) {
    return this.searchService.getRecentSearches(limit || 10);
  }

  @Get('/pagination')
  async findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.searchService.getAllUser(paginationDto);
  }
}
