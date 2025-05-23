import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser
 * This decorator is used to extract the current user from the request object.
 * It can be used in route handlers to get the details of the authenticated user.
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
