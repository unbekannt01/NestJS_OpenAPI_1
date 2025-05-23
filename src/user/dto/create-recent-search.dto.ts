import { IsString } from 'class-validator';

/**
 * CreateRecentSearchDto
 * This DTO is used for creating a recent search.
 */
export class CreateRecentSearchDto {

    @IsString()
    query: string;
}
