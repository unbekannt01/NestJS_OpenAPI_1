import { UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "src/user/entities/user.entity";

export class UserBlockedException extends UnauthorizedException {
  constructor(loginAttemts: number) {
    super(`Account blocked due to ${loginAttemts} failed login attempts. Please contact support.`);
  }
}

export class AccountNotVerified extends UnauthorizedException {
  constructor(status: UserStatus) {
    super('User needs to verify their email!');
  }
}