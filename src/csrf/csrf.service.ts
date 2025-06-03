import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as crypto from "crypto"

/**
 * CsrfService
 * This service handles CSRF token generation and validation logic.
 */
@Injectable()
export class CsrfService {
  private readonly csrfSecret: string

  constructor(private configService: ConfigService) {
    // Use a default secret if not provided to avoid delays
    this.csrfSecret = this.configService.get<string>("CSRF_SECRET") || "default-csrf-secret-for-development-only"
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    try {
      const timestamp = Date.now().toString()
      const randomBytes = crypto.randomBytes(16).toString("hex")
      const data = `${timestamp}-${randomBytes}`
      const signature = crypto.createHmac("sha256", this.csrfSecret).update(data).digest("hex")

      return `${data}.${signature}`
    } catch (error) {
      console.error("Error generating CSRF token:", error)
      // Return a fallback token in case of error
      const timestamp = Date.now().toString()
      return `${timestamp}.fallback`
    }
  }

  /**
   * Verify a CSRF token
   */
  verifyToken(token: string): boolean {
    try {
      const [data, signature] = token.split(".")
      if (!data || !signature) return false

      const expectedSignature = crypto.createHmac("sha256", this.csrfSecret).update(data).digest("hex")

      if (signature !== expectedSignature) return false

      const [timestamp] = data.split("-")
      const tokenAge = Date.now() - Number.parseInt(timestamp)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      return tokenAge < maxAge
    } catch {
      return false
    }
  }
}
