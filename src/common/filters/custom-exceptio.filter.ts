import { UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "src/user/entities/user.entity";

/**
 * Custom exceptions for user authentication and authorization errors.
 * These exceptions extend the UnauthorizedException class from NestJS.
 */
export class UserBlockedException extends UnauthorizedException {
  constructor(loginAttemts: number) {
    super(`Account blocked due to ${loginAttemts} failed login attempts. Please contact support.`);
  }
}

/**
 * EmailNotVerifiedException
 * This exception is thrown when a user needs to verify their email.
 */
export class EmailNotVerifiedException extends UnauthorizedException {
  constructor(status: UserStatus) {
    super('User needs to verify their email!');
  }
}