import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';

/**
 * UpdateUserDto
 * This DTO is used for updating user information.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
