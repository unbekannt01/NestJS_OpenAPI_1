import { IsString } from 'class-validator';

export class CreateRecentSearchDto {
    @IsString()
    query: string;
}
