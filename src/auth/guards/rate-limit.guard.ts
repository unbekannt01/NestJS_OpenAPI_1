import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { User } from "src/user/entities/user.entity"

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly userRepository: Repository<User>

  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const ip = request.ip
    const email = request.body?.identifier || request.body?.email

    // Implement rate limiting logic here
    // Check attempts per IP and per email
    // Block if too many attempts

    return true
  }
}
