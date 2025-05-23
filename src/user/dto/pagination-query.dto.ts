import { Type } from 'class-transformer';

/**
 * PaginationQueryDto
 * This class is used to define the pagination query parameters for the API.
 */
export class PaginationQueryDto {
  @Type(() => Number)
  limit?: number;

  @Type(() => Number)
  offset?: number;

  query?: string;

  minPrice?: number;

  maxPrice?: number;

  sortBy?: string;

  sortOrder?: 'ASC' | 'DESC';
}
