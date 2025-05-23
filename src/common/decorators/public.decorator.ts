// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * Public
 * This decorator is used to mark routes as public, meaning they do not require authentication.
 * It sets a metadata key 'isPublic' to true.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public   
 * This function sets the metadata key 'isPublic' to true for the route it decorates.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
