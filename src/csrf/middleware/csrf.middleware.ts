import { Injectable, type NestMiddleware, ForbiddenException } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"
import { CsrfService } from "../csrf.service"

interface RequestWithCsrf extends Request {
  csrfToken?: string
}

/**
 * CsrfMiddleware
 * This middleware validates CSRF tokens for state-changing requests.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: RequestWithCsrf, res: Response, next: NextFunction) {
    const safeMethods = ["GET", "HEAD", "OPTIONS"]
    const excludedPaths = [
      "/v1/auth/login",
      "/v1/auth/register",
      "/v1/auth/refresh-token",
      "/v1/password/forgot-password",
      "/v1/password/reset-password",
      "/v1/csrf/token",
      "/v1/google/google-login",
      "/v1/otp/verify-otp",
      "/v1/otp/resend-otp",
      "/v1/email-verification-by-link/verify-email",
      "/v1/email-verification-by-link/resend-verification",
    ]

    if (safeMethods.includes(req.method)) return next()

    if (excludedPaths.some((path) => req.path.startsWith(path))) return next()

    const token = (req.headers["csrf-token"] || req.headers["x-csrf-token"] || req.body?._csrf) as string | undefined
    const cookieToken = req.cookies?.["csrf-token"] as string | undefined

    if (!token || !cookieToken) {
      throw new ForbiddenException("CSRF token missing")
    }

    if (token !== cookieToken) {
      throw new ForbiddenException("CSRF token mismatch")
    }

    if (!this.csrfService.verifyToken(token)) {
      throw new ForbiddenException("Invalid CSRF token")
    }

    next()
  }
}
