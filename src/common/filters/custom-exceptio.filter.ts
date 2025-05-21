import { UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "src/user/entities/user.entity";

// custom-exceptions.ts
export class UserBlockedException extends UnauthorizedException {
  constructor(loginAttemts: number) {
    super(`Account blocked due to ${loginAttemts} failed login attempts. Please contact support.`);
  }
}

export class EmailNotVerifiedException extends UnauthorizedException {
  constructor(status: UserStatus) {
    super('User needs to verify their email!');
  }
}