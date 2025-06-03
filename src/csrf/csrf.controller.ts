import { Controller, Get, Res } from "@nestjs/common"
import  { Response } from "express"
import  { CsrfService } from "./csrf.service"
import { Public } from "src/common/decorators/public.decorator"

/**
 * CsrfController
 * This controller handles CSRF token generation endpoints.
 */
@Public()
@Controller({ path: "csrf", version: "1" })
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Generate and return a CSRF token
   */
  @Get("token")
  getCsrfToken(@Res() res: Response) {
    const token = this.csrfService.generateToken()

    // Set CSRF token in cookie
    res.cookie("csrf-token", token, {
      httpOnly: false, // Allow JavaScript access for this cookie
      secure: process.env.NODE_ENV === "development",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    })

    return {
      csrfToken: token,
      message: "CSRF token generated successfully",
    }
  }
}
