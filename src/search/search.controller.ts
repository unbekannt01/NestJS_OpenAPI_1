import { Controller, Get, Logger, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { PaginationQueryDto } from 'src/user/dto/pagination-query.dto';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * SearchController handles search-related operations such as global search,
 * retrieving recent searches, and pagination.
 */
@Public()
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * globalSearch
   * This method performs a global search based on the provided query,
   */
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

  /**
   * getRecent
   * This method retrieves recent searches based on the provided limit.
   */
  @Get('recentSearch')
  async getRecent(@Query('limit') limit?: number) {
    return this.searchService.getRecentSearches(limit || 10);
  }

  /**
   * findAll
   * This method retrieves all users with pagination.
   */
  @Get('/pagination')
  async findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.searchService.getAllUser(paginationDto);
  }
}
