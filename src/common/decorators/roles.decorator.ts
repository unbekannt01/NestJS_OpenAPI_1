import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/entities/user.entity';

/**
 * Roles
 * This decorator is used to set the roles required to access a route.
 * It sets a metadata key 'roles' with the specified roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles
 * This function is used to create a custom decorator that sets the roles metadata.
 * It takes a variable number of UserRole arguments and sets them as metadata.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
