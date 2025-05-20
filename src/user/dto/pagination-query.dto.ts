import { Type } from 'class-transformer';

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
