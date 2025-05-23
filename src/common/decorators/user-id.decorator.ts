import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * UserId
 * This decorator is used to extract the user ID from the request object.
 * It can be used in route handlers to get the ID of the authenticated user.
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);